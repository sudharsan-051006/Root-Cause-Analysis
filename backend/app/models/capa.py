import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class CapaAction(Base):
    __tablename__ = "capa_actions"

    id = Column(String(64), primary_key=True, default=lambda: f"CAPA-{uuid.uuid4().hex[:6].upper()}")
    investigation_id = Column(String(64), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    
    action_id = Column(String(32), nullable=False)  # e.g., CA-01, PA-01
    action_type = Column(String(32), nullable=False)  # Corrective, Preventive, Effectiveness Verification
    description = Column(Text, nullable=False)
    rationale = Column(Text, nullable=True)
    linked_root_cause = Column(String(255), nullable=True)
    
    priority = Column(String(32), default="Medium")  # Critical, High, Medium, Low
    responsible_role = Column(String(128), default="QA / Manufacturing Lead")
    target_date = Column(String(64), nullable=True)
    
    # Status: Proposed, Approved, In Progress, Completed, Effectiveness Pending, Effective, Ineffective, Cancelled
    status = Column(String(64), default="Proposed")
    completion_notes = Column(Text, nullable=True)
    
    effectiveness_verification_method = Column(Text, nullable=True)
    effectiveness_result = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    investigation = relationship("Investigation", back_populates="capa_actions")
