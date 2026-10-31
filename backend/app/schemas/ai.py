from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, field_validator


class ProvenanceField(BaseModel):
    value: Optional[Any] = None
    origin: str = Field(
        default="inferred_by_ai",
        description="One of: source_extracted, inferred_by_ai, entered_by_user, confirmed_by_reviewer"
    )
    evidence_quote: Optional[str] = Field(
        default=None,
        description="Exact quote or reference from source document"
    )

    @field_validator("origin", mode="before")
    @classmethod
    def validate_origin(cls, v):
        if not v or not isinstance(v, str):
            return "inferred_by_ai"
        valid_origins = ["source_extracted", "inferred_by_ai", "entered_by_user", "confirmed_by_reviewer"]
        return v if v in valid_origins else "inferred_by_ai"


class ProcessParameterItem(BaseModel):
    parameter_name: str = "Process Parameter"
    observed_value: Optional[str] = None
    target_value: Optional[str] = None
    unit: Optional[str] = None
    status: Optional[str] = None  # e.g., "Normal", "Alarm", "Deviation", "Unknown"
    evidence_quote: Optional[str] = None

    @field_validator("parameter_name", mode="before")
    @classmethod
    def validate_param_name(cls, v):
        if not v or not isinstance(v, str):
            return "Process Parameter"
        return str(v).strip()


class EvidenceSnippet(BaseModel):
    quote: str = ""
    context: str = ""
    relevance: str = ""

    @field_validator("quote", "context", "relevance", mode="before")
    @classmethod
    def validate_snippet_strings(cls, v):
        if v is None:
            return ""
        return str(v).strip()


class EvidenceGapExtraction(BaseModel):
    description: str = "Required documentation"
    why_it_matters: str = "Verification required to evaluate root cause"
    helps_evaluate_cause: Optional[str] = None
    suggested_verification_method: Optional[str] = None
    priority: str = "High"  # Critical, High, Medium, Low
    status: str = "Missing"  # Missing, Requested, Provided, Reviewed

    @field_validator("description", "why_it_matters", mode="before")
    @classmethod
    def validate_gap_text(cls, v):
        if not v or not isinstance(v, str):
            return "Required documentation"
        return str(v).strip()

    @field_validator("priority", mode="before")
    @classmethod
    def validate_priority(cls, v):
        if not v or not isinstance(v, str):
            return "High"
        val = str(v).strip().capitalize()
        if val in ["Critical", "High", "Medium", "Low"]:
            return val
        if "crit" in val.lower():
            return "Critical"
        if "low" in val.lower():
            return "Low"
        return "High"

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v):
        if not v or not isinstance(v, str):
            return "Missing"
        return str(v).strip()


class ExtractionResultSchema(BaseModel):
    investigation_title: Optional[str] = None
    api_product: Optional[str] = None
    batch_number: Optional[str] = None
    process_step: Optional[str] = None
    facility: Optional[str] = None
    equipment_id: Optional[str] = None
    incident_date: Optional[str] = None
    severity: Optional[str] = "Undetermined"  # Critical, Major, Minor, Undetermined
    
    problem_statement: Optional[str] = ""
    what_happened: Optional[str] = None
    expected_condition: Optional[str] = None
    observed_condition: Optional[str] = ""
    product_process_impact: Optional[str] = None
    detection_method: Optional[str] = None
    
    immediate_containment: List[str] = Field(default_factory=list)
    relevant_parameters: List[ProcessParameterItem] = Field(default_factory=list)
    supporting_observations: Optional[str] = None
    
    potential_quality_impact: Optional[str] = None
    potential_batch_impact: Optional[str] = None
    potential_patient_impact: Optional[str] = None
    initial_risk_assessment: Optional[str] = None
    
    source_evidence: List[EvidenceSnippet] = Field(default_factory=list)
    missing_information: List[EvidenceGapExtraction] = Field(default_factory=list)
    uncertainties: List[str] = Field(default_factory=list)
    
    # Field-level provenance dictionary: key -> ProvenanceField
    field_provenance: Dict[str, ProvenanceField] = Field(default_factory=dict)

    @field_validator("severity", mode="before")
    @classmethod
    def validate_severity(cls, v):
        if not v or not isinstance(v, str):
            return "Undetermined"
        v_clean = str(v).strip()
        v_lower = v_clean.lower()
        if "crit" in v_lower:
            return "Critical"
        if "maj" in v_lower or "high" in v_lower:
            return "Major"
        if "min" in v_lower or "low" in v_lower:
            return "Minor"
        if "undeterm" in v_lower or "unknown" in v_lower:
            return "Undetermined"
        return v_clean.capitalize()

    @field_validator("problem_statement", "observed_condition", mode="before")
    @classmethod
    def validate_problem_observed(cls, v):
        if v is None:
            return ""
        return str(v).strip()

    @field_validator("immediate_containment", "uncertainties", mode="before")
    @classmethod
    def validate_string_lists(cls, v):
        if not v:
            return []
        if isinstance(v, list):
            return [str(x).strip() for x in v if x is not None and str(x).strip()]
        return [str(v).strip()]


class TextExtractRequest(BaseModel):
    text: str
    source_type: str = "pasted_text"  # pasted_text, email, pdf
    investigation_id: Optional[str] = None


class EmailExtractRequest(BaseModel):
    subject: str
    sender: str
    content: str
    investigation_id: Optional[str] = None


class AnalysisStatusResponse(BaseModel):
    step: str
    status: str
    message: str
