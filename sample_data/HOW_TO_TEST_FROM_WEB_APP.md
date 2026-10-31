# QualiRoot AI - Web Application Testing Guide

Welcome to the **QualiRoot AI** testing suite. This directory contains realistic, industry-standard Active Pharmaceutical Ingredient (API) manufacturing deviation records designed for end-to-end testing directly from your web browser.

---

## 1. Quick Start: Launching Backend & Frontend

To test the application in your browser, open two terminal windows (or PowerShell tabs):

### Terminal 1: Backend API (FastAPI)
```powershell
cd C:\Users\LENOVO\qualiroot-ai\backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Expected output: `Application startup complete. Uvicorn running on http://127.0.0.1:8000`*
*Database: Automatically connects to your Neon Serverless PostgreSQL database.*

### Terminal 2: Frontend Web App (React + Vite)
```powershell
cd C:\Users\LENOVO\qualiroot-ai\frontend
npm run dev
```
*Expected output: `Local: http://localhost:5173/`*

Now open your web browser and navigate to:
👉 **`http://localhost:5173`**

---

## 2. Catalog of Test Sample Datasets

All sample files are located in `C:\Users\LENOVO\qualiroot-ai\sample_data\`:

| Sample File | API Product / Stage | Input Mode | Key Deviation Tested |
| :--- | :--- | :--- | :--- |
| **`01_Text_Incident_Residual_Solvent_OOS.txt`** | Atorvastatin Calcium (Drying CVD-04) | **Paste Text** | OOS Residual Acetone (5,840 ppm vs <= 5,000 ppm) due to chiller trip & vacuum pump VP-02 seal leak |
| **`02_Email_Report_Crystallization_Polymorph_Shift.txt`** | Metformin HCl (Crystallization RX-02) | **Email Mode** | 61% yield drop and 9.4% Form II polymorph shift due to TC-204 thermal shock & excessive agitation |
| **`03_Text_Incident_Bioburden_Endotoxin_Exceedance.txt`** | Losartan Potassium (Centrifuge CF-01) | **Paste Text** | Bacterial Endotoxin failure (0.38 EU/mg) & Ralstonia pickettii from 4.8D dead leg valve |
| **`04_Text_Incident_Degradation_Impurity_Spike.txt`** | Omeprazole Sodium (Lyophilizer LY-02) | **Paste Text** | Impurity D spike (0.48%) from vacuum break & overdue O2 sensor calibration |
| **`05_PDF_Deviation_Report_OOS_Residual_Solvent.pdf`** | Atorvastatin Calcium (Full PDF Report) | **Upload PDF** | Real digital PDF with formal tables; PyMuPDF extracts text cleanly on backend |
| **`06_PDF_Scanned_Logsheet_Simulation_OCR_Test.pdf`** | Batch ATC-89 (Handwritten Logsheet) | **Upload PDF** | **OCR Test Case:** Bitmap-only scanned PDF with zero digital text. Tests system OCR warning |

---

## 3. Step-by-Step Testing Scenarios in the Web App

### Scenario A: Testing Text Extraction & Auto-Population (Sample 01)
1. In the Web App, click **"Start Investigation"** in the top navigation or on the Dashboard.
2. In the right-hand **AI Assistant** panel, make sure the **"Paste Text"** tab is active.
3. Open `sample_data/01_Text_Incident_Residual_Solvent_OOS.txt`, copy its full content, and paste it into the incident textarea.
   *(Alternatively, click the quick helper **"Load Fictional API Incident Sample"** button).*
4. Click the prominent teal button: **"Analyze with AI"**.
5. **Watch the live LangGraph extraction state progress:**
   - *Reading source material* ➔ *Extracting incident details* ➔ *Identifying evidence gaps* ➔ *Analysis complete*.
6. **Verify Form Auto-Population:**
   - **Investigation Title:** Populated with clear deviation title.
   - **API Product:** `Atorvastatin Calcium Trihydrate`
   - **Batch Number:** `ATC-2026-B089`
   - **Manufacturing Stage:** `Step 07 - Rotary Vacuum Cone Drying`
   - **Equipment ID:** `CVD-04`
   - **Observed Condition:** `5,840 ppm (Residual Acetone OOS)`
   - **Expected Condition:** `<= 5,000 ppm`
7. **Inspect cGMP Field Provenance:**
   - Notice the teal tag next to each field: `AI Extracted`.
   - Now click inside the **"Immediate Action Taken"** field and edit the text.
   - Notice the provenance badge immediately updates to amber: `Human Edited` with a live timestamp!

---

### Scenario B: Testing Email Ingestion Mode (Sample 02)
1. Click **"Start Investigation"**.
2. In the AI Assistant panel, click the **"Email Report"** tab.
3. Open `sample_data/02_Email_Report_Crystallization_Polymorph_Shift.txt` and fill in:
   - **Subject:** `URGENT: Yield Drop (61% vs 84%) and Form II Polymorphic Impurity in Metformin HCl Lot MET-2026-0412`
   - **Sender / Role:** `Dr. Divya Gupta, Senior Lead Chemist <d.gupta@sunshinepharma.com>`
   - **Email Content:** Paste the email body.
4. Click **"Analyze with AI"**.
5. Verify the AI extracts:
   - API Product: `Metformin Hydrochloride`
   - Batch Number: `MET-2026-0412`
   - Stage: `Reaction & Crystallization Tank RX-02`
   - Discrepancy: `Yield drop to 61.2% and 9.4% Form II polymorph shift`

---

### Scenario C: Testing PDF Document Upload (Sample 05)
1. Click **"Start Investigation"**.
2. In the AI Assistant panel, select the **"Upload PDF"** tab.
3. Click the upload dropzone or drag and drop:
   `sample_data/05_PDF_Deviation_Report_OOS_Residual_Solvent.pdf`
4. Notice:
   - The file size and name are displayed.
   - PyMuPDF backend extracts the text immediately and shows an expandable **Source Preview**.
5. Click **"Analyze with AI"**.
6. The entire deviation report is parsed by the AI and auto-populates the investigation form.

---

### Scenario D: Testing Scanned Image PDF & OCR Warning (Sample 06)
1. Under **"Upload PDF"**, upload:
   `sample_data/06_PDF_Scanned_Logsheet_Simulation_OCR_Test.pdf`
2. **Observe the cGMP Safety Guardrail:**
   - The system inspects the PDF text stream, identifies zero digital text characters, and displays an informative warning banner:
   - *"OCR Required: The uploaded PDF appears to be scanned or contains only images without an extractable text stream. Please provide digital text or run OCR."*
   - This proves the application refuses to pretend extraction succeeded on unreadable scans.

---

### Scenario E: Testing Evidence Gaps & Follow-Up Lifecycle
1. Scroll down to the **"Evidence Review & Gaps"** section on the investigation workspace.
2. Observe the AI-identified evidence gaps (e.g., missing SCADA trends, overdue maintenance logs).
3. Click the status dropdown for any gap:
   - Change from `Missing` ➔ `Requested` ➔ `Provided` ➔ `Reviewed`.
4. Add custom notes to the gap record.

---

### Scenario F: Testing Interactive 5 Whys Analysis
1. In the **Root Cause Analysis** section, view the **5 Whys Analysis** card.
2. Click **"Generate 5 Whys with AI"** or review the extracted chain:
   - *Why 1:* High residual acetone.
   - *Why 2:* Drying cycle stopped prematurely after chiller pressure drop.
   - *Why 3:* Conical vacuum dryer operated at 85 mbar instead of <= 20 mbar.
   - *Why 4:* Vacuum pump VP-02 seal degraded and condenser vent fouled.
   - *Why 5 (Root Cause):* Overdue preventive maintenance and missing secondary solvent verification check.
3. You can edit any Why question or answer directly, or click **"+ Add Why Step"**.

---

### Scenario G: Testing Ishikawa (Fishbone) 6-M Diagram
1. Switch to the **"Ishikawa (Fishbone) Diagram"** tab.
2. Review causes categorized across the 6 pharmaceutical branches:
   - **Machine:** Vacuum pump VP-02 seal leakage, condenser vent clogging.
   - **Method:** SOP-PRD-402 allowed discharge based on LOD alone without GC-HS solvent check.
   - **Measurement:** Jacket temperature sensor TT-102 overdue calibration.
   - **Material:** Statin wet cake particle agglomeration.
   - **Milieu (Environment):** Cooling tower CH-01 utility disruption.
   - **Manpower:** Shift handover gap between 02:00 and 05:00.
3. **Confirm as Root Cause:**
   - Click the **"Confirm as Root Cause"** toggle on any cause item.
   - In accordance with ICH Q9 / Q10 cGMP principles, AI suggestions start as `Hypothesis`; clicking confirms it as a verified root cause.

---

### Scenario H: Testing CAPA Actions & Effectiveness Checks
1. In the **"Corrective & Preventive Actions (CAPA)"** section:
   - Review AI-recommended actions categorized into **Corrective** and **Preventive**.
   - Notice the **Effectiveness Check Plan** (e.g., "Verify residual solvent in 3 consecutive batches post-repair").
2. Set action owner and target completion date.
3. Click **"+ Add Custom CAPA"** to append additional regulatory commitments.

---

### Scenario I: Saving to Neon Database & Verifying Persistence
1. Click **"Save Investigation"** (or use the Save button in the sticky action bar).
2. The investigation is committed to your **Neon PostgreSQL cloud database**.
3. **Verify Persistence:**
   - Press **F5** in your browser to hard refresh.
   - Observe that the investigation ID, all form fields, provenance tags, 5 Whys, fishbone causes, and CAPAs load seamlessly from Neon.
4. Click **"Investigations"** in the sidebar:
   - Your investigation appears in the searchable table.
   - Click **"View / Edit"** to reopen it at any time.
5. Click **"Overview"** (Dashboard):
   - Real-time counters (Total investigations, In Progress, Open CAPA actions) reflect the live Neon database records.
6. Click **"CAPA Actions"**:
   - The global CAPA tracker displays all actions across your manufacturing facility.

---

### Scenario J: System Diagnostics & Settings
1. Click **"Settings"** in the left sidebar.
2. Verify:
   - **Database Status:** Connected (shows Neon PostgreSQL endpoint).
   - **AI Model Status:** Connected (shows active Groq model `openai/gpt-oss-120b`).
   - **API Latency & Connectivity:** Green indicators.
