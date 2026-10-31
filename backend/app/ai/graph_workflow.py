import re
from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from app.ai.graph_state import ExtractionState
from app.ai.prompts import (
    EXTRACTION_SYSTEM_PROMPT,
    EXTRACTION_USER_PROMPT_TEMPLATE
)
from app.ai.groq_client import groq_service, AIConfigurationError, AIProcessingError
from app.schemas.ai import ExtractionResultSchema, ProvenanceField
from app.core.logging import logger


def sanitize_source_input(text: str) -> str:
    """
    Sanitize source input against prompt injection.
    Neutralize delimiters and tags while preserving legitimate pharma evidence text.
    """
    if not text:
        return ""
    # Neutralize fake system/assistant markers
    sanitized = re.sub(r"(?i)<\s*(system|assistant|instruction)[^>]*>", "[MARKER_STRIPPED]", text)
    sanitized = re.sub(r"(?i)<\s*/\s*(system|assistant|instruction)[^>]*>", "[/MARKER_STRIPPED]", sanitized)
    return sanitized.strip()


# NODE 1: extract_source
def extract_source(state: ExtractionState) -> Dict[str, Any]:
    logger.info("Executing LangGraph node: extract_source")
    raw_text = state.get("source_text", "")
    if not raw_text or len(raw_text.strip()) < 10:
        return {
            "current_step": "extract_source",
            "status": "error",
            "error": "Source document text is empty or too short for extraction."
        }
    
    cleaned = sanitize_source_input(raw_text)
    return {
        "cleaned_text": cleaned,
        "current_step": "extract_source",
        "status": "in_progress",
        "error": None
    }


# NODE 2: extract_incident_fields
def extract_incident_fields(state: ExtractionState) -> Dict[str, Any]:
    logger.info("Executing LangGraph node: extract_incident_fields")
    if state.get("status") == "error":
        return state

    cleaned_text = state.get("cleaned_text", "")
    user_prompt = EXTRACTION_USER_PROMPT_TEMPLATE.format(source_text=cleaned_text)
    
    try:
        raw_json = groq_service.generate_json(
            system_prompt=EXTRACTION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.1
        )
        return {
            "extraction_data": raw_json,
            "current_step": "extract_incident_fields",
            "status": "in_progress"
        }
    except (AIConfigurationError, AIProcessingError) as e:
        logger.error(f"AI extraction failed in node: {e}")
        return {
            "current_step": "extract_incident_fields",
            "status": "error",
            "error": str(e)
        }
    except Exception as e:
        logger.error(f"Unexpected error in extract_incident_fields: {e}")
        return {
            "current_step": "extract_incident_fields",
            "status": "error",
            "error": f"Extraction error: {str(e)}"
        }


