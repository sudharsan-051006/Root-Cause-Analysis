# QualiRoot AI

> **"AI-assisted investigations. Evidence-led conclusions."**  
> AI-Powered Root Cause Analysis (RCA) and CAPA Management System for Active Pharmaceutical Ingredient (API) Manufacturing.

---

## 1. System Overview

**QualiRoot AI** is an enterprise-grade Root Cause Analysis platform designed specifically for pharmaceutical quality assurance professionals, deviation investigators, and manufacturing leads. Operating under **ICH Q9 (Quality Risk Management)** and **ICH Q10 (Pharmaceutical Quality System)** paradigms, QualiRoot AI transforms unstructured manufacturing incident reports into structured, traceable RCA investigations with strict provenance tracking and evidence verification.

### Core Pharmaceutical Guardrails
- **Hypotheses vs. Confirmation**: AI-generated root causes are always explicitly classified as hypotheses until substantiated by physical evidence and authorized by a designated human QA reviewer.
- **Strict Evidence Provenance**: Every extracted field maintains a verifiable origin tag (`source_extracted`, `inferred_by_ai`, `entered_by_user`, or `confirmed_by_reviewer`) linking back to source citations.
- **Evidence Gap Distinction**: The system distinguishes between records *not mentioned* in an uploaded report vs. records *confirmed not to exist*.
- **Advisory CAPA Boundaries**: Corrective and preventive recommendations are advisory measures for qualified QA evaluation—never automated instructions to disposition, scrap, or reprocess commercial drug batches.
- **Fault-Tolerant Resilience**: Non-AI features, database persistence, and investigation workspaces remain fully operational even if external AI APIs are unconfigured or rate-limited.

---

## 2. Architecture & Tech Stack

```
                          [ Client Browser ]
                                  │
                   React 18 + Redux Toolkit + Vite
                                  │
                                  ▼
                   FastAPI High-Performance Backend
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
   PyMuPDF (fitz)             LangGraph               SQLAlchemy 2.0
   Digital PDF & OCR      Multi-Stage Agentic       PostgreSQL (Primary)
   Text Extraction             Workflows             Embedded SQLite (Fallback)
          │                       │                       │
          ▼                       ▼                       ▼
  Extracted Document         Groq Cloud               Persistent
   Evidence Buffer      (llama-3.3-70b-versatile)   Investigation Data
```

### Mandatory Technology Stack
- **Frontend**: React 18, Vite, Redux Toolkit (`@reduxjs/toolkit`, `react-redux`), React Router v6, Tailwind CSS, Lucide React icons.
- **Backend**: Python 3.10+, FastAPI, Pydantic v2 schemas, SQLAlchemy 2.0 ORM, Alembic migrations, PyMuPDF (`fitz`), `python-multipart`.
- **AI Engine**: LangGraph typed state workflows, Groq API (`openai/gpt-oss-120b` or currently supported Groq model with automatic graceful degradation).
- **Database**: PostgreSQL (Neon Serverless PostgreSQL or local PostgreSQL, with automatic resilient fallback to persistent embedded SQLite if remote DB is offline).

---

## 3. Directory Structure

