import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchInvestigationById,
  saveInvestigationChanges,
  createNewInvestigation,
  resetCurrentInvestigation,
  saveReviewDecisionThunk,
} from '../features/investigation/investigationSlice';
import { generateRcaThunk, setFiveWhysData, setCausesData } from '../features/root-cause/rootCauseSlice';
import { generateCapaThunk, setInvestigationCapas } from '../features/capa/capaSlice';
import { RcaForm } from '../features/investigation/RcaForm';
import { AiSourcePanel } from '../features/ai-assistant/AiSourcePanel';
import { FiveWhysView } from '../features/root-cause/FiveWhysView';
import { FishboneView } from '../features/root-cause/FishboneView';
import { CapaWorkspace } from '../features/capa/CapaWorkspace';
import { ApprovalModal } from '../features/investigation/ApprovalModal';
import { Button } from '../components/common/Button';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import {
  Save,
  CheckCircle,
  FileText,
  GitBranch,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  History,
  Layers,
  Send,
  Loader2,
} from 'lucide-react';

export const InvestigationWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { current, saving, hasUnsavedChanges } = useSelector((state) => state.investigation);
  const { fiveWhys, causes, loading: rcaLoading } = useSelector((state) => state.rootCause);
  const { actions: capaActions, generating: capaLoading } = useSelector((state) => state.capa);

  const [activeTab, setActiveTab] = useState('form'); // 'form' | '5whys' | 'fishbone' | 'capa' | 'events'
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(true);

  const isNew = !id || id === 'new';

  useEffect(() => {
    if (!isNew) {
      dispatch(fetchInvestigationById(id))
        .unwrap()
        .then((data) => {
          if (data.five_whys) dispatch(setFiveWhysData(data.five_whys));
          if (data.root_causes) dispatch(setCausesData(data.root_causes));
          if (data.capa_actions) dispatch(setInvestigationCapas(data.capa_actions));
        })
        .catch((err) => console.error(err));
    } else {
      dispatch(resetCurrentInvestigation());
    }
  }, [id, isNew, dispatch]);

  const hasIncidentData = Boolean(
    (current.title && current.title.trim() !== '' && current.title !== 'Untitled Investigation') ||
    (current.problem_statement && current.problem_statement.trim() !== '') ||
    (current.observed_condition && current.observed_condition.trim() !== '') ||
    (current.api_product && current.api_product.trim() !== '')
  );

  const handleSaveDraft = async () => {
    if (isNew) {
      const created = await dispatch(createNewInvestigation(current)).unwrap();
      navigate(`/investigations/${created.id}`, { replace: true });
    } else {
      await dispatch(saveInvestigationChanges({ id: current.id, data: current })).unwrap();
    }
  };

  const handleGenerateRca = async () => {
    if (!hasIncidentData) {
      alert('Please provide incident details first (paste text, upload a PDF deviation report, or fill in the intake form) before generating a Root Cause Analysis.');
      return;
    }
    if (!current.id) {
      // Save investigation first if new
      const created = await dispatch(createNewInvestigation(current)).unwrap();
      navigate(`/investigations/${created.id}`, { replace: true });
      await dispatch(generateRcaThunk(created.id)).unwrap();
      setActiveTab('5whys');
    } else {
      await dispatch(saveInvestigationChanges({ id: current.id, data: current })).unwrap();
      await dispatch(generateRcaThunk(current.id)).unwrap();
      setActiveTab('5whys');
    }
  };

  const handleGenerateCapa = async () => {
    if (!hasIncidentData) {
      alert('Please provide incident details first before generating CAPA actions.');
      return;
    }
    if (!current.id) {
      const created = await dispatch(createNewInvestigation(current)).unwrap();
      navigate(`/investigations/${created.id}`, { replace: true });
      await dispatch(generateCapaThunk(created.id)).unwrap();
      setActiveTab('capa');
    } else {
      await dispatch(saveInvestigationChanges({ id: current.id, data: current })).unwrap();
      await dispatch(generateCapaThunk(current.id)).unwrap();
      setActiveTab('capa');
    }
  };

  const handleMarkAwaitingReview = async () => {
    if (!current.id) return;
    await dispatch(
      saveReviewDecisionThunk({
        id: current.id,
        data: {
          reviewer_decision: 'Awaiting Review',
          reviewer_notes: 'Investigation packaged by lead investigator for final QA signoff.',
        },
      })
    ).unwrap();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Top Workspace Action Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/investigations')}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            title="Return to directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-800">
                {current.id || 'NEW INVESTIGATION'}
              </span>
              <SeverityBadge severity={current.severity} />
              <StatusBadge status={current.status} />
              {current.is_approved && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Authorized by {current.approved_by}
                </span>
              )}
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5 truncate max-w-lg">
              {current.title || 'Untitled Investigation'}
            </h2>
          </div>
        </div>

        {/* Global Action CTAs */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Save}
            loading={saving}
            onClick={handleSaveDraft}
          >
            {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
          </Button>

          <Button
            variant="subtle"
            size="sm"
            icon={Sparkles}
            loading={rcaLoading}
            disabled={!hasIncidentData || rcaLoading}
            onClick={handleGenerateRca}
            title={!hasIncidentData ? "Provide incident text or document first" : "Generate AI RCA"}
            className="text-teal-800 bg-teal-50 hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate RCA
          </Button>

          <Button
            variant="subtle"
            size="sm"
            icon={Layers}
            loading={capaLoading}
            disabled={!hasIncidentData || capaLoading}
            onClick={handleGenerateCapa}
            title={!hasIncidentData ? "Provide incident text or document first" : "Generate AI CAPA"}
            className="text-blue-800 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate CAPA
          </Button>

          {current.status !== 'Approved' && (
            <Button
              variant="outline"
              size="sm"
              icon={Send}
              onClick={handleMarkAwaitingReview}
              className="text-amber-800 border-amber-200 bg-amber-50 hover:bg-amber-100"
            >
              Submit for Review
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            icon={ShieldCheck}
            disabled={!current.id}
            onClick={() => setShowApprovalModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {current.is_approved ? 'Re-authorize' : 'Approve Investigation'}
          </Button>

          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors ${
              showAiPanel
                ? 'bg-slate-900 text-teal-300 border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>AI Intake Panel</span>
          </button>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 flex items-center gap-4 text-xs font-semibold shrink-0">
        <button
          onClick={() => setActiveTab('form')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'form'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Investigation Details & Intake Form</span>
        </button>

        <button
          onClick={() => setActiveTab('5whys')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === '5whys'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>5 Whys Analysis</span>
          {fiveWhys.why_1 && (
            <span className="w-2 h-2 rounded-full bg-teal-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('fishbone')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'fishbone'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Fishbone Diagram</span>
          {causes.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
              {causes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('capa')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'capa'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>CAPA Recommendations</span>
          {capaActions.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800">
              {capaActions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'events'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* Main Split-Pane Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT / MAIN WORKSPACE AREA */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {activeTab === 'form' && <RcaForm />}
            {activeTab === '5whys' && <FiveWhysView />}
            {activeTab === 'fishbone' && <FishboneView />}
            {activeTab === 'capa' && <CapaWorkspace />}
            {activeTab === 'events' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-teal-600" />
                  Investigation Audit Trail & Change Events
                </h4>
                {current.events && current.events.length > 0 ? (
                  <div className="space-y-3">
                    {current.events.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-start justify-between gap-4"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">{evt.event_type}</div>
                          <div className="text-slate-600 mt-0.5">{evt.details}</div>
                        </div>
                        <div className="text-right shrink-0 text-[11px] text-slate-400 font-mono">
                          <div>{evt.actor}</div>
                          <div>{new Date(evt.timestamp).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No events logged yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT AREA: AI INVESTIGATION ASSISTANT */}
        {showAiPanel && (
          <div className="w-96 border-l border-slate-200 bg-white flex flex-col shrink-0 shadow-lg z-10">
            <AiSourcePanel investigationId={current.id} />
          </div>
        )}
      </div>

      {/* Human Approval Modal */}
      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        investigationId={current.id}
      />
    </div>
  );
};