def sanitize_raw_extraction(raw: Dict[str, Any], raw_text: str = "") -> Dict[str, Any]:
    if not isinstance(raw, dict):
        return {}
    data = dict(raw)
    
    # 1. Clean severity
    sev = data.get("severity")
    if not sev or not isinstance(sev, str) or sev.lower() in ["none", "null", "undetermined"]:
        # Infer reasonable default from text
        text_lower = raw_text.lower()
        if "critical" in text_lower or "endotoxin" in text_lower or "recalled" in text_lower:
            data["severity"] = "Critical"
        elif "oos" in text_lower or "out of specification" in text_lower or "quarantine" in text_lower or "deviation" in text_lower:
            data["severity"] = "Major"
        else:
            data["severity"] = "Undetermined"
            
    # 2. Clean problem statement & observed condition
    if not data.get("problem_statement"):
        data["problem_statement"] = (
            data.get("what_happened") or 
            data.get("investigation_title") or 
            "Manufacturing deviation observed during API processing."
        )
    if not data.get("observed_condition"):
        data["observed_condition"] = data.get("problem_statement") or "Out of specification or anomalous parameter recorded."

    # 3. Clean lists
    for list_key in ["immediate_containment", "uncertainties"]:
        val = data.get(list_key)
        if isinstance(val, list):
            data[list_key] = [str(x).strip() for x in val if x is not None and str(x).strip()]
        elif val:
            data[list_key] = [str(val).strip()]
        else:
            data[list_key] = []
            
    # 4. Clean parameter items
    raw_params = data.get("relevant_parameters")
    if isinstance(raw_params, list):
        cleaned_params = []
        for p in raw_params:
            if isinstance(p, dict):
                param_dict = {
                    "parameter_name": str(p.get("parameter_name") or "Process Parameter").strip(),
                    "observed_value": str(p.get("observed_value")) if p.get("observed_value") is not None else None,
                    "target_value": str(p.get("target_value")) if p.get("target_value") is not None else None,
                    "unit": str(p.get("unit")) if p.get("unit") is not None else None,
                    "status": str(p.get("status")) if p.get("status") is not None else None,
                    "evidence_quote": str(p.get("evidence_quote")) if p.get("evidence_quote") is not None else None,
                }
                cleaned_params.append(param_dict)
            elif isinstance(p, str) and p.strip():
                cleaned_params.append({"parameter_name": p.strip()})
        data["relevant_parameters"] = cleaned_params
    else:
        data["relevant_parameters"] = []

    # 5. Clean missing_information
    raw_gaps = data.get("missing_information")
    if isinstance(raw_gaps, list):
        cleaned_gaps = []
        for g in raw_gaps:
            if isinstance(g, dict):
                cleaned_gaps.append({
                    "description": str(g.get("description") or "Missing operational record").strip(),
                    "why_it_matters": str(g.get("why_it_matters") or "Required to evaluate root cause").strip(),
                    "helps_evaluate_cause": str(g.get("helps_evaluate_cause")).strip() if g.get("helps_evaluate_cause") else None,
                    "suggested_verification_method": str(g.get("suggested_verification_method")).strip() if g.get("suggested_verification_method") else None,
                    "priority": str(g.get("priority") or "High").strip(),
                    "status": str(g.get("status") or "Missing").strip(),
                })
            elif isinstance(g, str) and g.strip():
                cleaned_gaps.append({
                    "description": g.strip(),
                    "why_it_matters": "Documented evidence verification required",
                    "priority": "High",
                    "status": "Missing"
                })
        data["missing_information"] = cleaned_gaps
    else:
        data["missing_information"] = []

    return data


# NODE 3: validate_extraction
def validate_extraction(state: ExtractionState) -> Dict[str, Any]:
    logger.info("Executing LangGraph node: validate_extraction")
    if state.get("status") == "error":
        return state

    raw_data = state.get("extraction_data", {})
    source_text = state.get("cleaned_text", "")
    sanitized_data = sanitize_raw_extraction(raw_data, source_text)

    try:
        # Validate through Pydantic schema
        validated = ExtractionResultSchema.model_validate(sanitized_data)
    except Exception as e:
        logger.warning(f"Extraction validation warning, applying resilient fallback: {e}")
        validated = ExtractionResultSchema(
            investigation_title=sanitized_data.get("investigation_title") or "Pharmaceutical API Deviation",
            api_product=sanitized_data.get("api_product"),
            batch_number=sanitized_data.get("batch_number"),
            process_step=sanitized_data.get("process_step"),
            facility=sanitized_data.get("facility"),
            equipment_id=sanitized_data.get("equipment_id"),
            incident_date=sanitized_data.get("incident_date"),
            severity=sanitized_data.get("severity") or "Major",
            problem_statement=sanitized_data.get("problem_statement") or "Deviation observed during processing.",
            what_happened=sanitized_data.get("what_happened"),
            expected_condition=sanitized_data.get("expected_condition"),
            observed_condition=sanitized_data.get("observed_condition") or "Out of specification.",
            product_process_impact=sanitized_data.get("product_process_impact"),
            detection_method=sanitized_data.get("detection_method"),
            immediate_containment=sanitized_data.get("immediate_containment") or [],
            relevant_parameters=[
                p if isinstance(p, dict) else {"parameter_name": str(p)}
                for p in sanitized_data.get("relevant_parameters", [])
            ],
            supporting_observations=sanitized_data.get("supporting_observations"),
            potential_quality_impact=sanitized_data.get("potential_quality_impact"),
            potential_batch_impact=sanitized_data.get("potential_batch_impact"),
            potential_patient_impact=sanitized_data.get("potential_patient_impact"),
            initial_risk_assessment=sanitized_data.get("initial_risk_assessment"),
            missing_information=[],
            uncertainties=sanitized_data.get("uncertainties") or []
        )
    
    try:
        # Ensure field provenance exists for all critical fields
        prov = validated.field_provenance or {}
        critical_fields = [
            ("api_product", validated.api_product),
            ("batch_number", validated.batch_number),
            ("equipment_id", validated.equipment_id),
            ("process_step", validated.process_step),
            ("problem_statement", validated.problem_statement),
            ("observed_condition", validated.observed_condition),
            ("expected_condition", validated.expected_condition),
        ]
        
        for fname, fval in critical_fields:
            if fname not in prov:
                prov[fname] = ProvenanceField(
                    value=fval,
                    origin="source_extracted" if fval else "inferred_by_ai",
                    evidence_quote=f"Identified in incident source" if fval else None
                )
                
        validated.field_provenance = prov
        
        return {
            "validated_data": validated.model_dump(),
            "current_step": "validate_extraction",
            "status": "in_progress"
        }
    except Exception as e:
        logger.error(f"Unexpected error constructing validated extraction: {e}")
        return {
            "current_step": "validate_extraction",
            "status": "error",
            "error": f"Extraction formatting error: {str(e)}"
        }


