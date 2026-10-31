from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db, active_db_type, db_connection_error
from app.ai.groq_client import groq_service
from app.core.config import settings

router = APIRouter()


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    # Check DB
    db_alive = False
    try:
        db.execute(text("SELECT 1"))
        db_alive = True
    except Exception as e:
        db_alive = False

    ai_status = groq_service.get_status()

    return {
        "status": "healthy" if db_alive else "degraded",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": {
            "connected": db_alive,
            "type": active_db_type,
            "error": db_connection_error if not db_alive else None
        },
        "ai_engine": {
            "provider": "Groq",
            "model": ai_status["model"],
            "configured": ai_status["is_configured"],
            "message": ai_status["message"]
        }
    }
