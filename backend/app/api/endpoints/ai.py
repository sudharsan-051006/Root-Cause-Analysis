import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.ai.graph_workflow import extraction_graph
from app.ai.rca_capa_graphs import rca_graph, capa_graph
from app.ai.groq_client import groq_service, AIConfigurationError, AIProcessingError
from app.schemas.ai import (
    TextExtractRequest,
    EmailExtractRequest,
    ExtractionResultSchema
)
from app.schemas.root_cause import RcaAnalysisResultSchema, FiveWhysSchema, RootCauseItemSchema
from app.schemas.capa import CapaGenerationResultSchema, CapaActionSchema
from app.services.pdf_service import extract_text_from_pdf, PDFProcessingError
from app.models.investigation import Investigation
from app.models.evidence import SourceDocument, EvidenceGap
from app.models.root_cause import FiveWhysAnalysis, RootCause
from app.models.capa import CapaAction
from app.models.audit import InvestigationEvent
from app.core.config import settings
from app.core.logging import logger

router = APIRouter()


@router.post("/extract-text", response_model=ExtractionResultSchema)
def extract_from_text(
    req: TextExtractRequest,
    db: Session = Depends(get_db)
):
    """
    Run LangGraph extraction workflow on raw pasted incident text or email content.
    """
    if not req.text or len(req.text.strip()) < 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incident text is too short. Please provide substantive incident details."
        )

    # Check AI key configuration
    if not groq_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Groq AI is not configured. Please configure GROQ_API_KEY in the backend "
                "environment or settings page before requesting AI extraction."
            )
        )

    try:
        # Run LangGraph Extraction State Graph
        initial_state = {
            "source_text": req.text,
            "source_type": req.source_type,
            "cleaned_text": "",
            "extraction_data": {},
            "validated_data": None,
            "evidence_gaps": [],
            "current_step": "init",
            "status": "pending",
            "error": None
        }

        final_state = extraction_graph.invoke(initial_state)

        if final_state.get("status") == "error":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=final_state.get("error", "AI Extraction workflow failed.")
            )

        validated_result = final_state.get("validated_data")
        if not validated_result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No validated data returned from AI extraction graph."
            )

        # If investigation_id provided, attach source document
        if req.investigation_id:
            inv = db.query(Investigation).filter(Investigation.id == req.investigation_id).first()
            if inv:
                source_doc = SourceDocument(
                    investigation_id=inv.id,
                    file_name=f"Direct Input ({req.source_type})",
                    file_type=req.source_type,
                    file_size_bytes=len(req.text.encode('utf-8')),
                    upload_status="processed",
                    raw_content=req.text[:20000],
                    extracted_summary=validated_result.get("problem_statement"),
                    evidence_snippets=validated_result.get("source_evidence", [])
                )
                db.add(source_doc)
                db.commit()

        return validated_result

    except (AIConfigurationError, AIProcessingError) as e:
        logger.error(f"Groq error: {e}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in extract_from_text: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Extraction failure: {str(e)}")


@router.post("/extract-email", response_model=ExtractionResultSchema)
def extract_from_email(
    req: EmailExtractRequest,
    db: Session = Depends(get_db)
):
    """Format email input and run LangGraph extraction workflow."""
    formatted_text = f"EMAIL SUBJECT: {req.subject}\nREPORTING SENDER: {req.sender}\n\nINCIDENT BODY:\n{req.content}"
    text_req = TextExtractRequest(
        text=formatted_text,
        source_type="email",
        investigation_id=req.investigation_id
    )
    return extract_from_text(text_req, db)


