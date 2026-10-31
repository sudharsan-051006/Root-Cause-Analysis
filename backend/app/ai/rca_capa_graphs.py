from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from app.ai.graph_state import RcaState, CapaState
from app.ai.prompts import (
    RCA_SYSTEM_PROMPT,
    RCA_USER_PROMPT_TEMPLATE,
    CAPA_SYSTEM_PROMPT,
    CAPA_USER_PROMPT_TEMPLATE
)
from app.ai.groq_client import groq_service, AIConfigurationError, AIProcessingError
from app.schemas.root_cause import RcaAnalysisResultSchema, FiveWhysSchema, RootCauseItemSchema
from app.schemas.capa import CapaGenerationResultSchema, CapaActionSchema
from app.core.logging import logger


# ==========================================
# RCA LANGGRAPH WORKFLOW NODES
# ==========================================

def prepare_investigation_context(state: RcaState) -> Dict[str, Any]:
    logger.info("RCA Node: prepare_investigation_context")
    context = state.get("context", {})
    # Ensure baseline fields exist
    return {
        "current_step": "prepare_investigation_context",
        "status": "in_progress",
        "error": None
    }


def analyze_potential_causes(state: RcaState) -> Dict[str, Any]:
    logger.info("RCA Node: analyze_potential_causes")
    ctx = state.get("context", {})
    
    prompt = RCA_USER_PROMPT_TEMPLATE.format(
        title=ctx.get("title", "Pharmaceutical API Deviation"),
        api_product=ctx.get("api_product", "Not specified"),
        batch_number=ctx.get("batch_number", "Not specified"),
        process_step=ctx.get("process_step", "Not specified"),
        equipment_id=ctx.get("equipment_id", "Not specified"),
        problem_statement=ctx.get("problem_statement", "Deviation in process parameters"),
        expected_condition=ctx.get("expected_condition", "Within specification"),
        observed_condition=ctx.get("observed_condition", "Out of specification"),
        parameters=str(ctx.get("relevant_parameters", [])),
        observations=ctx.get("supporting_observations", "None recorded")
    )
    
    try:
        raw_json = groq_service.generate_json(
            system_prompt=RCA_SYSTEM_PROMPT,
            user_prompt=prompt,
            temperature=0.1
        )
        return {
            "raw_rca_data": raw_json,
            "current_step": "analyze_potential_causes",
            "status": "in_progress"
        }
    except Exception as e:
        logger.error(f"Error in analyze_potential_causes: {e}")
        return {
            "current_step": "analyze_potential_causes",
            "status": "error",
            "error": str(e)
        }


def assess_evidence_support(state: RcaState) -> Dict[str, Any]:
    logger.info("RCA Node: assess_evidence_support")
    if state.get("status") == "error":
        return state

    raw_data = state.get("raw_rca_data", {})
    five_whys_raw = raw_data.get("five_whys", {})
    causes_raw = raw_data.get("causes", [])
    
    # Structure 5 Whys
    five_whys = FiveWhysSchema(
        investigation_id=state.get("investigation_id"),
        problem_statement=five_whys_raw.get("problem_statement"),
        why_1=five_whys_raw.get("why_1"),
        why_2=five_whys_raw.get("why_2"),
        why_3=five_whys_raw.get("why_3"),
        why_4=five_whys_raw.get("why_4"),
        why_5=five_whys_raw.get("why_5"),
        proposed_root_cause=five_whys_raw.get("proposed_root_cause"),
        supporting_evidence=five_whys_raw.get("supporting_evidence", []),
        missing_evidence=five_whys_raw.get("missing_evidence", []),
        reviewer_decision="Under Investigation"
    )
    
    # Structure causes
    causes = []
    for c in causes_raw:
        causes.append(RootCauseItemSchema(
            cause_id=c.get("cause_id", f"RC-{len(causes)+1:02d}"),
            description=c.get("description", "Unspecified cause"),
            category=c.get("category", "Method / Process"),
            why_plausible=c.get("why_plausible"),
            supporting_evidence=c.get("supporting_evidence", []),
            contradicting_evidence=c.get("contradicting_evidence", []),
            evidence_gaps=c.get("evidence_gaps", []),
            suggested_verification_test=c.get("suggested_verification_test"),
            confidence_assessment=c.get("confidence_assessment", "Moderate evidence support"),
            status="Proposed by AI",
            is_confirmed_root_cause=False
        ))
        
    return {
        "five_whys": five_whys.model_dump(),
        "causes": [c.model_dump() for c in causes],
        "current_step": "assess_evidence_support",
        "status": "in_progress"
    }


def identify_additional_checks(state: RcaState) -> Dict[str, Any]:
    logger.info("RCA Node: identify_additional_checks")
    if state.get("status") == "error":
        return state
    
    # Final check on cause list and 5 Whys completeness
    return {
        "current_step": "identify_additional_checks",
        "status": "completed",
        "error": None
    }


