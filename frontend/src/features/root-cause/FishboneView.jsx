import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addCauseItem,
  updateCauseItem,
  removeCauseItem,
  setCauseStatus,
} from './rootCauseSlice';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Tag,
  GitBranch,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Machine / Equipment', label: 'Machine / Equipment', color: 'border-blue-400 text-blue-700 bg-blue-50' },
  { id: 'Method / Process', label: 'Method / Process', color: 'border-teal-400 text-teal-700 bg-teal-50' },
  { id: 'Man / Personnel', label: 'Man / Personnel', color: 'border-amber-400 text-amber-700 bg-amber-50' },
  { id: 'Material', label: 'Material', color: 'border-purple-400 text-purple-700 bg-purple-50' },
  { id: 'Measurement', label: 'Measurement', color: 'border-emerald-400 text-emerald-700 bg-emerald-50' },
  { id: 'Environment', label: 'Environment', color: 'border-slate-400 text-slate-700 bg-slate-50' },
];

export const FishboneView = () => {
  const dispatch = useDispatch();
  const { causes } = useSelector((state) => state.rootCause);
  const { current } = useSelector((state) => state.investigation);

  const [selectedCat, setSelectedCat] = useState('Machine / Equipment');
  const [newDesc, setNewDesc] = useState('');
  const [newWhy, setNewWhy] = useState('');

  const handleAddCause = () => {
    if (!newDesc.trim()) return;
    const newCause = {
      cause_id: `RC-${causes.length + 1 < 10 ? '0' : ''}${causes.length + 1}`,
      description: newDesc.trim(),
      category: selectedCat,
      why_plausible: newWhy.trim() || 'Identified during root cause analysis investigation',
      confidence_assessment: 'Moderate evidence support',
      status: 'Proposed by AI',
      is_confirmed_root_cause: false,
      supporting_evidence: [],
      evidence_gaps: [],
    };
    dispatch(addCauseItem(newCause));
    setNewDesc('');
    setNewWhy('');
  };

  const handleToggleConfirm = (cause_id, currentConfirmed) => {
    dispatch(
      setCauseStatus({
        cause_id,
        status: !currentConfirmed ? 'Confirmed by Reviewer' : 'Under Investigation',
        is_confirmed: !currentConfirmed,
      })
    );
  };

  const getCausesForCategory = (catName) => {
    return causes.filter((c) => c.category === catName);
  };

  return (
    <div className="space-y-6">
      {/* Overview and Add Cause Form */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-teal-600" />
            Ishikawa Fishbone Diagram (6 cGMP Categories)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify and evaluate potential causes. Confirmed root cause must be an authorized human reviewer decision.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Cause description..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[200px]"
          />

          <Button variant="primary" size="sm" icon={Plus} onClick={handleAddCause}>
            Add Cause
          </Button>
        </div>
      </div>

      {/* Visual Fishbone Spine & Spines Grid */}
      <div className="relative bg-slate-900 text-white p-6 rounded-2xl shadow-sm overflow-hidden">
        {/* Spine Backbone Indicator */}
        <div className="hidden lg:flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
            CONTRIBUTING CAUSAL CATEGORIES
          </div>
          <div className="flex items-center gap-3">
            <div className="h-0.5 w-48 bg-gradient-to-r from-slate-700 to-teal-400 rounded-full" />
            <div className="bg-teal-500 text-slate-950 font-bold px-3 py-1 rounded text-xs tracking-tight shadow">
              EFFECT: {current.api_product || 'API Batch'} Deviation
            </div>
          </div>
        </div>

        {/* 6 Category Ribs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => {
            const catCauses = getCausesForCategory(cat.id);
            return (
              <div
                key={cat.id}
                className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                {/* Rib Header */}
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                  <span className="text-xs font-bold text-teal-300 tracking-wide">
                    {cat.label}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                    {catCauses.length} causes
                  </span>
                </div>

                {/* Causes inside Rib */}
                <div className="space-y-2 flex-1 min-h-[80px]">
                  {catCauses.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic py-4 text-center">
                      No factors currently assigned
                    </div>
                  ) : (
                    catCauses.map((cause) => (
                      <div
                        key={cause.cause_id}
                        className={`p-3 rounded-lg border text-xs transition-all ${
                          cause.is_confirmed_root_cause
                            ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-100 shadow-sm'
                            : 'bg-slate-900/90 border-slate-700 text-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono font-bold text-[11px] text-teal-400">
                            {cause.cause_id}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              cause.status === 'Confirmed by Reviewer'
                                ? 'bg-emerald-500 text-slate-950 font-bold'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {cause.status}
                          </span>
                        </div>

                        <p className="mt-1 font-medium text-xs leading-relaxed text-white">
                          {cause.description}
                        </p>

                        {cause.why_plausible && (
                          <p className="text-[11px] text-slate-300 mt-1 italic">
                            {cause.why_plausible}
                          </p>
                        )}

                        {/* Controls */}
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800 text-[11px]">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleConfirm(
                                cause.cause_id,
                                cause.is_confirmed_root_cause
                              )
                            }
                            className={`flex items-center gap-1 font-semibold transition-colors ${
                              cause.is_confirmed_root_cause
                                ? 'text-emerald-400 hover:text-emerald-300'
                                : 'text-slate-400 hover:text-teal-300'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {cause.is_confirmed_root_cause
                              ? 'Confirmed Root Cause'
                              : 'Confirm as Root Cause'}
                          </button>

                          <button
                            type="button"
                            onClick={() => dispatch(removeCauseItem(cause.cause_id))}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete this cause"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
