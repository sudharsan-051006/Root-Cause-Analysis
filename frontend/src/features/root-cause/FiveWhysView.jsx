import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateFiveWhysField } from './rootCauseSlice';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  HelpCircle,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export const FiveWhysView = () => {
  const dispatch = useDispatch();
  const { fiveWhys, disclaimer } = useSelector((state) => state.rootCause);

  const handleFieldChange = (field, value) => {
    dispatch(updateFiveWhysField({ field, value }));
  };

  const whySteps = [
    { key: 'why_1', num: 1, label: 'Why 1 — Direct Observed Cause' },
    { key: 'why_2', num: 2, label: 'Why 2 — Immediate Precondition' },
    { key: 'why_3', num: 3, label: 'Why 3 — Underlying Process Driver' },
    { key: 'why_4', num: 4, label: 'Why 4 — Systemic or Mechanical Factor' },
    { key: 'why_5', num: 5, label: 'Why 5 — Organizational or Design Root Cause' },
  ];

  return (
    <div className="space-y-6">
      {/* Pharma Disclaimer */}
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Investigation Principle:</strong> AI-generated causal chains are hypotheses. If evidence is insufficient for Why 4 or Why 5, mark them as requiring investigation rather than forcing an unverified conclusion.
        </p>
      </div>

      {!fiveWhys.why_1 && (
        <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl flex items-center justify-between gap-4 text-xs text-teal-900">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              <strong>Empty Causal Chain:</strong> To generate AI 5 Whys, provide incident text or upload a deviation PDF in the AI Assistant, or type your causal analysis manually below.
            </span>
          </div>
        </div>
      )}

      {/* Problem Statement Header */}
      <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xs">
        <div className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider mb-1">
          Deviation Problem Statement
        </div>
        <input
          type="text"
          value={fiveWhys.problem_statement || ''}
          onChange={(e) => handleFieldChange('problem_statement', e.target.value)}
          placeholder="State the problem being investigated..."
          className="w-full bg-slate-800 border border-slate-700 text-white text-sm font-medium p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>

      {/* 5 Whys Chain */}
      <div className="space-y-3 relative">
        {whySteps.map((step, idx) => (
          <div key={step.key} className="relative">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-teal-500/50 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs">
                    {step.num}
                  </span>
                  {step.label}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Editable</span>
              </div>
              <textarea
                rows={2}
                value={fiveWhys[step.key] || ''}
                onChange={(e) => handleFieldChange(step.key, e.target.value)}
                placeholder={`Why did this happen? (Or 'Requires investigation: [Missing records]')`}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-y"
              />
            </div>
            {idx < whySteps.length - 1 && (
              <div className="flex justify-center my-1">
                <ArrowDown className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hypothesized Primary Root Cause Box */}
      <Card
        title="Proposed Root Cause Hypothesis"
        subtitle="Synthesized conclusion derived from verified causal chain"
      >
        <div className="space-y-4">
          <textarea
            rows={3}
            value={fiveWhys.proposed_root_cause || ''}
            onChange={(e) => handleFieldChange('proposed_root_cause', e.target.value)}
            placeholder="State the proposed root cause hypothesis..."
            className="w-full text-xs font-semibold p-3 bg-teal-50/50 border border-teal-200 text-teal-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reviewer Evaluation Decision
              </label>
              <select
                value={fiveWhys.reviewer_decision || 'Under Investigation'}
                onChange={(e) => handleFieldChange('reviewer_decision', e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Under Investigation">Under Investigation</option>
                <option value="Accepted by Reviewer">Accepted by Reviewer</option>
                <option value="Rejected by Reviewer">Rejected by Reviewer</option>
                <option value="Revised by Reviewer">Revised by Reviewer</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reviewer Justification Notes
              </label>
              <input
                type="text"
                value={fiveWhys.reviewer_notes || ''}
                onChange={(e) => handleFieldChange('reviewer_notes', e.target.value)}
                placeholder="Rationale for decision based on evidence..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
