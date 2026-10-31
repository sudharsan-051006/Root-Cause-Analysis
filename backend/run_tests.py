import os
import sys
import traceback

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Compatibility patch for starlette TestClient with httpx 0.28+
import httpx
_orig_httpx_init = httpx.Client.__init__
def _compat_httpx_init(self, *args, **kwargs):
    kwargs.pop("app", None)
    return _orig_httpx_init(self, *args, **kwargs)
httpx.Client.__init__ = _compat_httpx_init

from fastapi.testclient import TestClient
from app.db.session import init_db, get_db, SessionLocal
from app.main import app

# Tests modules
import tests.test_health as t_health
import tests.test_investigations as t_inv
import tests.test_schemas_and_validation as t_schemas
import tests.test_ai_and_pdf as t_ai
import tests.test_capa as t_capa


def get_test_client():
    init_db()
    client = TestClient(app)
    return client


def main():
    print("=" * 60)
    print("QUALIROOT AI - BACKEND AUTOMATED TEST SUITE")
    print("=" * 60)

    client = get_test_client()

    tests_to_run = [
        # Health tests
        ("test_health_endpoint", lambda: t_health.test_health_endpoint(client)),
        ("test_api_health_endpoint", lambda: t_health.test_api_health_endpoint(client)),
        
        # Schema & Validation tests
        ("test_extraction_schema_valid", t_schemas.test_extraction_schema_valid),
        ("test_rca_and_fishbone_schema_validation", t_schemas.test_rca_and_fishbone_schema_validation),
        ("test_capa_schema_validation", t_schemas.test_capa_schema_validation),
        
        # AI & Document Extraction tests
        ("test_pdf_extraction_success", t_ai.test_pdf_extraction_success),
        ("test_pdf_empty_error", t_ai.test_pdf_empty_error),
        ("test_prompt_injection_sanitization", t_ai.test_prompt_injection_sanitization),
        ("test_ai_missing_key_behavior", lambda: t_ai.test_ai_missing_key_behavior(client)),
        ("test_invalid_file_upload", lambda: t_ai.test_invalid_file_upload(client)),
        
        # Investigation lifecycle tests
        ("test_create_and_retrieve_investigation", lambda: t_inv.test_create_and_retrieve_investigation(client)),
        ("test_update_investigation", lambda: t_inv.test_update_investigation(client)),
        ("test_list_and_filter_investigations", lambda: t_inv.test_list_and_filter_investigations(client)),
        ("test_dashboard_summary", lambda: t_inv.test_dashboard_summary(client)),
        ("test_evidence_gap_management", lambda: t_inv.test_evidence_gap_management(client)),
        ("test_review_and_approval_workflow", lambda: t_inv.test_review_and_approval_workflow(client)),
        
        # CAPA CRUD tests
        ("test_capa_crud_workflow", lambda: t_capa.test_capa_crud_workflow(client)),
    ]

    passed = 0
    failed = 0

    for name, test_func in tests_to_run:
        try:
            test_func()
            print(f"[PASS] {name}", flush=True)
            passed += 1
        except Exception as e:
            print(f"[FAIL] {name}: {e}", flush=True)
            traceback.print_exc()
            failed += 1

    print("=" * 60, flush=True)
    print(f"RESULTS: {passed} PASSED, {failed} FAILED (TOTAL: {len(tests_to_run)})", flush=True)
    print("=" * 60, flush=True)

    client.close()

    if failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
