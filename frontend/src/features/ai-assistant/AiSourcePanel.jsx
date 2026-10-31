import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FileText,
  Upload,
  Mail,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileSearch,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  setInputMode,
  extractFromTextThunk,
  extractFromEmailThunk,
  uploadPdfThunk,
  resetAiState,
} from './aiSlice';
import { Button } from '../../components/common/Button';

// Fictional demonstration text from sample data
const DEMO_SAMPLE_TEXT = `*** FICTIONAL DEMONSTRATION DATA - FOR QUALIROOT AI TESTING ONLY ***
NON-CONFORMANCE / MANUFACTURING INCIDENT REPORT
Report ID: INC-2026-0842
Facility: Apex ChemPharma Manufacturing Facility 2, Sterile API Block B, Room 204
Date of Occurrence: 2026-10-24
Reporting Lead: Dr. Elena Vance (Senior Production Shift Supervisor)

1. INCIDENT OVERVIEW:
Product / API: Atorvastatin Calcium Trihydrate (USP/EP Grade)
Batch Number: ATC-2026-B089
Process Stage: Stage 5 - Final Vacuum Drying & Delumping
Equipment: Conical Vacuum Dryer CVD-04 (Asset Tag: EQ-CVD-04-B)
Investigation Owner: Quality Assurance Operations - Investigation Unit

2. PROBLEM STATEMENT / WHAT HAPPENED:
During routine release testing for batch ATC-2026-B089, QC Analytical Laboratory reported an Out-of-Specification (OOS) result for residual solvent (Acetone). 
- Observed Laboratory Result: 5,840 ppm (0.584% w/w) via Headspace GC-FID (Sample ID: QC-2026-S1042).
- Acceptance Criteria / Specification Limit: NMT 5,000 ppm (0.50% w/w) in accordance with ICH Q3C (R8) Class 3 Solvent limits and Apex Finished API Specification SP-ATC-003 Rev 4.
- Expected Condition: Final dried powder with residual acetone content strictly <= 5,000 ppm, with historical process mean running at 2,400 ± 350 ppm.

3. MANUFACTURING PROCESS OBSERVATIONS:
- According to Batch Manufacturing Record (BMR) Section 8.4, the final drying cycle on Conical Vacuum Dryer CVD-04 was initiated at 06:15 on 2026-10-23.
- Target drying temperature: 50°C ± 2°C at a vacuum depth of <= 15 mbar.
- Reported Drying Duration in shift log: 14.5 hours. However, standard validated operating procedure SOP-PRD-502 specifies a minimum drying duration of 18.0 hours under vacuum prior to sampling.
- Operator shift handover log noted: "Operator shifted drying program to cooling cycle early at 20:45 due to an intermittent high-condenser temperature warning chime on CVD-04 control panel."
- Nitrogen sweep purge pressure indicator read 0.2 bar (target: 0.5 ± 0.1 bar).

4. IMMEDIATE CONTAINMENT ACTIONS TAKEN:
- Quarantine status immediately applied in ERP/MES to Batch ATC-2026-B089.
- Yellow quarantine tags physically attached to all six stainless steel powder transport drums (Drums 1 through 6, total gross weight: 312.4 kg) located in API Staging Area Bay 3.
- Vacuum dryer CVD-04 tagged out of service pending QA and Engineering evaluation.
- Analytical OOS confirmed by repeat injection by secondary analyst per OOS SOP-QC-019 (Repeat result: 5,815 ppm). Laboratory error ruled out.

5. PROCESS PARAMETERS RECORDED:
- Dryer Jacket Temperature: 49.8°C (nominal)
- Vacuum Level: 14.2 mbar (nominal)
- Chilled Water Return Temp to Condenser: 18.4°C (alarm threshold > 15°C)
- Condenser pressure: Normal
- Initial wet cake weight: 420.0 kg

6. POTENTIAL QUALITY & DOWNSTREAM IMPACT:
- Batch ATC-2026-B089 cannot be released into commercial finished dosage supply in its current state.
- Residual acetone exceeding ICH threshold represents a direct non-compliance with drug substance filing specifications.
- Risk of degradation or altered polymorphic form if prolonged thermal stress is improperly applied without validated rework protocol.

7. DOCUMENTS AND RECORDS REFERENCED:
- BMR BMR-ATC-B089 (Sections 8.1 - 8.5)
- QC Analytical Test Certificate CoA-2026-9921
- SOP-PRD-502: Operation and Drying Cycle of Conical Vacuum Dryers
- Maintenance Log for CVD-04 condenser refrigeration unit`;

