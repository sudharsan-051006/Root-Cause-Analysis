def test_create_and_retrieve_investigation(client):
    payload = {
        "title": "Deviation: OOS Residual Acetone in Atorvastatin Calcium",
        "api_product": "Atorvastatin Calcium Trihydrate",
        "batch_number": "ATC-2026-B089",
        "process_step": "Stage 5 - Vacuum Drying",
        "equipment_id": "CVD-04",
        "facility": "Apex Sterile API Block B",
        "severity": "Major",
        "status": "Under Investigation",
        "problem_statement": "QC Analytical reported residual acetone of 5,840 ppm against limit of NMT 5,000 ppm.",
        "expected_condition": "Residual solvent <= 5,000 ppm",
        "observed_condition": "Residual solvent = 5,840 ppm",
        "immediate_containment": ["Quarantined 6 drums (312.4 kg) in Bay 3", "Tagged CVD-04 out of service"],
        "field_provenance": {
            "batch_number": {
                "value": "ATC-2026-B089",
                "origin": "source_extracted",
                "evidence_quote": "Batch Number: ATC-2026-B089"
            }
        }
    }

    # 1. Create
    create_resp = client.post("/api/investigations", json=payload)
    assert create_resp.status_code == 201
    created_data = create_resp.json()
    assert created_data["id"].startswith("INV-")
    assert created_data["api_product"] == "Atorvastatin Calcium Trihydrate"
    assert created_data["batch_number"] == "ATC-2026-B089"
    assert len(created_data["immediate_containment"]) == 2
    inv_id = created_data["id"]

    # 2. Retrieve
    get_resp = client.get(f"/api/investigations/{inv_id}")
    assert get_resp.status_code == 200
    retrieved = get_resp.json()
    assert retrieved["id"] == inv_id
    assert retrieved["equipment_id"] == "CVD-04"
    assert retrieved["is_approved"] is False


def test_update_investigation(client):
    create_resp = client.post("/api/investigations", json={
        "title": "Initial Title",
        "api_product": "Paracetamol",
        "status": "Draft"
    })
    inv_id = create_resp.json()["id"]

    # Patch update
    patch_resp = client.patch(f"/api/investigations/{inv_id}", json={
        "title": "Updated Title After QA Review",
        "status": "Under Investigation",
        "severity": "Major"
    })
    assert patch_resp.status_code == 200
    updated = patch_resp.json()
    assert updated["title"] == "Updated Title After QA Review"
    assert updated["status"] == "Under Investigation"
    assert updated["severity"] == "Major"


def test_list_and_filter_investigations(client):
    client.post("/api/investigations", json={
        "title": "Investigation A",
        "api_product": "Ibuprofen API",
        "batch_number": "IBU-101",
        "status": "Draft",
        "severity": "Minor"
    })
    client.post("/api/investigations", json={
        "title": "Investigation B",
        "api_product": "Omeprazole API",
        "batch_number": "OME-202",
        "status": "Under Investigation",
        "severity": "Critical"
    })

    # Search by batch
    resp = client.get("/api/investigations?search=IBU-101")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 1
    assert any(i["batch_number"] == "IBU-101" for i in items)

    # Filter by severity
    resp_crit = client.get("/api/investigations?severity=Critical")
    assert resp_crit.status_code == 200
    crit_items = resp_crit.json()
    assert all(i["severity"] == "Critical" for i in crit_items)


def test_dashboard_summary(client):
    resp = client.get("/api/investigations/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_investigations" in data
    assert "in_progress_count" in data
    assert "awaiting_review_count" in data
    assert "open_capa_count" in data
    assert data["total_investigations"] >= 0


def test_evidence_gap_management(client):
    inv_resp = client.post("/api/investigations", json={"title": "Gap Test Inv"})
    inv_id = inv_resp.json()["id"]

    # Add evidence gap
    gap_payload = {
        "description": "SCADA temperature and vacuum trends for CVD-04",
        "why_it_matters": "Confirms drying cycle vacuum depth and thermal uniformity",
        "helps_evaluate_cause": "Dryer temperature sensor failure",
        "suggested_verification_method": "Export electronic records from SCADA historian",
        "priority": "Critical",
        "status": "Missing"
    }
    gap_resp = client.post(f"/api/investigations/{inv_id}/evidence-gaps", json=gap_payload)
    assert gap_resp.status_code == 200
    gap = gap_resp.json()
    assert gap["id"].startswith("GAP-")
    assert gap["status"] == "Missing"
    gap_id = gap["id"]

    # Update evidence gap status
    patch_resp = client.patch(f"/api/investigations/{inv_id}/evidence-gaps/{gap_id}", json={
        "description": "SCADA temperature and vacuum trends for CVD-04",
        "why_it_matters": "Confirms drying cycle vacuum depth and thermal uniformity",
        "status": "Provided",
        "reviewer_notes": "Received 2026-10-25 from Engineering"
    })
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "Provided"
    assert patch_resp.json()["reviewer_notes"] == "Received 2026-10-25 from Engineering"


def test_review_and_approval_workflow(client):
    inv_resp = client.post("/api/investigations", json={"title": "Approval Test Inv"})
    inv_id = inv_resp.json()["id"]

    # 1. Save Review
    review_resp = client.post(f"/api/investigations/{inv_id}/save-review", json={
        "reviewer_decision": "Awaiting Review",
        "reviewer_notes": "Preliminary 5 Whys and fishbone verified. Pending final QA Signoff.",
        "reviewer_name": "Dr. Elena Vance"
    })
    assert review_resp.status_code == 200
    assert review_resp.json()["status"] == "Awaiting Review"
    assert review_resp.json()["reviewer_notes"] == "Preliminary 5 Whys and fishbone verified. Pending final QA Signoff."

    # 2. Approve
    approve_resp = client.post(f"/api/investigations/{inv_id}/approve", json={
        "approved_by": "QA Director Marcus Webb",
        "approval_notes": "All critical evidence reviewed and verified. Proceed with CAPA actions."
    })
    assert approve_resp.status_code == 200
    appr_data = approve_resp.json()
    assert appr_data["is_approved"] is True
    assert appr_data["status"] == "Approved"
    assert appr_data["approved_by"] == "QA Director Marcus Webb"
