from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.logging import logger
from app.db.session import init_db, active_db_type
from app.api.router import api_router
from app.api.endpoints import health


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup initialization
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    try:
        init_db()
        logger.info(f"Database initialized with engine type: {active_db_type}")
    except Exception as e:
        logger.error(f"Database initialization warning: {e}")
    yield
    # Shutdown logic
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-assisted investigations. Evidence-led conclusions. Pharmaceutical API Root Cause Analysis.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"] if settings.ENVIRONMENT == "development" else settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root level health endpoint
app.include_router(health.router, tags=["Health"])

# API router under /api
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "tagline": "AI-assisted investigations. Evidence-led conclusions.",
        "version": settings.VERSION,
        "docs": "/docs",
        "api": "/api"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred.",
            "error_type": exc.__class__.__name__
        }
    )
