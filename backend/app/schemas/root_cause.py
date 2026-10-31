from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class FiveWhysSchema(BaseModel):
    id: Optional[str] = None
    investigation_id: Optional[str] = None
    problem_statement: Optional[str] = None
    why_1: Optional[str] = None
    why_2: Optional[str] = None
    why_3: Optional[str] = None
    why_4: Optional[str] = None
    why_5: Optional[str] = None
    proposed_root_cause: Optional[str] = None
    supporting_evidence: List[str] = Field(default_factory=list)
    missing_evidence: List[str] = Field(default_factory=list)
    reviewer_decision: str = "Under Investigation"
    reviewer_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("reviewer_decision", mode="before")
    @classmethod
    def validate_reviewer_decision(cls, v):
        if not v or not isinstance(v, str):
            return "Under Investigation"
        return str(v).strip()

    @field_validator("supporting_evidence", "missing_evidence", mode="before")
    @classmethod
    def validate_evidence_lists(cls, v):
        if not v or not isinstance(v, list):
            return []
        return [str(x).strip() for x in v if x is not None and str(x).strip()]

    class Config:
        from_attributes = True


class RootCauseItemSchema(BaseModel):
    id: Optional[str] = None
    cause_id: str = "RC-01"
    description: str = "Unspecified potential cause"
    category: str = "Method / Process"
    why_plausible: Optional[str] = None
    supporting_evidence: List[str] = Field(default_factory=list)
    contradicting_evidence: List[str] = Field(default_factory=list)
    evidence_gaps: List[str] = Field(default_factory=list)
    suggested_verification_test: Optional[str] = None
    confidence_assessment: str = "Moderate evidence support"
    status: str = "Proposed by AI"
    reviewer_notes: Optional[str] = None
    is_confirmed_root_cause: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("cause_id", "description", "category", "confidence_assessment", "status", mode="before")
    @classmethod
    def validate_str_fields(cls, v, info):
        defaults = {
            "cause_id": "RC-01",
            "description": "Unspecified potential cause",
            "category": "Method / Process",
            "confidence_assessment": "Moderate evidence support",
            "status": "Proposed by AI",
        }
        if not v or not isinstance(v, str):
            return defaults.get(info.field_name, "")
        return str(v).strip()

    @field_validator("supporting_evidence", "contradicting_evidence", "evidence_gaps", mode="before")
    @classmethod
    def validate_lists(cls, v):
        if not v or not isinstance(v, list):
            return []
        return [str(x).strip() for x in v if x is not None and str(x).strip()]

    @field_validator("is_confirmed_root_cause", mode="before")
    @classmethod
    def validate_bool(cls, v):
        if v is None:
            return False
        return bool(v)

    class Config:
        from_attributes = True


class RcaAnalysisResultSchema(BaseModel):
    five_whys: FiveWhysSchema
    causes: List[RootCauseItemSchema] = Field(default_factory=list)
    investigation_summary: str = ""
    disclaimer: str = (
        "AI-generated root causes are hypotheses based solely on available evidence. "
        "A confirmed root cause requires verification and human review authorization."
    )
