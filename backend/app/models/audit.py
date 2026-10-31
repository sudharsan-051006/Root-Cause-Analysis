import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base


class InvestigationEvent(Base):
    __tablename__ = "investigation_events"

    id = Column(String(64), primary_key=True, default=lambda: f"EVT-{uuid.uuid4().hex[:8].upper()}")
    investigation_id = Column(String(64), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    
    event_type = Column(String(64), nullable=False)  # CREATED, SOURCE_EXTRACTED, RCA_GENERATED, CAPA_GENERATED, REVIEW_SAVED, APPROVED, FIELD_UPDATED
    details = Column(Text, nullable=False)
    actor = Column(String(128), default="QA Investigator")
    metadata_json = Column(JSON, default=dict)
    
    timestamp = Column(DateTime, default=datetime.utcnow)

    investigation = relationship("Investigation", back_populates="events")
