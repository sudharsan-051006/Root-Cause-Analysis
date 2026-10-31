import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc
from app.models.investigation import Investigation
from app.models.evidence import SourceDocument, EvidenceGap
from app.models.root_cause import FiveWhysAnalysis, RootCause
from app.models.capa import CapaAction
from app.models.audit import InvestigationEvent
from app.schemas.investigation import (
    InvestigationCreateSchema,
    InvestigationUpdateSchema,
    ReviewSaveRequest,
    ApprovalRequest
)
from app.core.logging import logger


def generate_investigation_id(db: Session) -> str:
    count = db.query(Investigation).count()
    year = datetime.utcnow().year
    return f"INV-{year}-{count + 1:04d}"


def get_investigation_by_id(db: Session, investigation_id: str) -> Optional[Investigation]:
    return db.query(Investigation).options(
        joinedload(Investigation.source_documents),
        joinedload(Investigation.evidence_gaps),
        joinedload(Investigation.root_causes),
        joinedload(Investigation.five_whys),
        joinedload(Investigation.capa_actions),
        joinedload(Investigation.events)
    ).filter(Investigation.id == investigation_id).first()


def list_investigations(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None
) -> List[Investigation]:
    query = db.query(Investigation)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Investigation.id.ilike(search_filter),
                Investigation.title.ilike(search_filter),
                Investigation.api_product.ilike(search_filter),
                Investigation.batch_number.ilike(search_filter),
                Investigation.equipment_id.ilike(search_filter)
            )
        )
    
    if status and status != "All":
        query = query.filter(Investigation.status == status)
        
    if severity and severity != "All":
        query = query.filter(Investigation.severity == severity)
        
    return query.order_by(desc(Investigation.updated_at)).offset(skip).limit(limit).all()


def get_dashboard_summary(db: Session) -> Dict[str, int]:
    total = db.query(Investigation).count()
    in_progress = db.query(Investigation).filter(Investigation.status == "Under Investigation").count()
    awaiting_review = db.query(Investigation).filter(Investigation.status == "Awaiting Review").count()
    approved = db.query(Investigation).filter(Investigation.status == "Approved").count()
    
    # Open CAPAs: status not Completed, not Cancelled, not Effective
    open_capas = db.query(CapaAction).filter(
        CapaAction.status.in_(["Proposed", "Approved", "In Progress", "Effectiveness Pending"])
    ).count()
    
    return {
        "total_investigations": total,
        "in_progress_count": in_progress,
        "awaiting_review_count": awaiting_review,
        "approved_count": approved,
        "open_capa_count": open_capas
    }


def create_investigation(
    db: Session,
    data: InvestigationCreateSchema,
    investigation_id: Optional[str] = None
) -> Investigation:
    inv_id = investigation_id or generate_investigation_id(db)
    
    db_inv = Investigation(
        id=inv_id,
        title=data.title or f"Investigation {inv_id}",
        incident_date=data.incident_date,
        api_product=data.api_product,
        batch_number=data.batch_number,
        process_step=data.process_step,
        facility=data.facility,
        equipment_id=data.equipment_id,
        owner=data.owner or "QA Investigations Lead",
        severity=data.severity or "Undetermined",
        status=data.status or "Draft",
        problem_statement=data.problem_statement,
        what_happened=data.what_happened,
        expected_condition=data.expected_condition,
        observed_condition=data.observed_condition,
        product_process_impact=data.product_process_impact,
        immediate_containment=data.immediate_containment or [],
        detection_method=data.detection_method,
        relevant_parameters=data.relevant_parameters or [],
        supporting_observations=data.supporting_observations,
        potential_quality_impact=data.potential_quality_impact,
        potential_batch_impact=data.potential_batch_impact,
        potential_patient_impact=data.potential_patient_impact,
        initial_risk_assessment=data.initial_risk_assessment,
        field_provenance=data.field_provenance or {}
    )
    
    db.add(db_inv)
    
    # Log audit event
    event = InvestigationEvent(
        investigation_id=inv_id,
        event_type="CREATED",
        details=f"Investigation {inv_id} initiated in system.",
        actor=data.owner or "QA Investigator"
    )
    db.add(event)
    
    db.commit()
    db.refresh(db_inv)
    return db_inv


def update_investigation(
    db: Session,
    investigation_id: str,
    update_data: InvestigationUpdateSchema
) -> Optional[Investigation]:
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        return None
        
    data_dict = update_data.model_dump(exclude_unset=True)
    for key, value in data_dict.items():
        if value is not None:
            setattr(inv, key, value)
            
    inv.updated_at = datetime.utcnow()
    
    event = InvestigationEvent(
        investigation_id=investigation_id,
        event_type="UPDATED",
        details=f"Investigation fields updated by user.",
        actor=inv.owner
    )
    db.add(event)
    
    db.commit()
    return get_investigation_by_id(db, investigation_id)


def save_review_decision(
    db: Session,
    investigation_id: str,
    req: ReviewSaveRequest
) -> Optional[Investigation]:
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        return None
        
    inv.reviewer_decision = req.reviewer_decision
    inv.reviewer_notes = req.reviewer_notes
    if req.reviewer_decision in ["Awaiting Review", "Under Investigation", "Draft"]:
        inv.status = req.reviewer_decision
    inv.updated_at = datetime.utcnow()
    
    event = InvestigationEvent(
        investigation_id=investigation_id,
        event_type="REVIEW_DECISION",
        details=f"Reviewer recorded decision: '{req.reviewer_decision}'. Notes: {req.reviewer_notes or 'None'}",
        actor=req.reviewer_name or "Authorized QA Reviewer"
    )
    db.add(event)
    db.commit()
    return get_investigation_by_id(db, investigation_id)


def approve_investigation(
    db: Session,
    investigation_id: str,
    req: ApprovalRequest
) -> Optional[Investigation]:
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        return None
        
    inv.is_approved = True
    inv.status = "Approved"
    inv.approved_at = datetime.utcnow()
    inv.approved_by = req.approved_by
    inv.approval_notes = req.approval_notes
    inv.updated_at = datetime.utcnow()
    
    event = InvestigationEvent(
        investigation_id=investigation_id,
        event_type="APPROVED",
        details=f"Investigation officially APPROVED by {req.approved_by}. (Demonstration signature workflow)",
        actor=req.approved_by
    )
    db.add(event)
    db.commit()
    return get_investigation_by_id(db, investigation_id)


def delete_investigation(db: Session, investigation_id: str) -> bool:
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        return False
    db.delete(inv)
    db.commit()
    return True
