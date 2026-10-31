from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.investigation import Investigation
from app.models.evidence import EvidenceGap
from app.schemas.investigation import (
    InvestigationListItemSchema,
    InvestigationDetailSchema,
    InvestigationCreateSchema,
    InvestigationUpdateSchema,
    DashboardSummarySchema,
    ReviewSaveRequest,
    ApprovalRequest,
    EvidenceGapSchema
)
from app.services import investigation_service
from app.core.logging import logger

router = APIRouter()


@router.get("/summary", response_model=DashboardSummarySchema)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Retrieve summary counters for the dashboard overview."""
    try:
        return investigation_service.get_dashboard_summary(db)
    except Exception as e:
        logger.error(f"Error fetching dashboard summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[InvestigationListItemSchema])
def list_investigations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List investigations with optional search and filters."""
    return investigation_service.list_investigations(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        severity=severity
    )


@router.post("", response_model=InvestigationDetailSchema, status_code=status.HTTP_201_CREATED)
def create_investigation(
    data: InvestigationCreateSchema,
    db: Session = Depends(get_db)
):
    """Create a new RCA investigation record."""
    try:
        inv = investigation_service.create_investigation(db=db, data=data)
        return investigation_service.get_investigation_by_id(db, inv.id)
    except Exception as e:
        logger.error(f"Failed to create investigation: {e}")
        raise HTTPException(status_code=500, detail=f"Database write failed: {str(e)}")


@router.get("/{investigation_id}", response_model=InvestigationDetailSchema)
def get_investigation(
    investigation_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve an existing investigation by ID with all evidence and analysis relationships."""
    inv = investigation_service.get_investigation_by_id(db, investigation_id)
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation with ID '{investigation_id}' was not found in the database."
        )
    return inv


@router.patch("/{investigation_id}", response_model=InvestigationDetailSchema)
def update_investigation(
    investigation_id: str,
    update_data: InvestigationUpdateSchema,
    db: Session = Depends(get_db)
):
    """Update fields of an existing investigation."""
    inv = investigation_service.update_investigation(db, investigation_id, update_data)
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found."
        )
    return inv


@router.delete("/{investigation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_investigation(
    investigation_id: str,
    db: Session = Depends(get_db)
):
    """Delete an investigation and its associated analysis and evidence records."""
    success = investigation_service.delete_investigation(db, investigation_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found."
        )
    return None


@router.post("/{investigation_id}/save-review", response_model=InvestigationDetailSchema)
def save_review_decision(
    investigation_id: str,
    req: ReviewSaveRequest,
    db: Session = Depends(get_db)
):
    """Record reviewer notes and update review stage."""
    inv = investigation_service.save_review_decision(db, investigation_id, req)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found.")
    return inv


@router.post("/{investigation_id}/approve", response_model=InvestigationDetailSchema)
def approve_investigation(
    investigation_id: str,
    req: ApprovalRequest,
    db: Session = Depends(get_db)
):
    """Formally approve the investigation and authorize CAPA implementation."""
    inv = investigation_service.approve_investigation(db, investigation_id, req)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found.")
    return inv


# Evidence Gaps Endpoints
@router.post("/{investigation_id}/evidence-gaps", response_model=EvidenceGapSchema)
def add_evidence_gap(
    investigation_id: str,
    gap_data: EvidenceGapSchema,
    db: Session = Depends(get_db)
):
    """Add an evidence gap to the investigation."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found.")
        
    db_gap = EvidenceGap(
        investigation_id=investigation_id,
        description=gap_data.description,
        why_it_matters=gap_data.why_it_matters,
        helps_evaluate_cause=gap_data.helps_evaluate_cause,
        suggested_verification_method=gap_data.suggested_verification_method,
        priority=gap_data.priority,
        status=gap_data.status,
        reviewer_notes=gap_data.reviewer_notes
    )
    db.add(db_gap)
    db.commit()
    db.refresh(db_gap)
    return db_gap


@router.patch("/{investigation_id}/evidence-gaps/{gap_id}", response_model=EvidenceGapSchema)
def update_evidence_gap(
    investigation_id: str,
    gap_id: str,
    update_data: EvidenceGapSchema,
    db: Session = Depends(get_db)
):
    """Update evidence gap status, description, or reviewer notes."""
    gap = db.query(EvidenceGap).filter(
        EvidenceGap.id == gap_id,
        EvidenceGap.investigation_id == investigation_id
    ).first()
    if not gap:
        raise HTTPException(status_code=404, detail="Evidence gap record not found.")

    if update_data.description:
        gap.description = update_data.description
    if update_data.why_it_matters:
        gap.why_it_matters = update_data.why_it_matters
    if update_data.helps_evaluate_cause is not None:
        gap.helps_evaluate_cause = update_data.helps_evaluate_cause
    if update_data.suggested_verification_method is not None:
        gap.suggested_verification_method = update_data.suggested_verification_method
    if update_data.priority:
        gap.priority = update_data.priority
    if update_data.status:
        gap.status = update_data.status
    if update_data.reviewer_notes is not None:
        gap.reviewer_notes = update_data.reviewer_notes

    db.commit()
    db.refresh(gap)
    return gap
