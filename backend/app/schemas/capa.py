from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class CapaActionSchema(BaseModel):
    id: Optional[str] = None
    investigation_id: Optional[str] = None
    action_id: str = "CAPA-01"
    action_type: str = "Corrective"  # Corrective, Preventive, Effectiveness Verification
    description: str = "Action description"
    rationale: Optional[str] = None
    linked_root_cause: Optional[str] = None
    priority: str = "Medium"  # Critical, High, Medium, Low
    responsible_role: str = "QA / Manufacturing Lead"
    target_date: Optional[str] = None
    status: str = "Proposed"  # Proposed, Approved, In Progress, Completed, Effectiveness Pending, Effective, Ineffective, Cancelled
    completion_notes: Optional[str] = None
    effectiveness_verification_method: Optional[str] = None
    effectiveness_result: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("action_id", "action_type", "description", "priority", "responsible_role", "status", mode="before")
    @classmethod
    def validate_str_fields(cls, v, info):
        defaults = {
            "action_id": "CAPA-01",
            "action_type": "Corrective",
            "description": "Action description",
            "priority": "Medium",
            "responsible_role": "QA / Manufacturing Lead",
            "status": "Proposed",
        }
        if not v or not isinstance(v, str):
            return defaults.get(info.field_name, "")
        return str(v).strip()

    class Config:
        from_attributes = True


class CapaGenerationResultSchema(BaseModel):
    corrective_actions: List[CapaActionSchema] = Field(default_factory=list)
    preventive_actions: List[CapaActionSchema] = Field(default_factory=list)
    effectiveness_checks: List[CapaActionSchema] = Field(default_factory=list)
    disclaimer: str = (
        "Recommendations are advisory quality measures for authorized QA review. "
        "They do not constitute automated batch disposition or regulatory filings."
    )
