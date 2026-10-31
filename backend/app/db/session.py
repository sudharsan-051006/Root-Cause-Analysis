from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from app.core.config import settings
from app.core.logging import logger
from app.db.base import Base

active_db_type = "unknown"
db_connection_error = None
engine = None
SessionLocal = None


def is_neon_database(url: str) -> bool:
    return "neon.tech" in url.lower()


def is_neon_pooler(url: str) -> bool:
    return "-pooler" in url.lower() and "neon.tech" in url.lower()


def initialize_engine():
    global active_db_type, db_connection_error, engine, SessionLocal
    
    pg_url = settings.DATABASE_URL
    is_neon = is_neon_database(pg_url)
    is_pooler = is_neon_pooler(pg_url)

    # 1. Attempt primary PostgreSQL / Neon connection
    try:
        masked_host = pg_url.split('@')[-1] if '@' in pg_url else pg_url
        if is_neon:
            logger.info(f"Connecting to Neon Serverless PostgreSQL at {masked_host}...")
        else:
            logger.info(f"Connecting to PostgreSQL at {masked_host}...")

        # Connection arguments tailored for Neon serverless
        connect_args = {}
        if "postgresql" in pg_url:
            # For Neon serverless, allow 20s for suspended compute endpoints to unpause
            connect_args["connect_timeout"] = 20 if is_neon else 5
            if is_neon:
                connect_args["sslmode"] = "require"

        # Engine pool configuration:
        # If Neon pooled endpoint (-pooler with pgBouncer), use NullPool to avoid duplicate pooling
        if is_pooler:
            logger.info("Detected Neon pooled connection endpoint. Using NullPool for transaction pooling.")
            test_engine = create_engine(
                pg_url,
                poolclass=NullPool,
                connect_args=connect_args
            )
        else:
            test_engine = create_engine(
                pg_url,
                pool_pre_ping=True,      # Discards dropped serverless sockets
                pool_recycle=300,        # Recycles connections every 5 minutes
                connect_args=connect_args
            )

        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        engine = test_engine
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        active_db_type = "neon_postgresql" if is_neon else "postgresql"
        db_connection_error = None
        logger.info(f"Successfully connected to {active_db_type.upper()} database.")
        return

    except Exception as e:
        db_connection_error = str(e)
        logger.warning(f"PostgreSQL connection failed: {e}")

    # 2. Resilient fallback to SQLite if enabled
    if settings.ALLOW_SQLITE_FALLBACK:
        logger.warning(
            "ALLOW_SQLITE_FALLBACK is enabled. Initializing embedded SQLite persistent database."
        )
        try:
            sqlite_engine = create_engine(
                settings.SQLITE_URL,
                connect_args={"check_same_thread": False}
            )
            with sqlite_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            engine = sqlite_engine
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            active_db_type = "sqlite"
            logger.info(f"Successfully initialized SQLite database at {settings.SQLITE_URL}")
            return
        except Exception as sqle:
            logger.error(f"SQLite fallback also failed: {sqle}")
            db_connection_error = f"PG: {db_connection_error} | SQLite: {str(sqle)}"

    logger.error("Database connection could not be established. Persistence unavailable.")


initialize_engine()


def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise RuntimeError(f"Database session unavailable: {db_connection_error}")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables in the active database engine."""
    import app.models  # Ensures all SQLAlchemy models are registered on Base.metadata
    if engine is not None:
        Base.metadata.create_all(bind=engine)
        logger.info(f"Database tables verified/initialized using engine ({active_db_type}).")
    else:
        logger.error("Cannot initialize tables: engine is None.")
