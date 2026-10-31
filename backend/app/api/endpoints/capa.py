from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.capa import CapaAction
from app.models.investigation import Investigation
from app.models.audit import InvestigationEvent
from app.schemas.capa import CapaActionSchema
from app.core.logging import logger

router = APIRouter()


@router.get("", response_model=List[CapaActionSchema])
def list_capa_actions(
    status: Optional[str] = Query(None),
    action_type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    investigation_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieve all CAPA actions across investigations with optional filters."""
    query = db.query(CapaAction)
    
    if investigation_id:
        query = query.filter(CapaAction.investigation_id == investigation_id)
    if status and status != "All":
        query = query.filter(CapaAction.status == status)
    if action_type and action_type != "All":
        query = query.filter(CapaAction.action_type == action_type)
    if priority and priority != "All":
        query = query.filter(CapaAction.priority == priority)
        
    return query.order_by(CapaAction.created_at.desc()).all()


@router.post("", response_model=CapaActionSchema, status_code=status.HTTP_201_CREATED)
def create_capa_action(
    action_data: CapaActionSchema,
    db: Session = Depends(get_db)
):
    """Manually add a CAPA action to an investigation."""
    if not action_data.investigation_id:
        raise HTTPException(status_code=400, detail="investigation_id is required.")
        
    inv = db.query(Investigation).filter(Investigation.id == action_data.investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found.")

    db_action = CapaAction(
        investigation_id=action_data.investigation_id,
        action_id=action_data.action_id,
        action_type=action_data.action_type,
        description=action_data.description,
        rationale=action_data.rationale,
        linked_root_cause=action_data.linked_root_cause,
        priority=action_data.priority,
        responsible_role=action_data.responsible_role,
        target_date=action_data.target_date,
        status=action_data.status,
        completion_notes=action_data.completion_notes,
        effectiveness_verification_method=action_data.effectiveness_verification_method,
        effectiveness_result=action_data.effectiveness_result
    )
    db.add(db_action)
    
    event = InvestigationEvent(
        investigation_id=action_data.investigation_id,
        event_type="CAPA_ADDED",
        details=f"Added {action_data.action_type} action {action_data.action_id}: {action_data.description[:60]}...",
        actor="QA Investigator"
    )
    db.add(event)
    
    db.commit()
    db.refresh(db_action)
    return db_action


@router.patch("/{action_id}", response_model=CapaActionSchema)
def update_capa_action(
    action_id: str,
    update_data: CapaActionSchema,
    db: Session = Depends(get_db)
):
    """Update status, completion notes, target date or effectiveness result of a CAPA action."""
    action = db.query(CapaAction).filter(
        (CapaAction.id == action_id) | (CapaAction.action_id == action_id)
    ).first()
    
    if not action:
        raise HTTPException(status_code=404, detail=f"CAPA action '{action_id}' not found.")

    if update_data.description:
        action.description = update_data.description
    if update_data.action_type:
        action.action_type = update_data.action_type
    if update_data.rationale is not None:
        action.rationale = update_data.rationale
    if update_data.linked_root_cause is not None:
        action.linked_root_cause = update_data.linked_root_cause
    if update_data.priority:
        action.priority = update_data.priority
    if update_data.responsible_role:
        action.responsible_role = update_data.responsible_role
    if update_data.target_date is not None:
        action.target_date = update_data.target_date
    if update_data.status:
        action.status = update_data.status
    if update_data.completion_notes is not None:
        action.completion_notes = update_data.completion_notes
    if update_data.effectiveness_verification_method is not None:
        action.effectiveness_verification_method = update_data.effectiveness_verification_method
    if update_data.effectiveness_result is not None:
        action.effectiveness_result = update_data.effectiveness_result

    event = InvestigationEvent(
        investigation_id=action.investigation_id,
        event_type="CAPA_UPDATED",
        details=f"Updated action {action.action_id} status to '{action.status}'.",
        actor="QA Investigator"
    )
    db.add(event)

    db.commit()
    db.refresh(action)
    return action


@router.delete("/{action_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_capa_action(
    action_id: str,
    db: Session = Depends(get_db)
):
    """Delete a CAPA action."""
    action = db.query(CapaAction).filter(
        (CapaAction.id == action_id) | (CapaAction.action_id == action_id)
    ).first()
    
    if not action:
        raise HTTPException(status_code=404, detail="CAPA action not found.")
        
    db.delete(action)
    db.commit()
    return None