```
qualiroot-ai/
├── sample_data/                        # Ready-to-use pharmaceutical test datasets
│   ├── 01_Text_Incident_Residual_Solvent_OOS.txt
│   ├── 02_Email_Report_Crystallization_Polymorph_Shift.txt
│   ├── 03_Text_Incident_Bioburden_Endotoxin_Exceedance.txt
│   ├── 04_Text_Incident_Degradation_Impurity_Spike.txt
│   ├── 05_PDF_Deviation_Report_OOS_Residual_Solvent.pdf
│   ├── 06_PDF_Scanned_Logsheet_Simulation_OCR_Test.pdf
│   └── HOW_TO_TEST_FROM_WEB_APP.md     # Step-by-step browser testing guide
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application & lifespan
│   │   ├── core/
│   │   │   ├── config.py               # Pydantic Settings & environment
│   │   │   ├── logging.py              # Secret-redacting logger
│   │   │   └── security.py             # Input sanitization
│   │   ├── db/
│   │   │   ├── base.py                 # SQLAlchemy declarative base
│   │   │   └── session.py              # Dual-engine session manager (PG + SQLite)
│   │   ├── models/
│   │   │   ├── investigation.py        # Investigation table
│   │   │   ├── evidence.py             # SourceDocument & EvidenceGap models
│   │   │   ├── root_cause.py           # FiveWhysAnalysis & RootCause models
│   │   │   ├── capa.py                 # CapaAction model
│   │   │   └── audit.py                # InvestigationEvent audit log
│   │   ├── schemas/
│   │   │   ├── ai.py                   # Strict extraction schemas & provenance
│   │   │   ├── investigation.py        # Investigation CRUD & summary schemas
│   │   │   ├── root_cause.py           # 5 Whys & Fishbone schemas
│   │   │   └── capa.py                 # CAPA schemas & validation
│   │   ├── services/
│   │   │   ├── pdf_service.py          # PyMuPDF extraction & OCR detection
│   │   │   └── investigation_service.py# Persistence business logic
│   │   ├── ai/
│   │   │   ├── prompts.py              # cGMP domain system & user prompts
│   │   │   ├── groq_client.py          # Groq service with bounded retries
│   │   │   ├── graph_state.py          # LangGraph TypedDict states
│   │   │   ├── graph_workflow.py       # Extraction LangGraph workflow
│   │   │   └── rca_capa_graphs.py      # RCA & CAPA LangGraph workflows
│   │   └── api/
│   │       ├── router.py               # Combined API v1 router
│   │       └── endpoints/
│   │           ├── health.py           # /health & /api/health
│   │           ├── investigations.py   # Investigation CRUD & approvals
│   │           ├── ai.py               # Extraction, RCA & CAPA AI endpoints
│   │           └── capa.py             # CAPA action management
│   ├── tests/
│   │   ├── test_health.py
│   │   ├── test_investigations.py
│   │   ├── test_schemas_and_validation.py
│   │   ├── test_ai_and_pdf.py
│   │   └── test_capa.py
│   ├── sample_data/
│   │   ├── fictional_incident_residual_solvent.txt
│   │   └── fictional_incident_email.json
│   ├── run_tests.py                    # Automated test runner (17 test cases)
│   ├── alembic.ini                     # Alembic configuration
│   ├── requirements.txt                # Python dependencies
│   └── .env.example                    # Environment template
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── store.js                # Redux Toolkit store
│   │   ├── features/
│   │   │   ├── investigation/          # Form, slice, and approval modal
│   │   │   ├── ai-assistant/           # Intake panel, PDF handler, AI slice
│   │   │   ├── root-cause/             # 5 Whys & 6-category Fishbone diagram
│   │   │   └── capa/                   # CAPA workspace & slice
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx           # Overview & KPI counters
│   │   │   ├── InvestigationsList.jsx  # Searchable directory
│   │   │   ├── InvestigationWorkspace.jsx # Central split-pane workspace
│   │   │   ├── CapaActionsPage.jsx     # Organization-wide CAPA tracker
│   │   │   └── SettingsPage.jsx        # Diagnostics & AI/DB status
│   │   ├── components/
│   │   │   ├── common/                 # Button, Card, Badges
│   │   │   └── layout/                 # AppShell, Sidebar, Header
│   │   ├── services/
│   │   │   └── api.js                  # Frontend HTTP API client
│   │   ├── App.jsx                     # Route definitions
│   │   ├── main.jsx                    # React entrypoint
│   │   └── index.css                   # Tailwind styling
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── docker-compose.yml                  # PostgreSQL container config
└── README.md
```

---

## 4. End-to-End Investigation Workflow

```
Incident Input (PDF / Pasted Text / Email)
    ↓
Backend PyMuPDF Extraction & OCR Detection
    ↓
LangGraph AI Information Extraction (Typed State)
    ↓
Strict Pydantic Schema Validation & Provenance Tagging
    ↓
Automatic RCA Form Population (Sections A, B, C, D)
    ↓
Evidence Gap Analysis (Unreviewed records & verifications)
    ↓
Interactive Root Cause Analysis (5 Whys + 6-Category Fishbone)
    ↓
CAPA Generation (Corrective + Preventive + Effectiveness)
    ↓
Human Review, Modification, and Form Sign-off
    ↓
Persistent Database Commit (PostgreSQL / SQLite)
    ↓
Reopen & Track Status from Dashboard
```

---