export const AiSourcePanel = ({ investigationId }) => {
  const dispatch = useDispatch();
  const { inputMode, isProcessing, processingStep, error, extractedData, sourcePreview, pdfMeta } =
    useSelector((state) => state.ai);

  const [pastedText, setPastedText] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailSender, setEmailSender] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [copiedDemo, setCopiedDemo] = useState(false);

  const handleLoadDemo = () => {
    dispatch(setInputMode('text'));
    setPastedText(DEMO_SAMPLE_TEXT);
    setCopiedDemo(true);
    setTimeout(() => setCopiedDemo(false), 2000);
  };

  const handleAnalyze = () => {
    if (inputMode === 'text') {
      if (!pastedText.trim()) return;
      dispatch(
        extractFromTextThunk({
          text: pastedText,
          sourceType: 'pasted_text',
          investigationId,
        })
      );
    } else if (inputMode === 'email') {
      if (!emailContent.trim()) return;
      dispatch(
        extractFromEmailThunk({
          subject: emailSubject || 'Manufacturing Deviation Notice',
          sender: emailSender || 'Shift Supervisor',
          content: emailContent,
          investigation_id: investigationId,
        })
      );
    } else if (inputMode === 'pdf') {
      if (!selectedFile) return;
      dispatch(uploadPdfThunk({ file: selectedFile, investigationId }));
    }
  };

  const stepsList = [
    { key: 'reading_source', label: 'Reading source material & verifying format' },
    { key: 'extracting_details', label: 'Extracting incident details & parameters' },
    { key: 'identifying_evidence', label: 'Identifying evidence quotes & provenance' },
    { key: 'complete', label: 'Analysis complete - form auto-populated' },
  ];

  const getStepStatus = (stepKey) => {
    if (processingStep === 'error') return 'error';
    if (processingStep === 'complete') return 'done';
    if (stepKey === processingStep) return 'active';
    const order = ['reading_source', 'extracting_details', 'identifying_evidence', 'complete'];
    const curIdx = order.indexOf(processingStep);
    const stepIdx = order.indexOf(stepKey);
    if (curIdx > stepIdx) return 'done';
    return 'pending';
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">AI Investigation Assistant</h3>
            <p className="text-[11px] text-slate-300">LangGraph Powered Extraction Engine</p>
          </div>
        </div>

        <button
          onClick={handleLoadDemo}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-teal-300 px-2.5 py-1 rounded-md font-medium border border-teal-500/30 flex items-center gap-1.5 transition-colors"
          title="Load pre-built fictional residual solvent deviation report"
        >
          {copiedDemo ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
          Load Fictional Sample
        </button>
      </div>

      {/* Input Mode Selector */}
      <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-medium">
        <button
          onClick={() => dispatch(setInputMode('text'))}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors ${
            inputMode === 'text'
              ? 'bg-white text-teal-700 border-b-2 border-teal-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Paste Text
        </button>
        <button
          onClick={() => dispatch(setInputMode('pdf'))}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors ${
            inputMode === 'pdf'
              ? 'bg-white text-teal-700 border-b-2 border-teal-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          Upload PDF
        </button>
        <button
          onClick={() => dispatch(setInputMode('email'))}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors ${
            inputMode === 'email'
              ? 'bg-white text-teal-700 border-b-2 border-teal-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Email Report
        </button>
      </div>

      {/* Intake Body */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* TEXT MODE */}
        {inputMode === 'text' && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex justify-between">
              <span>Incident or Deviation Report Text</span>
              <span className="text-slate-400 font-normal">
                {pastedText.length} characters
              </span>
            </label>
            <textarea
              rows={10}
              placeholder="Paste incident narrative, BMR shift handover notes, QC OOS investigation memo..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-y"
            />
          </div>
        )}

        {/* PDF MODE */}
        {inputMode === 'pdf' && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-700">Upload Deviation PDF</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-teal-500 transition-colors bg-slate-50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <input
                type="file"
                accept=".pdf"
                id="pdf-upload-input"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="hidden"
              />
              <label
                htmlFor="pdf-upload-input"
                className="cursor-pointer text-xs font-semibold text-teal-700 hover:text-teal-800 block"
              >
                {selectedFile ? selectedFile.name : 'Click to select a PDF file'}
              </label>
              <p className="text-[11px] text-slate-400 mt-1">
                PyMuPDF backend text extraction. Max 15MB.
              </p>
            </div>

            {pdfMeta && (
              <div className="p-2.5 bg-slate-100 rounded-lg text-xs font-mono space-y-0.5 text-slate-700">
                <div className="font-semibold text-slate-900">{pdfMeta.filename}</div>
                <div>Pages: {pdfMeta.page_count} | Characters: {pdfMeta.char_count}</div>
              </div>
            )}
          </div>
        )}

        {/* EMAIL MODE */}
        {inputMode === 'email' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Subject</label>
              <input
                type="text"
                placeholder="e.g. URGENT: Deviation Notification - Batch ATC-2026-B089"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Sender / Reporting Role</label>
              <input
                type="text"
                placeholder="e.g. Elena Vance (Senior Production Shift Supervisor)"
                value={emailSender}
                onChange={(e) => setEmailSender(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Email Body</label>
              <textarea
                rows={6}
                placeholder="Paste the email notification text here..."
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div>
          <Button
            variant="primary"
            size="md"
            icon={Sparkles}
            loading={isProcessing}
            onClick={handleAnalyze}
            className="w-full shadow-sm py-2.5"
            disabled={
              isProcessing ||
              (inputMode === 'text' && !pastedText.trim()) ||
              (inputMode === 'email' && !emailContent.trim()) ||
              (inputMode === 'pdf' && !selectedFile)
            }
          >
            {isProcessing ? 'Analyzing with AI...' : 'Analyze with AI'}
          </Button>
        </div>

        {/* Real Processing Pipeline Progress */}
        {isProcessing && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              LangGraph Execution Pipeline
            </div>
            {stepsList.map((st) => {
              const status = getStepStatus(st.key);
              return (
                <div key={st.key} className="flex items-center gap-2 text-xs">
                  {status === 'active' && <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin" />}
                  {status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  {status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                  {status === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                  <span
                    className={
                      status === 'active'
                        ? 'font-semibold text-teal-800'
                        : status === 'done'
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Processing Failed</p>
                <p className="mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleAnalyze} className="text-xs">
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry Extraction
            </Button>
          </div>
        )}

        {/* Extracted Evidence Snippets */}
        {extractedData?.source_evidence && extractedData.source_evidence.length > 0 && (
          <div className="border-t border-slate-200 pt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">Extracted Evidence Quotes</span>
              <span className="text-[11px] text-teal-700 font-medium">
                {extractedData.source_evidence.length} snippets identified
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {extractedData.source_evidence.map((snip, idx) => (
                <div key={idx} className="p-2 bg-slate-50 border border-slate-100 rounded text-xs">
                  <div className="font-mono text-[11px] text-slate-800 italic">
                    "{snip.quote}"
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>{snip.context}</span>
                    <span className="text-teal-700 font-medium">{snip.relevance}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
