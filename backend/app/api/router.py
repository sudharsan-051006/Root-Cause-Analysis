from fastapi import APIRouter
from app.api.endpoints import health, investigations, ai, capa

api_router = APIRouter()

# Health check
api_router.include_router(health.router, tags=["Health"])

# Investigations & RCA
api_router.include_router(investigations.router, prefix="/investigations", tags=["Investigations"])

# AI Extraction & RCA/CAPA LangGraph Workflows
api_router.include_router(ai.router, prefix="/ai", tags=["AI Engine"])

# CAPA Actions
api_router.include_router(capa.router, prefix="/capa-actions", tags=["CAPA"])
