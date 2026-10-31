from typing import TypedDict, List, Dict, Any, Optional


class ExtractionState(TypedDict):
    source_text: str
    source_type: str
    cleaned_text: str
    extraction_data: Dict[str, Any]
    validated_data: Optional[Dict[str, Any]]
    evidence_gaps: List[Dict[str, Any]]
    current_step: str
    status: str
    error: Optional[str]


class RcaState(TypedDict):
    investigation_id: Optional[str]
    context: Dict[str, Any]
    raw_rca_data: Dict[str, Any]
    five_whys: Dict[str, Any]
    causes: List[Dict[str, Any]]
    current_step: str
    status: str
    error: Optional[str]


class CapaState(TypedDict):
    investigation_id: Optional[str]
    investigation_context: Dict[str, Any]
    root_causes: List[Dict[str, Any]]
    raw_capa_data: Dict[str, Any]
    corrective_actions: List[Dict[str, Any]]
    preventive_actions: List[Dict[str, Any]]
    effectiveness_checks: List[Dict[str, Any]]
    current_step: str
    status: str
    error: Optional[str]
