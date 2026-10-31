def test_capa_crud_workflow(client):
    # 1. Create an investigation first
    inv_resp = client.post("/api/investigations", json={"title": "CAPA Test Inv"})
    inv_id = inv_resp.json()["id"]

    # 2. Create manual CAPA action
    capa_payload = {
        "investigation_id": inv_id,
        "action_id": "CA-01",
        "action_type": "Corrective",
        "description": "Recalibrate chilled water return temperature sensor TE-204-2",
        "rationale": "Ensure sensor is reading within +/- 0.5C calibrated tolerance",
        "priority": "High",
        "responsible_role": "Metrology Lead",
        "status": "Proposed",
        "effectiveness_verification_method": "Post-calibration verification certificate"
    }
    create_resp = client.post("/api/capa-actions", json=capa_payload)
    assert create_resp.status_code == 201
    capa = create_resp.json()
    assert capa["action_id"] == "CA-01"
    assert capa["status"] == "Proposed"
    capa_db_id = capa["id"]

    # 3. List CAPAs
    list_resp = client.get("/api/capa-actions")
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert len(items) >= 1
    assert any(c["id"] == capa_db_id for c in items)

    # 4. Update CAPA status to In Progress
    patch_resp = client.patch(f"/api/capa-actions/{capa_db_id}", json={
        "action_id": "CA-01",
        "action_type": "Corrective",
        "description": "Recalibrate chilled water return temperature sensor TE-204-2",
        "status": "In Progress",
        "completion_notes": "Work order WO-9023 issued to instrumentation technician."
    })
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "In Progress"
    assert "WO-9023" in patch_resp.json()["completion_notes"]

    # 5. Delete CAPA action
    del_resp = client.delete(f"/api/capa-actions/{capa_db_id}")
    assert del_resp.status_code == 204
