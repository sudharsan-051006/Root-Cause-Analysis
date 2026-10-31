import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base


class FiveWhysAnalysis(Base):
    __tablename__ = "five_whys_analyses"

    id = Column(String(64), primary_key=True, default=lambda: f"5W-{uuid.uuid4().hex[:6].upper()}")
    investigation_id = Column(String(64), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    problem_statement = Column(Text, nullable=True)
    why_1 = Column(Text, nullable=True)
    why_2 = Column(Text, nullable=True)
    why_3 = Column(Text, nullable=True)
    why_4 = Column(Text, nullable=True)
    why_5 = Column(Text, nullable=True)
    
    proposed_root_cause = Column(Text, nullable=True)
    supporting_evidence = Column(JSON, default=list)
    missing_evidence = Column(JSON, default=list)
    reviewer_decision = Column(String(64), default="Under Investigation")  # Under Investigation, Accepted, Rejected, Revised
    reviewer_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    investigation = relationship("Investigation", back_populates="five_whys")


class RootCause(Base):
    __tablename__ = "root_causes"

    id = Column(String(64), primary_key=True, default=lambda: f"RC-{uuid.uuid4().hex[:6].upper()}")
    investigation_id = Column(String(64), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    
    cause_id = Column(String(32), nullable=False)  # e.g., RC-01, RC-02
    description = Column(Text, nullable=False)
    # Fishbone Categories: Man / Personnel, Machine / Equipment, Method / Process, Material, Measurement, Environment
    category = Column(String(64), nullable=False, default="Method / Process")
    
    why_plausible = Column(Text, nullable=True)
    supporting_evidence = Column(JSON, default=list)
    contradicting_evidence = Column(JSON, default=list)
    evidence_gaps = Column(JSON, default=list)
    suggested_verification_test = Column(Text, nullable=True)
    confidence_assessment = Column(String(64), default="Moderate evidence support")
    
    # Status: Proposed by AI, Under Investigation, Supported by Evidence, Rejected, Confirmed by Reviewer
    status = Column(String(64), default="Proposed by AI")
    reviewer_notes = Column(Text, nullable=True)
    is_confirmed_root_cause = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    investigation = relationship("Investigation", back_populates="root_causes")