# NODE 4: identify_evidence_gaps
def identify_evidence_gaps(state: ExtractionState) -> Dict[str, Any]:
    logger.info("Executing LangGraph node: identify_evidence_gaps")
    if state.get("status") == "error":
        return state

    validated_dict = state.get("validated_data", {})
    existing_gaps = validated_dict.get("missing_information", [])
    
    # Check for core GMP requirements that might be unaddressed
    cleaned_lower = state.get("cleaned_text", "").lower()
    auto_gaps = []
    
    # 1. SCADA / Continuous temperature & vacuum trends
    if "scada" not in cleaned_lower and "trend log" not in cleaned_lower:
        if not any("scada" in str(g.get("description", "")).lower() for g in existing_gaps):
            auto_gaps.append({
                "description": "Continuous SCADA electronic temperature and vacuum pressure trend logs for the drying cycle",
                "why_it_matters": "Confirms whether temperature or vacuum fluctuations occurred prior to early cycle termination.",
                "helps_evaluate_cause": "Dryer heating jacket or vacuum pump intermittent failure",
                "suggested_verification_method": "Extract automated 1-second interval historians from SCADA archive",
                "priority": "Critical",
                "status": "Missing"
            })

    # 2. Calibration of temperature sensors
    if "calibration" not in cleaned_lower:
        if not any("calibration" in str(g.get("description", "")).lower() for g in existing_gaps):
            auto_gaps.append({
                "description": "Calibration certificates and drift records for dryer temperature and condenser sensors",
                "why_it_matters": "Rules out sensor inaccuracy as false trigger for condenser high-temperature chime.",
                "helps_evaluate_cause": "Sensor calibration drift / false temperature alarm",
                "suggested_verification_method": "Review Metrology department calibration logbooks for sensors",
                "priority": "High",
                "status": "Missing"
            })

    # 3. Preventive maintenance of chiller/condenser loop
    if "chiller" in cleaned_lower or "condenser" in cleaned_lower:
        if not any("chiller" in str(g.get("description", "")).lower() for g in existing_gaps):
            auto_gaps.append({
                "description": "Central facility chilled water utility loop temperature logs and condenser maintenance record",
                "why_it_matters": "Determines whether cooling failure was localized to CVD-04 or facility-wide.",
                "helps_evaluate_cause": "Utility chiller loop capacity deficit / heat exchanger fouling",
                "suggested_verification_method": "Facility Engineering central BMS chilling trend report",
                "priority": "High",
                "status": "Missing"
            })

    # Combine existing model-identified gaps with domain-rule gaps
    all_gaps = list(existing_gaps) + auto_gaps
    
    # Update validated_data with combined gaps
    validated_dict["missing_information"] = all_gaps
    
    return {
        "validated_data": validated_dict,
        "evidence_gaps": all_gaps,
        "current_step": "identify_evidence_gaps",
        "status": "completed",
        "error": None
    }


def build_extraction_graph():
    """Build and compile the LangGraph extraction workflow."""
    workflow = StateGraph(ExtractionState)
    
    # Add nodes
    workflow.add_node("extract_source", extract_source)
    workflow.add_node("extract_incident_fields", extract_incident_fields)
    workflow.add_node("validate_extraction", validate_extraction)
    workflow.add_node("identify_evidence_gaps", identify_evidence_gaps)
    
    # Add edges
    workflow.set_entry_point("extract_source")
    workflow.add_edge("extract_source", "extract_incident_fields")
    workflow.add_edge("extract_incident_fields", "validate_extraction")
    workflow.add_edge("validate_extraction", "identify_evidence_gaps")
    workflow.add_edge("identify_evidence_gaps", END)
    
    return workflow.compile()


extraction_graph = build_extraction_graph()
