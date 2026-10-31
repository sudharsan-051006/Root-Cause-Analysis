import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String(64), primary_key=True, default=lambda: f"INV-{uuid.uuid4().hex[:8].upper()}")
    title = Column(String(255), nullable=False, default="Untitled Investigation")
    investigation_date = Column(DateTime, default=datetime.utcnow)
    incident_date = Column(String(64), nullable=True)
    
    # Process & Facility Details
    api_product = Column(String(255), nullable=True)
    batch_number = Column(String(128), nullable=True)
    process_step = Column(String(255), nullable=True)
    facility = Column(String(255), nullable=True)
    equipment_id = Column(String(128), nullable=True)
    owner = Column(String(128), default="QA Investigations Lead")
    
    severity = Column(String(32), default="Undetermined")  # Critical, Major, Minor, Undetermined
    status = Column(String(32), default="Draft")  # Draft, Under Investigation, Awaiting Review, Approved, Closed
    
    # Problem & Incident Description
    problem_statement = Column(Text, nullable=True)
    what_happened = Column(Text, nullable=True)
    expected_condition = Column(Text, nullable=True)
    observed_condition = Column(Text, nullable=True)
    product_process_impact = Column(Text, nullable=True)
    immediate_containment = Column(JSON, default=list)  # list of strings
    detection_method = Column(String(255), nullable=True)
    relevant_parameters = Column(JSON, default=list)    # list of parameter objects
    supporting_observations = Column(Text, nullable=True)
    
    # Initial Assessment
    potential_quality_impact = Column(Text, nullable=True)
    potential_batch_impact = Column(Text, nullable=True)
    potential_patient_impact = Column(Text, nullable=True)
    initial_risk_assessment = Column(Text, nullable=True)
    information_still_required = Column(JSON, default=list)
    
    # Review & Approval Workflow
    is_approved = Column(Boolean, default=False)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(String(128), nullable=True)
    approval_notes = Column(Text, nullable=True)
    reviewer_decision = Column(String(64), nullable=True)  # Draft, Pending, Approved, Rejected
    reviewer_notes = Column(Text, nullable=True)
    
    # Field-level Provenance Tracking (source_extracted, inferred_by_ai, entered_by_user, confirmed_by_reviewer)
    field_provenance = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    source_documents = relationship("SourceDocument", back_populates="investigation", cascade="all, delete-orphan")
    evidence_gaps = relationship("EvidenceGap", back_populates="investigation", cascade="all, delete-orphan")
    root_causes = relationship("RootCause", back_populates="investigation", cascade="all, delete-orphan")
    five_whys = relationship("FiveWhysAnalysis", back_populates="investigation", uselist=False, cascade="all, delete-orphan")
    capa_actions = relationship("CapaAction", back_populates="investigation", cascade="all, delete-orphan")
    events = relationship("InvestigationEvent", back_populates="investigation", cascade="all, delete-orphan")
