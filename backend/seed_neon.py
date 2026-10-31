import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.session import SessionLocal
from app.services.investigation_service import create_investigation
from app.schemas.investigation import InvestigationCreateSchema
from app.models.evidence import EvidenceGap
from app.models.root_cause import FiveWhysAnalysis, RootCause
from app.models.capa import CapaAction


def seed_neon_data():
    db = SessionLocal()
    try:
        inv_data = InvestigationCreateSchema(
            title="Deviation: OOS Residual Acetone in Atorvastatin Calcium Batch ATC-2026-B089",
            api_product="Atorvastatin Calcium Trihydrate",
            batch_number="ATC-2026-B089",
            process_step="Stage 5 - Final Vacuum Drying & Delumping",
            facility="Apex ChemPharma Sterile API Block B, Room 204",
            equipment_id="CVD-04",
            incident_date="2026-10-24",
            owner="Dr. Elena Vance (Senior Production Shift Supervisor)",
            severity="Major",
            status="Under Investigation",
            problem_statement="QC Analytical Laboratory reported an Out-of-Specification (OOS) result for residual solvent (Acetone) at 5,840 ppm (0.584% w/w) against limit of NMT 5,000 ppm (0.50% w/w).",
            what_happened="Drying cycle initiated at 06:15 on 2026-10-23. Shift log indicates operator shifted drying program to cooling early at 20:45 (14.5 hours vs validated minimum of 18.0 hours) due to an intermittent high-condenser temperature warning chime on CVD-04 control panel.",
            expected_condition="Final dried powder with residual acetone content strictly <= 5,000 ppm per Apex Specification SP-ATC-003 Rev 4 and ICH Q3C (R8) Class 3 Solvent limits.",
            observed_condition="Headspace GC-FID reported 5,840 ppm (Repeat: 5,815 ppm). Out-of-Specification condition confirmed. Lab error ruled out.",
            product_process_impact="Batch cannot be released into commercial supply. Potential risk of polymorphic transition or solvent retention if unvalidated thermal treatment applied.",
            immediate_containment=[
                "ERP/MES quarantine lock applied to batch ATC-2026-B089",
                "Physical yellow quarantine tags affixed to 6 stainless steel drums (312.4 kg) in Bay 3",
                "Conical Vacuum Dryer CVD-04 tagged out of service pending QA & Engineering evaluation",
                "Repeat testing confirmed OOS; laboratory testing error officially ruled out"
            ],
            relevant_parameters=[
                {"parameter_name": "Residual Acetone", "observed_value": "5,840 ppm", "target_value": "<= 5,000 ppm", "unit": "ppm", "status": "Deviation"},
                {"parameter_name": "Vacuum Drying Time", "observed_value": "14.5 hours", "target_value": ">= 18.0 hours", "unit": "hours", "status": "Deviation"},
                {"parameter_name": "Chilled Water Return Temp", "observed_value": "18.4 C", "target_value": "<= 15.0 C", "unit": "C", "status": "Alarm"},
                {"parameter_name": "Dryer Jacket Temp", "observed_value": "49.8 C", "target_value": "50 +/- 2 C", "unit": "C", "status": "Normal"},
                {"parameter_name": "Vacuum Level", "observed_value": "14.2 mbar", "target_value": "<= 15.0 mbar", "unit": "mbar", "status": "Normal"}
            ],
            potential_quality_impact="Batch non-compliant with drug substance filing specifications; commercial release withheld.",
            potential_batch_impact="Requires QA-authorized rework evaluation or validated re-drying protocol.",
            initial_risk_assessment="Moderate-to-High quality risk. Equipment cooling deficiency requires facility utility review.",
            field_provenance={
                "api_product": {"value": "Atorvastatin Calcium Trihydrate", "origin": "source_extracted", "evidence_quote": "Product / API: Atorvastatin Calcium Trihydrate"},
                "batch_number": {"value": "ATC-2026-B089", "origin": "source_extracted", "evidence_quote": "Batch Number: ATC-2026-B089"},
                "equipment_id": {"value": "CVD-04", "origin": "source_extracted", "evidence_quote": "Equipment: Conical Vacuum Dryer CVD-04"},
                "problem_statement": {"value": "QC Analytical Laboratory reported an Out-of-Specification (OOS) result for residual solvent (Acetone) at 5,840 ppm...", "origin": "source_extracted", "evidence_quote": "Observed Laboratory Result: 5,840 ppm"}
            }
        )

        inv = create_investigation(db, inv_data, investigation_id="INV-2026-0001")
        print(f"Created Investigation {inv.id} on Neon PostgreSQL.")

        # Add Evidence Gaps
        gaps = [
            EvidenceGap(
                investigation_id=inv.id,
                description="SCADA continuous temperature and vacuum trend historian for CVD-04 drying cycle",
                why_it_matters="Determines whether temperature was uniform or fluctuated prior to early shutdown chime.",
                helps_evaluate_cause="Condenser chiller loop capacity deficit",
                suggested_verification_method="Export 1-second interval trends from Wonderware SCADA system",
                priority="Critical",
                status="Requested"
            ),
            EvidenceGap(
                investigation_id=inv.id,
                description="Calibration certificates for condenser temperature sensor TE-204-2 and chilled water return sensor",
                why_it_matters="Rules out false temperature alarm trigger due to metrological drift.",
                helps_evaluate_cause="Sensor calibration drift / false alarm",
                suggested_verification_method="Review calibration logbook in Metrology Department",
                priority="High",
                status="Missing"
            ),
            EvidenceGap(
                investigation_id=inv.id,
                description="Central facility chilled water utility loop temperature logs for API Block B",
                why_it_matters="Distinguishes between centralized utility cooling deficit vs CVD-04 localized heat exchanger fouling.",
                helps_evaluate_cause="Facility central chilling utility failure",
                suggested_verification_method="Engineering BMS utility telemetry export",
                priority="High",
                status="Missing"
            )
        ]
        for g in gaps:
            db.add(g)

        # Add 5 Whys Analysis
        fw = FiveWhysAnalysis(
            investigation_id=inv.id,
            problem_statement="QC release testing reported residual acetone Out-of-Specification at 5,840 ppm (limit: <= 5,000 ppm)",
            why_1="Drying cycle on Conical Vacuum Dryer CVD-04 was terminated early after 14.5 hours instead of SOP-PRD-502 mandated 18.0 hours.",
            why_2="Shift operator switched dryer program to cooling mode early due to intermittent high-condenser temperature warning alarm.",
            why_3="Condenser secondary chilled water return temperature reached 18.4 C exceeding the upper alarm limit of 15.0 C.",
            why_4="Chilled water loop flow rate was restricted due to scale accumulation in condenser heat exchanger tube bundle.",
            why_5="Requires review of central utility maintenance log and condenser descaling schedule.",
            proposed_root_cause="Shortened vacuum drying cycle (14.5h vs 18.0h) caused by high-condenser cooling water return temperature alarm, leaving solvent desorbing incomplete.",
            supporting_evidence=[
                "BMR Section 8.4 recorded 14.5h actual drying time vs 18.0h validated cycle",
                "Chilled water return temperature logged at 18.4 C (limit: 15.0 C)",
                "Headspace GC-FID repeat testing confirmed 5,815 ppm acetone (analytical error ruled out)"
            ],
            missing_evidence=[
                "Electronic SCADA temperature trend historian",
                "Engineering descaling work orders for CVD-04 condenser"
            ],
            reviewer_decision="Under Investigation"
        )
        db.add(fw)

        # Add Fishbone Causes across cGMP Categories
        causes = [
            RootCause(
                investigation_id=inv.id,
                cause_id="RC-01",
                description="Shortened vacuum drying duration (14.5h vs 18.0h validated standard)",
                category="Method / Process",
                why_plausible="Insufficient residence time under vacuum prevented complete solvent desorption from API crystal lattice.",
                confidence_assessment="Strong evidence support",
                status="Under Investigation",
                is_confirmed_root_cause=False
            ),
            RootCause(
                investigation_id=inv.id,
                cause_id="RC-02",
                description="Condenser refrigeration heat exchanger fouling or reduced chilled water flow",
                category="Machine / Equipment",
                why_plausible="Chilled water return temperature reached 18.4 C (alarm limit > 15 C), triggering operator alarm.",
                confidence_assessment="Strong evidence support",
                status="Under Investigation",
                is_confirmed_root_cause=True
            ),
            RootCause(
                investigation_id=inv.id,
                cause_id="RC-03",
                description="Operator response to warning chime without supervisor QA concurrence",
                category="Man / Personnel",
                why_plausible="Operator terminated vacuum program early without consulting deviation protocol.",
                confidence_assessment="Moderate evidence support",
                status="Under Investigation",
                is_confirmed_root_cause=False
            ),
            RootCause(
                investigation_id=inv.id,
                cause_id="RC-04",
                description="High incoming wet cake solvent moisture prior to drying charge",
                category="Material",
                why_plausible="Starting wet cake weight was 420 kg with elevated mother liquor retention.",
                confidence_assessment="Low evidence support",
                status="Proposed by AI",
                is_confirmed_root_cause=False
            ),
            RootCause(
                investigation_id=inv.id,
                cause_id="RC-05",
                description="Condenser temperature sensor TE-204-2 calibration drift",
                category="Measurement",
                why_plausible="Potential faulty reading triggering false high-temperature chime.",
                confidence_assessment="Moderate evidence support",
                status="Proposed by AI",
                is_confirmed_root_cause=False
            ),
            RootCause(
                investigation_id=inv.id,
                cause_id="RC-06",
                description="Central chilled water utility loop supply temperature elevation",
                category="Environment",
                why_plausible="Facility central cooling loop capacity deficit impacting Room 204.",
                confidence_assessment="Moderate evidence support",
                status="Proposed by AI",
                is_confirmed_root_cause=False
            )
        ]
        for c in causes:
            db.add(c)

        # Add CAPA Actions
        capas = [
            CapaAction(
                investigation_id=inv.id,
                action_id="CA-01",
                action_type="Corrective",
                description="Perform technical evaluation and validated re-drying protocol on quarantined Batch ATC-2026-B089 in accordance with QA rework SOP-QA-108.",
                rationale="Direct batch non-conformance remediation under QA oversight.",
                priority="Critical",
                responsible_role="Manufacturing Science & Technology (MS&T) Lead",
                target_date="Within 7 calendar days",
                status="Approved",
                effectiveness_verification_method="Analytical release testing of re-dried powder to verify residual acetone <= 2,500 ppm"
            ),
            CapaAction(
                investigation_id=inv.id,
                action_id="PA-01",
                action_type="Preventive",
                description="Overhaul CVD-04 condenser heat exchanger, inspect refrigeration compressor, and descale secondary chilled water loop piping.",
                rationale="Restore condenser thermal heat transfer coefficient to prevent intermittent 18.4 C cooling spikes.",
                priority="High",
                responsible_role="Plant Engineering Lead",
                target_date="Within 21 calendar days",
                status="In Progress",
                effectiveness_verification_method="Post-maintenance thermal load test under simulated solvent condensing conditions"
            ),
            CapaAction(
                investigation_id=inv.id,
                action_id="EV-01",
                action_type="Effectiveness Verification",
                description="Track and audit residual solvent test results and condenser temperatures across the next 5 consecutive commercial batches of Atorvastatin Calcium on CVD-04.",
                rationale="ICH Q10 requirement for verification of CAPA long-term effectiveness.",
                priority="High",
                responsible_role="QA Compliance Manager",
                target_date="60 calendar days post-implementation",
                status="Proposed",
                effectiveness_verification_method="Audit trail and QC Certificate of Analysis review for all 5 subsequent batches"
            )
        ]
        for cp in capas:
            db.add(cp)

        db.commit()
        print("Successfully seeded complete demonstration RCA and CAPA dataset into Neon PostgreSQL!")

    finally:
        db.close()


if __name__ == "__main__":
    seed_neon_data()
