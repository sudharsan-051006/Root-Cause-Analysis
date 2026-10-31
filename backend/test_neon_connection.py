"""
QualiRoot AI - Neon PostgreSQL Connection Diagnostic Utility
Run this script to verify your Neon Database connection string:
    python test_neon_connection.py [optional_connection_string]
"""
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings


def test_neon_connection(connection_url: str = None):
    url = connection_url or settings.DATABASE_URL
    print("=" * 65)
    print("QUALIROOT AI - NEON POSTGRESQL DIAGNOSTIC TOOL")
    print("=" * 65)

    if not url or "localhost" in url:
        print("[!] Warning: Using local default connection string.")
        print("To test your Neon DB, either set DATABASE_URL in backend/.env or pass it:")
        print("python test_neon_connection.py \"postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require\"\n")

    # 1. Normalize scheme if starts with postgres://
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
        print("[*] Normalized connection scheme to 'postgresql://'")

    # 2. Check Neon SSL requirement
    if "neon.tech" in url and "sslmode=" not in url:
        delimiter = "&" if "?" in url else "?"
        url = f"{url}{delimiter}sslmode=require"
        print("[*] Enforced '?sslmode=require' for Neon SSL connection.")

    masked_url = url
    if "@" in url:
        parts = url.split("@")
        credentials = parts[0].split("://")[-1]
        user = credentials.split(":")[0]
        masked_url = f"{url.split('://')[0]}://{user}:*****@{parts[1]}"

    print(f"[*] Target Endpoint: {masked_url}")
    print("[*] Connecting with 20s timeout for serverless compute wake-up...")

    try:
        is_pooler = "-pooler" in url
        engine = create_engine(
            url,
            poolclass=NullPool if is_pooler else None,
            connect_args={"connect_timeout": 20, "sslmode": "require"} if "postgresql" in url else {}
        )
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();")).fetchone()
            db_name = conn.execute(text("SELECT current_database();")).fetchone()[0]
            current_user = conn.execute(text("SELECT current_user;")).fetchone()[0]

        print("\n" + "=" * 65)
        print("[SUCCESS] Connected to Neon PostgreSQL!")
        print(f"Database Name: {db_name}")
        print(f"Database User: {current_user}")
        print(f"PostgreSQL Version: {result[0]}")
        print("=" * 65)
        print("\nYour Neon Database is ready for QualiRoot AI.")
        print("Ensure this connection string is saved in backend/.env under DATABASE_URL.")
        return True

    except Exception as e:
        print("\n" + "=" * 65)
        print("[FAILED] Could not connect to Neon PostgreSQL.")
        print(f"Error: {e}")
        print("=" * 65)
        print("\nTroubleshooting Tips:")
        print("1. In Neon Console (console.neon.tech), ensure your compute endpoint is not deleted.")
        print("2. Copy the Connection String from the Neon dashboard (select 'Connection String' -> 'PostgreSQL').")
        print("3. Verify the password is typed or pasted accurately.")
        print("4. Ensure your internet connection permits outbound TCP port 5432.")
        return False


if __name__ == "__main__":
    cli_arg = sys.argv[1] if len(sys.argv) > 1 else None
    test_neon_connection(cli_arg)
