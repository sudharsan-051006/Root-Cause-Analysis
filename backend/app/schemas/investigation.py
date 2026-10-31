from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.ai import EvidenceGapExtraction, ProvenanceField
from app.schemas.root_cause import FiveWhysSchema, RootCauseItemSchema
from app.schemas.capa import CapaActionSchema


class EvidenceGapSchema(BaseModel):
    id: Optional[str] = None
    investigation_id: Optional[str] = None
    description: str
    why_it_matters: str
    helps_evaluate_cause: Optional[str] = None
    suggested_verification_method: Optional[str] = None
    priority: str = "High"
    status: str = "Missing"
    reviewer_notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SourceDocumentSchema(BaseModel):
    id: Optional[str] = None
    investigation_id: Optional[str] = None
    file_name: str
    file_type: str
    file_size_bytes: int = 0
    upload_status: str = "processed"
    raw_content: Optional[str] = None
    extracted_summary: Optional[str] = None
    evidence_snippets: List[Any] = Field(default_factory=list)
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InvestigationCreateSchema(BaseModel):
    title: Optional[str] = "New Investigation"
    incident_date: Optional[str] = None
    api_product: Optional[str] = None
    batch_number: Optional[str] = None
    process_step: Optional[str] = None
    facility: Optional[str] = None
    equipment_id: Optional[str] = None
    owner: Optional[str] = "QA Investigations Lead"
    severity: Optional[str] = "Undetermined"
    status: Optional[str] = "Draft"
    problem_statement: Optional[str] = None
    what_happened: Optional[str] = None
    expected_condition: Optional[str] = None
    observed_condition: Optional[str] = None
    product_process_impact: Optional[str] = None
    immediate_containment: List[str] = Field(default_factory=list)
    detection_method: Optional[str] = None
    relevant_parameters: List[Any] = Field(default_factory=list)
    supporting_observations: Optional[str] = None
    potential_quality_impact: Optional[str] = None
    potential_batch_impact: Optional[str] = None
    potential_patient_impact: Optional[str] = None
    initial_risk_assessment: Optional[str] = None
    field_provenance: Dict[str, Any] = Field(default_factory=dict)


class InvestigationUpdateSchema(BaseModel):
    title: Optional[str] = None
    incident_date: Optional[str] = None
    api_product: Optional[str] = None
    batch_number: Optional[str] = None
    process_step: Optional[str] = None
    facility: Optional[str] = None
    equipment_id: Optional[str] = None
    owner: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    problem_statement: Optional[str] = None
    what_happened: Optional[str] = None
    expected_condition: Optional[str] = None
    observed_condition: Optional[str] = None
    product_process_impact: Optional[str] = None
    immediate_containment: Optional[List[str]] = None
    detection_method: Optional[str] = None
    relevant_parameters: Optional[List[Any]] = None
    supporting_observations: Optional[str] = None
    potential_quality_impact: Optional[str] = None
    potential_batch_impact: Optional[str] = None
    potential_patient_impact: Optional[str] = None
    initial_risk_assessment: Optional[str] = None
    information_still_required: Optional[List[Any]] = None
    reviewer_decision: Optional[str] = None
    reviewer_notes: Optional[str] = None
    field_provenance: Optional[Dict[str, Any]] = None


class ReviewSaveRequest(BaseModel):
    reviewer_decision: str  # Draft, Under Investigation, Awaiting Review, Approved, Rejected
    reviewer_notes: Optional[str] = None
    reviewer_name: Optional[str] = "Authorized QA Reviewer"


class ApprovalRequest(BaseModel):
    approved_by: str = "Authorized QA Lead"
    approval_notes: Optional[str] = "Investigation reviewed, evidence verified, and approved for CAPA execution."


class InvestigationListItemSchema(BaseModel):
    id: str
    title: str
    api_product: Optional[str] = None
    batch_number: Optional[str] = None
    severity: str
    status: str
    owner: Optional[str] = None
    is_approved: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InvestigationDetailSchema(BaseModel):
    id: str
    title: str
    investigation_date: datetime
    incident_date: Optional[str] = None
    api_product: Optional[str] = None
    batch_number: Optional[str] = None
    process_step: Optional[str] = None
    facility: Optional[str] = None
    equipment_id: Optional[str] = None
    owner: str
    severity: str
    status: str
    problem_statement: Optional[str] = None
    what_happened: Optional[str] = None
    expected_condition: Optional[str] = None
    observed_condition: Optional[str] = None
    product_process_impact: Optional[str] = None
    immediate_containment: List[str] = Field(default_factory=list)
    detection_method: Optional[str] = None
    relevant_parameters: List[Any] = Field(default_factory=list)
    supporting_observations: Optional[str] = None
    potential_quality_impact: Optional[str] = None
    potential_batch_impact: Optional[str] = None
    potential_patient_impact: Optional[str] = None
    initial_risk_assessment: Optional[str] = None
    information_still_required: List[Any] = Field(default_factory=list)
    is_approved: bool = False
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    approval_notes: Optional[str] = None
    reviewer_decision: Optional[str] = None
    reviewer_notes: Optional[str] = None
    field_provenance: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    
    source_documents: List[SourceDocumentSchema] = Field(default_factory=list)
    evidence_gaps: List[EvidenceGapSchema] = Field(default_factory=list)
    root_causes: List[RootCauseItemSchema] = Field(default_factory=list)
    five_whys: Optional[FiveWhysSchema] = None
    capa_actions: List[CapaActionSchema] = Field(default_factory=list)

    class Config:
        from_attributes = True


class DashboardSummarySchema(BaseModel):
    total_investigations: int = 0
    in_progress_count: int = 0
    awaiting_review_count: int = 0
    approved_count: int = 0
    open_capa_count: int = 0