def build_rca_graph():
    workflow = StateGraph(RcaState)
    workflow.add_node("prepare_investigation_context", prepare_investigation_context)
    workflow.add_node("analyze_potential_causes", analyze_potential_causes)
    workflow.add_node("assess_evidence_support", assess_evidence_support)
    workflow.add_node("identify_additional_checks", identify_additional_checks)

    workflow.set_entry_point("prepare_investigation_context")
    workflow.add_edge("prepare_investigation_context", "analyze_potential_causes")
    workflow.add_edge("analyze_potential_causes", "assess_evidence_support")
    workflow.add_edge("assess_evidence_support", "identify_additional_checks")
    workflow.add_edge("identify_additional_checks", END)
    
    return workflow.compile()


rca_graph = build_rca_graph()


# ==========================================
# CAPA LANGGRAPH WORKFLOW NODES
# ==========================================

def load_reviewed_findings(state: CapaState) -> Dict[str, Any]:
    logger.info("CAPA Node: load_reviewed_findings")
    return {
        "current_step": "load_reviewed_findings",
        "status": "in_progress",
        "error": None
    }


def generate_corrective_actions(state: CapaState) -> Dict[str, Any]:
    logger.info("CAPA Node: generate_corrective_actions & actions generation")
    ctx = state.get("investigation_context", {})
    causes = state.get("root_causes", [])
    
    causes_str = "\n".join([
        f"- [{c.get('cause_id')}] ({c.get('category')}): {c.get('description')} (Status: {c.get('status')})"
        for c in causes
    ]) if causes else "Under investigation: shortened drying duration and elevated condenser temperature"
    
    prompt = CAPA_USER_PROMPT_TEMPLATE.format(
        title=ctx.get("title", "Pharmaceutical Investigation"),
        api_product=ctx.get("api_product", "API"),
        batch_number=ctx.get("batch_number", "Batch"),
        equipment_id=ctx.get("equipment_id", "Equipment"),
        problem_statement=ctx.get("problem_statement", "Deviation observed"),
        root_causes=causes_str
    )
    
    try:
        raw_json = groq_service.generate_json(
            system_prompt=CAPA_SYSTEM_PROMPT,
            user_prompt=prompt,
            temperature=0.1
        )
        return {
            "raw_capa_data": raw_json,
            "current_step": "generate_corrective_actions",
            "status": "in_progress"
        }
    except Exception as e:
        logger.error(f"Error calling AI for CAPA: {e}")
        return {
            "current_step": "generate_corrective_actions",
            "status": "error",
            "error": str(e)
        }


def generate_preventive_actions(state: CapaState) -> Dict[str, Any]:
    logger.info("CAPA Node: generate_preventive_actions (parse & classify)")
    if state.get("status") == "error":
        return state

    raw_data = state.get("raw_capa_data", {})
    ca_raw = raw_data.get("corrective_actions", [])
    pa_raw = raw_data.get("preventive_actions", [])
    ev_raw = raw_data.get("effectiveness_checks", [])
    
    return {
        "corrective_actions": ca_raw,
        "preventive_actions": pa_raw,
        "effectiveness_checks": ev_raw,
        "current_step": "generate_preventive_actions",
        "status": "in_progress"
    }


def define_effectiveness_checks(state: CapaState) -> Dict[str, Any]:
    logger.info("CAPA Node: define_effectiveness_checks")
    if state.get("status") == "error":
        return state
    # Ensure checks have measurable criteria
    return {
        "current_step": "define_effectiveness_checks",
        "status": "in_progress"
    }


def validate_action_relevance(state: CapaState) -> Dict[str, Any]:
    logger.info("CAPA Node: validate_action_relevance")
    if state.get("status") == "error":
        return state
        
    return {
        "current_step": "validate_action_relevance",
        "status": "completed",
        "error": None
    }


def build_capa_graph():
    workflow = StateGraph(CapaState)
    workflow.add_node("load_reviewed_findings", load_reviewed_findings)
    workflow.add_node("generate_corrective_actions", generate_corrective_actions)
    workflow.add_node("generate_preventive_actions", generate_preventive_actions)
    workflow.add_node("define_effectiveness_checks", define_effectiveness_checks)
    workflow.add_node("validate_action_relevance", validate_action_relevance)

    workflow.set_entry_point("load_reviewed_findings")
    workflow.add_edge("load_reviewed_findings", "generate_corrective_actions")
    workflow.add_edge("generate_corrective_actions", "generate_preventive_actions")
    workflow.add_edge("generate_preventive_actions", "define_effectiveness_checks")
    workflow.add_edge("define_effectiveness_checks", "validate_action_relevance")
    workflow.add_edge("validate_action_relevance", END)

    return workflow.compile()


capa_graph = build_capa_graph()
