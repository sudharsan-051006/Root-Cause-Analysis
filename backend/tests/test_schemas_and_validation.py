from pydantic import ValidationError
from app.schemas.ai import ExtractionResultSchema, ProvenanceField, ProcessParameterItem
from app.schemas.root_cause import FiveWhysSchema, RootCauseItemSchema, RcaAnalysisResultSchema
from app.schemas.capa import CapaActionSchema, CapaGenerationResultSchema


def test_extraction_schema_valid():
    data = {
        "investigation_title": "Deviation: OOS Residual Acetone",
        "api_product": "Atorvastatin Calcium Trihydrate",
        "batch_number": "ATC-2026-B089",
        "equipment_id": "CVD-04",
        "problem_statement": "Residual acetone tested at 5,840 ppm (limit: 5,000 ppm)",
        "observed_condition": "5,840 ppm",
        "expected_condition": "<= 5,000 ppm",
        "immediate_containment": ["Quarantined 6 drums"],
        "relevant_parameters": [
            {
                "parameter_name": "Drying Time",
                "observed_value": "14.5 hours",
                "target_value": ">= 18.0 hours",
                "unit": "hours",
                "status": "Deviation"
            }
        ],
        "field_provenance": {
            "batch_number": {
                "value": "ATC-2026-B089",
                "origin": "source_extracted",
                "evidence_quote": "Batch Number: ATC-2026-B089"
            }
        }
    }
    schema = ExtractionResultSchema.model_validate(data)
    assert schema.api_product == "Atorvastatin Calcium Trihydrate"
    assert schema.relevant_parameters[0].status == "Deviation"
    assert schema.field_provenance["batch_number"].origin == "source_extracted"


def test_rca_and_fishbone_schema_validation():
    cause_data = {
        "cause_id": "RC-01",
        "description": "Shortened vacuum drying cycle due to condenser high-temperature alarm",
        "category": "Machine / Equipment",
        "why_plausible": "Premature cycle termination left residual acetone above limit",
        "confidence_assessment": "Strong evidence support",
        "status": "Proposed by AI"
    }
    cause = RootCauseItemSchema.model_validate(cause_data)
    assert cause.category == "Machine / Equipment"
    assert cause.is_confirmed_root_cause is False

    five_whys_data = {
        "problem_statement": "Residual acetone OOS at 5,840 ppm",
        "why_1": "Drying cycle terminated prematurely at 14.5 hours instead of 18 hours",
        "why_2": "Operator observed high-temperature chime on condenser control panel",
        "why_3": "Chilled water return temperature elevated at 18.4°C vs limit of 15°C",
        "why_4": "Requires SCADA utility loop verification",
        "proposed_root_cause": "Condenser chilling deficiency caused premature cycle shutdown",
        "reviewer_decision": "Under Investigation"
    }
    fw = FiveWhysSchema.model_validate(five_whys_data)
    assert fw.why_1.startswith("Drying cycle terminated")


def test_capa_schema_validation():
    action_data = {
        "action_id": "CA-01",
        "action_type": "Corrective",
        "description": "Assess quarantined batch ATC-2026-B089 for validated re-drying protocol",
        "rationale": "Direct batch remediation under QA oversight",
        "priority": "Critical",
        "status": "Proposed"
    }
    action = CapaActionSchema.model_validate(action_data)
    assert action.action_type == "Corrective"
    assert action.priority == "Critical"