## 5. Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: v18 or higher (v24 tested)
- **npm**: 9.0 or higher
- **Database (Neon PostgreSQL)**: [Neon Serverless PostgreSQL](https://neon.tech) online database (free tier supported) or local PostgreSQL. Embedded SQLite persistent fallback is active if offline.
- **Groq API Key**: (Optional; required for live LLM inference. Get a key at [https://console.groq.com/keys](https://console.groq.com/keys))

---

## 6. Neon PostgreSQL Setup Guide

QualiRoot AI includes specialized native optimizations for **Neon Serverless PostgreSQL** (`neon.tech`):
- **Automatic SSL Enforce**: Appends `?sslmode=require` automatically if omitted.
- **Dialect Scheme Correction**: Automatically translates legacy `postgres://` URLs to `postgresql://`.
- **Serverless Wake-Up Resilience**: Uses a 20-second connection timeout to accommodate cold starts when Neon compute points awaken from suspended mode.
- **Connection Pool Tuning**:
  - Direct connection strings: Configured with `pool_pre_ping=True` and `pool_recycle=300` to discard dropped serverless sockets.
  - Pooled connection strings (`-pooler` with pgBouncer): Configured with `NullPool` to prevent double-pooling latency.

### Step 1: Copy Connection String from Neon
1. Log into your [Neon Console](https://console.neon.tech).
2. Select your project and branch (e.g. `main`).
3. Under **Connection Details**, choose **PostgreSQL** or **Pooled connection**.
4. Copy the connection string, for example:
   ```text
   postgresql://neondb_owner:npg_xyz123@ep-cool-pond-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Configure `backend/.env`
Open `backend/.env` and paste your Neon connection string:
```ini
DATABASE_URL=postgresql://neondb_owner:npg_xyz123@ep-cool-pond-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
ALLOW_SQLITE_FALLBACK=true
```

### Step 3: Test Neon Connection
QualiRoot AI includes an interactive connection test tool:
```bash
cd qualiroot-ai/backend
python test_neon_connection.py
```
Or pass the URL directly:
```bash
python test_neon_connection.py "postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require"
```

---

## 7. Local Setup and Installation

### Step A: Clone & Backend Environment
```bash
cd qualiroot-ai/backend

# Create virtualenv (optional but recommended)
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Edit `backend/.env` to configure your credentials:
```ini
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/qualiroot_db
ALLOW_SQLITE_FALLBACK=true
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

### Step B: Start PostgreSQL (Docker or Local)
If using Docker:
```bash
cd qualiroot-ai
docker compose up -d
```
*Note: If PostgreSQL is not running, QualiRoot AI will automatically initialize and persist data into `backend/app/qualiroot.db` without crashing.*

### Step C: Start the Backend Server
```bash
cd qualiroot-ai/backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- FastAPI Swagger Documentation: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/health`

### Step D: Install & Start Frontend
In a new terminal window:
```bash
cd qualiroot-ai/frontend
npm install
npm run dev
```
- Open `http://localhost:5173` in your browser.

---

## 7. Running Backend Automated Tests

QualiRoot AI includes a comprehensive 17-test validation suite covering health, schema validation, PyMuPDF extraction, scanned document detection, prompt injection sanitization, investigation CRUD, review/approval workflow, and CAPA actions:

```bash
cd qualiroot-ai/backend
python run_tests.py
```

Expected output:
```
============================================================
QUALIROOT AI - BACKEND AUTOMATED TEST SUITE
============================================================
[PASS] test_health_endpoint
[PASS] test_api_health_endpoint
[PASS] test_extraction_schema_valid
[PASS] test_rca_and_fishbone_schema_validation
[PASS] test_capa_schema_validation
[PASS] test_pdf_extraction_success
[PASS] test_pdf_empty_error
[PASS] test_prompt_injection_sanitization
[PASS] test_ai_missing_key_behavior
[PASS] test_invalid_file_upload
[PASS] test_create_and_retrieve_investigation
[PASS] test_update_investigation
[PASS] test_list_and_filter_investigations
[PASS] test_dashboard_summary
[PASS] test_evidence_gap_management
[PASS] test_review_and_approval_workflow
[PASS] test_capa_crud_workflow
============================================================
RESULTS: 17 PASSED, 0 FAILED (TOTAL: 17)
============================================================
```

---

## 8. Demonstrating the Complete Workflow

Follow these steps for an interview demonstration:

1. **Dashboard Overview**:
   - Navigate to `http://localhost:5173`.
   - Observe summary KPI cards (Total Investigations, In Progress, Awaiting Review, Open CAPA Actions) computed from actual database records.

2. **Launch Investigation**:
   - Click **"Start Investigation"** in the top navigation or sidebar.
   - The split-pane workspace opens with editable form sections on the left and the AI Assistant panel on the right.

3. **Intake Source Material**:
   - In the right-hand panel, click the **"Load Fictional Sample"** button. This automatically populates the fictional residual solvent OOS incident report for Atorvastatin Calcium Trihydrate (Batch ATC-2026-B089, Conical Vacuum Dryer CVD-04).
   - Alternatively, upload a PDF or enter an email notification.

4. **Execute AI Extraction**:
   - Click **"Analyze with AI"**.
   - Watch the multi-stage LangGraph execution pipeline:
     1. *Reading source material & verifying format*
     2. *Extracting incident details & parameters*
     3. *Identifying evidence quotes & provenance*
     4. *Analysis complete — form auto-populated*
   - Observe the investigation form populate automatically with product name, batch number, equipment tag, observed residual solvent (5,840 ppm), expected limits, and containment actions.
   - Note the **Provenance Badges** (`Source Evidence` / `AI Suggested` / `User Edited`).

5. **Review Evidence Gaps**:
   - Inspect **Section D (Evidence Gap Analysis)**.
   - Review automatically flagged missing GMP records (e.g. SCADA continuous temperature & vacuum trend logs, sensor calibration certificates, central chiller utility records).
   - Update a gap's status from `Missing` to `Requested` or `Provided`.

6. **Root Cause Analysis (5 Whys & Fishbone)**:
   - Click **"Generate RCA"** in the top toolbar to run the LangGraph RCA workflow.
   - Switch to the **5 Whys Analysis** tab to inspect the disciplined causal chain leading to the condenser chilling deficit and premature cycle shutdown. Edit any answers.
   - Switch to the **Fishbone Diagram** tab to view causes mapped across the 6 cGMP branches (*Machine / Equipment*, *Method / Process*, *Man / Personnel*, *Material*, *Measurement*, *Environment*).
   - Click **"Confirm as Root Cause"** on the machine chilling cause to record an explicit human authorization.

7. **Generate CAPA Actions**:
   - Click **"Generate CAPA"** in the top toolbar.
   - Switch to the **CAPA Recommendations** tab to view classified actions:
     - **Corrective**: Quarantine evaluation and validated re-drying protocol.
     - **Preventive**: Maintenance overhaul of CVD-04 condenser chiller return loop and SCADA alarm interlock.
     - **Effectiveness Verification**: 60-day audit of next 5 consecutive batches for residual solvent levels <= 3,000 ppm.
   - Update action statuses (e.g., change from `Proposed` to `Approved` or `In Progress`).

8. **Submit & Approve Investigation**:
   - Click **"Save Changes"** to commit the investigation state to the database.
   - Click **"Submit for Review"** to mark the status as `Awaiting Review`.
   - Click **"Approve Investigation"** to open the human review modal, review the demonstration sign-off notice, check the authorization box, and confirm approval.
   - Notice the status update to `Approved` and the audit event logged.

9. **Reopen and Verify Persistence**:
   - Refresh the browser page or navigate back to **Overview**.
   - Observe the newly created investigation in the Recent Investigations table.
   - Click **"Open Workspace"** to confirm that all edited fields, 5 Whys steps, fishbone causes, evidence gaps, and CAPA actions are restored from persistent storage.

---

## 9. Environment Variables Reference

| Variable | Default Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/qualiroot_db` | PostgreSQL connection string |
| `ALLOW_SQLITE_FALLBACK` | `true` | Allows seamless fallback to embedded SQLite if PostgreSQL is unreachable |
| `GROQ_API_KEY` | `""` | Groq Cloud API key for live LLM inference |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Preferred Groq LLM model |
| `ENVIRONMENT` | `development` | Runtime environment mode |
| `MAX_UPLOAD_SIZE_MB` | `15` | Maximum upload size for PDF investigation reports |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed origins for cross-origin requests |

---

## 10. Known Limitations & Scope Boundaries

1. **Demonstration Sign-Off**: The approval workflow is designed for workflow demonstration and does not constitute a 21 CFR Part 11 compliant cryptographic electronic signature.
2. **OCR Requirement**: PyMuPDF extracts digital text from vector/searchable PDFs. Scanned image-only PDFs are detected and flagged with an advisory notice that OCR preprocessing is required.
3. **Module Scope**: In accordance with project instructions, QualiRoot AI focuses exclusively on Root Cause Analysis and CAPA tracking; standalone Change Control, Customer Complaints, and Deviation Management modules are intentionally out of scope.