@router.post("/upload-pdf")
async def upload_pdf_and_extract(
    file: UploadFile = File(...),
    run_ai_analysis: bool = Form(True),
    investigation_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Upload a PDF deviation report, extract text using PyMuPDF, detect scanned images,
    and optionally run the LangGraph extraction pipeline.
    """
    # 1. Validation of file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Only .pdf documents are supported."
        )

    # 2. Read bytes with size check
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # 3. Extract text via PyMuPDF
    try:
        pdf_info = extract_text_from_pdf(content, file.filename)
    except PDFProcessingError as pe:
        logger.warning(f"PDF extraction issue: {pe.message}")
        if pe.is_ocr_needed:
            return {
                "success": False,
                "status": "ocr_required",
                "filename": file.filename,
                "error": pe.message,
                "extracted_text": None,
                "structured_data": None
            }
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=pe.message)

    extracted_text = pdf_info["text"]

    structured_data = None
    if run_ai_analysis and groq_service.is_configured():
        try:
            initial_state = {
                "source_text": extracted_text,
                "source_type": "pdf",
                "cleaned_text": "",
                "extraction_data": {},
                "validated_data": None,
                "evidence_gaps": [],
                "current_step": "init",
                "status": "pending",
                "error": None
            }
            final_state = extraction_graph.invoke(initial_state)
            if final_state.get("status") != "error":
                structured_data = final_state.get("validated_data")
        except Exception as e:
            logger.warning(f"AI extraction following PDF extraction failed: {e}")

    # Persist source document record if investigation exists
    if investigation_id:
        inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
        if inv:
            source_doc = SourceDocument(
                investigation_id=inv.id,
                file_name=file.filename,
                file_type="pdf",
                file_size_bytes=len(content),
                upload_status="processed",
                raw_content=extracted_text[:30000],
                extracted_summary=structured_data.get("problem_statement") if structured_data else None,
                evidence_snippets=structured_data.get("source_evidence", []) if structured_data else []
            )
            db.add(source_doc)
            db.commit()

    return {
        "success": True,
        "status": "processed",
        "filename": file.filename,
        "page_count": pdf_info["page_count"],
        "char_count": pdf_info["char_count"],
        "extracted_text": extracted_text[:4000] + ("..." if len(extracted_text) > 4000 else ""),
        "full_text": extracted_text,
        "structured_data": structured_data
    }


@router.post("/investigations/{investigation_id}/analyze-rca", response_model=RcaAnalysisResultSchema)
def analyze_rca(
    investigation_id: str,
    db: Session = Depends(get_db)
):
    """
    Execute LangGraph RCA workflow (5 Whys + Fishbone + Potential Root Causes)
    using the verified investigation details from the database.
    """
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found.")

    # Guardrail: Prevent running CAPA on blank/empty investigations
    has_content = bool(
        (inv.title and inv.title.strip() and inv.title != "Untitled Investigation") or
        (inv.problem_statement and inv.problem_statement.strip()) or
        (inv.observed_condition and inv.observed_condition.strip())
    )
    if not has_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate CAPA actions on an empty investigation. Please provide incident details and root causes first."
        )

    # Guardrail: Prevent running RCA on blank/empty investigations
    has_content = bool(
        (inv.title and inv.title.strip() and inv.title != "Untitled Investigation") or
        (inv.problem_statement and inv.problem_statement.strip()) or
        (inv.observed_condition and inv.observed_condition.strip())
    )
    if not has_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate Root Cause Analysis on an empty investigation. Please enter incident details, paste text, or upload a deviation document first."
        )

    if not groq_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Groq AI is not configured. Please supply GROQ_API_KEY to generate RCA."
        )

    ctx = {
        "title": inv.title,
        "api_product": inv.api_product,
        "batch_number": inv.batch_number,
        "process_step": inv.process_step,
        "equipment_id": inv.equipment_id,
        "problem_statement": inv.problem_statement or inv.title,
        "expected_condition": inv.expected_condition,
        "observed_condition": inv.observed_condition,
        "relevant_parameters": inv.relevant_parameters,
        "supporting_observations": inv.supporting_observations
    }

    initial_state = {
        "investigation_id": investigation_id,
        "context": ctx,
        "raw_rca_data": {},
        "five_whys": {},
        "causes": [],
        "current_step": "init",
        "status": "pending",
        "error": None
    }

    final_state = rca_graph.invoke(initial_state)

    if final_state.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=final_state.get("error", "RCA generation failed.")
        )

    # Persist or update 5 Whys in database
    five_whys_dict = final_state.get("five_whys", {})
    existing_5w = db.query(FiveWhysAnalysis).filter(FiveWhysAnalysis.investigation_id == investigation_id).first()
    if existing_5w:
        existing_5w.problem_statement = five_whys_dict.get("problem_statement")
        existing_5w.why_1 = five_whys_dict.get("why_1")
        existing_5w.why_2 = five_whys_dict.get("why_2")
        existing_5w.why_3 = five_whys_dict.get("why_3")
        existing_5w.why_4 = five_whys_dict.get("why_4")
        existing_5w.why_5 = five_whys_dict.get("why_5")
        existing_5w.proposed_root_cause = five_whys_dict.get("proposed_root_cause")
        existing_5w.supporting_evidence = five_whys_dict.get("supporting_evidence", [])
        existing_5w.missing_evidence = five_whys_dict.get("missing_evidence", [])
    else:
        new_5w = FiveWhysAnalysis(
            investigation_id=investigation_id,
            problem_statement=five_whys_dict.get("problem_statement"),
            why_1=five_whys_dict.get("why_1"),
            why_2=five_whys_dict.get("why_2"),
            why_3=five_whys_dict.get("why_3"),
            why_4=five_whys_dict.get("why_4"),
            why_5=five_whys_dict.get("why_5"),
            proposed_root_cause=five_whys_dict.get("proposed_root_cause"),
            supporting_evidence=five_whys_dict.get("supporting_evidence", []),
            missing_evidence=five_whys_dict.get("missing_evidence", [])
        )
        db.add(new_5w)

    # Persist Causes
    causes_list = final_state.get("causes", [])
    # Delete previous AI-proposed causes that were not confirmed by user
    db.query(RootCause).filter(
        RootCause.investigation_id == investigation_id,
        RootCause.is_confirmed_root_cause == False
    ).delete()

    for c in causes_list:
        db_cause = RootCause(
            investigation_id=investigation_id,
            cause_id=c.get("cause_id", "RC-01"),
            description=c.get("description", ""),
            category=c.get("category", "Method / Process"),
            why_plausible=c.get("why_plausible"),
            supporting_evidence=c.get("supporting_evidence", []),
            contradicting_evidence=c.get("contradicting_evidence", []),
            evidence_gaps=c.get("evidence_gaps", []),
            suggested_verification_test=c.get("suggested_verification_test"),
            confidence_assessment=c.get("confidence_assessment", "Moderate evidence support"),
            status="Proposed by AI",
            is_confirmed_root_cause=False
        )
        db.add(db_cause)

    # Add audit log
    event = InvestigationEvent(
        investigation_id=investigation_id,
        event_type="RCA_GENERATED",
        details="Generated 5 Whys and Fishbone root cause hypotheses via LangGraph AI workflow.",
        actor="QualiRoot AI Engine"
    )
    db.add(event)

    db.commit()

    return {
        "five_whys": five_whys_dict,
        "causes": causes_list,
        "investigation_summary": f"Identified {len(causes_list)} potential root causes across fishbone categories.",
        "disclaimer": (
            "AI-generated root causes are hypotheses based on available evidence. "
            "A confirmed root cause requires verification and human review authorization."
        )
    }


@router.post("/investigations/{investigation_id}/generate-capa", response_model=CapaGenerationResultSchema)
def generate_capa(
    investigation_id: str,
    db: Session = Depends(get_db)
):
    """
    Execute LangGraph CAPA workflow (Corrective + Preventive + Effectiveness)
    using the verified root causes from the database.
    """
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found.")

    # Guardrail: Prevent running CAPA on blank/empty investigations
    has_content = bool(
        (inv.title and inv.title.strip() and inv.title != "Untitled Investigation") or
        (inv.problem_statement and inv.problem_statement.strip()) or
        (inv.observed_condition and inv.observed_condition.strip())
    )
    if not has_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate CAPA actions on an empty investigation. Please provide incident details and root causes first."
        )

    if not groq_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Groq AI is not configured. Please supply GROQ_API_KEY to generate CAPA actions."
        )

    # Retrieve existing causes
    db_causes = db.query(RootCause).filter(RootCause.investigation_id == investigation_id).all()
    causes_data = [
        {
            "cause_id": c.cause_id,
            "description": c.description,
            "category": c.category,
            "status": c.status,
            "why_plausible": c.why_plausible
        }
        for c in db_causes
    ]

    initial_state = {
        "investigation_id": investigation_id,
        "investigation_context": {
            "title": inv.title,
            "api_product": inv.api_product,
            "batch_number": inv.batch_number,
            "equipment_id": inv.equipment_id,
            "problem_statement": inv.problem_statement or inv.title
        },
        "root_causes": causes_data,
        "raw_capa_data": {},
        "corrective_actions": [],
        "preventive_actions": [],
        "effectiveness_checks": [],
        "current_step": "init",
        "status": "pending",
        "error": None
    }

    final_state = capa_graph.invoke(initial_state)

    if final_state.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=final_state.get("error", "CAPA generation failed.")
        )

    ca_list = final_state.get("corrective_actions", [])
    pa_list = final_state.get("preventive_actions", [])
    ev_list = final_state.get("effectiveness_checks", [])

    # Persist CAPA actions to database
    # Only delete existing proposed actions so user approved actions are preserved
    db.query(CapaAction).filter(
        CapaAction.investigation_id == investigation_id,
        CapaAction.status == "Proposed"
    ).delete()

    for item in ca_list:
        db_action = CapaAction(
            investigation_id=investigation_id,
            action_id=item.get("action_id", "CA-01"),
            action_type="Corrective",
            description=item.get("description", ""),
            rationale=item.get("rationale"),
            linked_root_cause=item.get("linked_root_cause"),
            priority=item.get("priority", "Medium"),
            responsible_role=item.get("responsible_role", "QA / Manufacturing Lead"),
            target_date=item.get("target_date", "Within 7 days"),
            status="Proposed",
            effectiveness_verification_method=item.get("effectiveness_verification_method")
        )
        db.add(db_action)

    for item in pa_list:
        db_action = CapaAction(
            investigation_id=investigation_id,
            action_id=item.get("action_id", "PA-01"),
            action_type="Preventive",
            description=item.get("description", ""),
            rationale=item.get("rationale"),
            linked_root_cause=item.get("linked_root_cause"),
            priority=item.get("priority", "Medium"),
            responsible_role=item.get("responsible_role", "QA / Engineering Lead"),
            target_date=item.get("target_date", "Within 30 days"),
            status="Proposed",
            effectiveness_verification_method=item.get("effectiveness_verification_method")
        )
        db.add(db_action)

    for item in ev_list:
        db_action = CapaAction(
            investigation_id=investigation_id,
            action_id=item.get("action_id", "EV-01"),
            action_type="Effectiveness Verification",
            description=item.get("description", ""),
            rationale=item.get("rationale"),
            linked_root_cause=item.get("linked_root_cause"),
            priority=item.get("priority", "High"),
            responsible_role=item.get("responsible_role", "Quality Assurance Lead"),
            target_date=item.get("target_date", "Within 60 days"),
            status="Proposed",
            effectiveness_verification_method=item.get("effectiveness_verification_method")
        )
        db.add(db_action)

    event = InvestigationEvent(
        investigation_id=investigation_id,
        event_type="CAPA_GENERATED",
        details="Generated corrective, preventive, and effectiveness verification action recommendations.",
        actor="QualiRoot AI Engine"
    )
    db.add(event)

    db.commit()

    return {
        "corrective_actions": ca_list,
        "preventive_actions": pa_list,
        "effectiveness_checks": ev_list,
        "disclaimer": (
            "Recommendations are advisory quality measures for authorized QA review. "
            "They do not constitute automated batch disposition or regulatory filings."
        )
    }
