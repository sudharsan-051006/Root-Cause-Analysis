import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base


class SourceDocument(Base):
    __tablename__ = "source_documents"

    id = Column(String(64), primary_key=True, default=lambda: f"DOC-{uuid.uuid4().hex[:8].upper()}")
    investigation_id = Column(String(64), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(64), nullable=False)  # pdf, pasted_text, email
    file_size_bytes = Column(Integer, default=0)
    upload_status = Column(String(32), default="processed")  # uploaded, processed, error, ocr_required
    
    raw_content = Column(Text, nullable=True)
    extracted_summary = Column(Text, nullable=True)
    evidence_snippets = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    investigation = relationship("Investigation", back_populates="source_documents")


class EvidenceGap(Base):
    __tablename__ = "evidence_gaps"

    id = Column(String(64), primary_key=True, default=lambda: f"GAP-{uuid.uuid4().hex[:6].upper()}")
    investigation_id = Column(String(64), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    
    description = Column(Text, nullable=False)
    why_it_matters = Column(Text, nullable=False)
    helps_evaluate_cause = Column(String(255), nullable=True)
    suggested_verification_method = Column(Text, nullable=True)
    priority = Column(String(32), default="High")  # Critical, High, Medium, Low
    status = Column(String(32), default="Missing")  # Missing, Requested, Provided, Reviewed
    reviewer_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    investigation = relationship("Investigation", back_populates="evidence_gaps")
