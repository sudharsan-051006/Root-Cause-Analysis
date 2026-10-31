import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateFormField,
  updateEvidenceGapStatus,
} from './investigationSlice';
import {
  ProvenanceBadge,
  SeverityBadge,
  StatusBadge,
} from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import {
  FileText,
  AlertCircle,
  HelpCircle,
  Plus,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const RcaForm = () => {
  const dispatch = useDispatch();
  const { current } = useSelector((state) => state.investigation);

  const [newContainment, setNewContainment] = useState('');

  const handleChange = (field, value) => {
    dispatch(updateFormField({ field, value, origin: 'entered_by_user' }));
  };

  const getOrigin = (field) => {
    return current?.field_provenance?.[field]?.origin || 'entered_by_user';
  };

  const handleAddContainment = () => {
    if (!newContainment.trim()) return;
    const currentList = Array.isArray(current.immediate_containment)
      ? current.immediate_containment
      : [];
    handleChange('immediate_containment', [...currentList, newContainment.trim()]);
    setNewContainment('');
  };

  const handleRemoveContainment = (idx) => {
    const currentList = Array.isArray(current.immediate_containment)
      ? current.immediate_containment
      : [];
    handleChange(
      'immediate_containment',
      currentList.filter((_, i) => i !== idx)
    );
  };

  const handleGapStatusChange = (gapId, newStatus) => {
    dispatch(updateEvidenceGapStatus({ gapId, status: newStatus }));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION A — Investigation Details */}
      <Card
        title="Section A — Investigation Details"
        subtitle="Core manufacturing identifiers and deviation classification"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Investigation ID</label>
            </div>
            <input
              type="text"
              readOnly
              value={current.id || 'Will be generated on save'}
              className="w-full text-xs font-mono font-semibold p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 cursor-not-allowed"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Investigation Title</label>
              <ProvenanceBadge origin={getOrigin('title')} />
            </div>
            <input
              type="text"
              value={current.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g. Deviation: OOS Residual Acetone in Atorvastatin Calcium Batch ATC-2026-B089"
              className="w-full text-xs font-medium p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">API / Product Name</label>
              <ProvenanceBadge origin={getOrigin('api_product')} />
            </div>
            <input
              type="text"
              value={current.api_product || ''}
              onChange={(e) => handleChange('api_product', e.target.value)}
              placeholder="e.g. Atorvastatin Calcium Trihydrate"
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Batch Number</label>
              <ProvenanceBadge origin={getOrigin('batch_number')} />
            </div>
            <input
              type="text"
              value={current.batch_number || ''}
              onChange={(e) => handleChange('batch_number', e.target.value)}
              placeholder="e.g. ATC-2026-B089"
              className="w-full text-xs font-mono p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Process Step / Stage</label>
              <ProvenanceBadge origin={getOrigin('process_step')} />
            </div>
            <input
              type="text"
              value={current.process_step || ''}
              onChange={(e) => handleChange('process_step', e.target.value)}
              placeholder="e.g. Stage 5 - Final Vacuum Drying"
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Equipment Identifier</label>
              <ProvenanceBadge origin={getOrigin('equipment_id')} />
            </div>
            <input
              type="text"
              value={current.equipment_id || ''}
              onChange={(e) => handleChange('equipment_id', e.target.value)}
              placeholder="e.g. CVD-04"
              className="w-full text-xs font-mono p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Manufacturing Facility</label>
              <ProvenanceBadge origin={getOrigin('facility')} />
            </div>
            <input
              type="text"
              value={current.facility || ''}
              onChange={(e) => handleChange('facility', e.target.value)}
              placeholder="e.g. Sterile API Block B, Room 204"
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Incident Date</label>
              <ProvenanceBadge origin={getOrigin('incident_date')} />
            </div>
            <input
              type="text"
              value={current.incident_date || ''}
              onChange={(e) => handleChange('incident_date', e.target.value)}
              placeholder="YYYY-MM-DD or shift date"
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Investigation Owner</label>
            </div>
            <input
              type="text"
              value={current.owner || 'QA Investigations Lead'}
              onChange={(e) => handleChange('owner', e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Severity Level</label>
            </div>
            <select
              value={current.severity || 'Undetermined'}
              onChange={(e) => handleChange('severity', e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="Undetermined">Undetermined</option>
              <option value="Critical">Critical</option>
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Investigation Status</label>
            </div>
            <select
              value={current.status || 'Draft'}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="Draft">Draft</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Awaiting Review">Awaiting Review</option>
              <option value="Approved">Approved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* SECTION B — Incident Description */}
      <Card
        title="Section B — Incident Description & Observations"
        subtitle="Objective problem statement, observed non-conformances, and parameters"
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Problem Statement <span className="text-red-500">*</span>
              </label>
              <ProvenanceBadge origin={getOrigin('problem_statement')} />
            </div>
            <textarea
              rows={2}
              value={current.problem_statement || ''}
              onChange={(e) => handleChange('problem_statement', e.target.value)}
              placeholder="State the concise factual deviation (e.g. QC Analytical release testing reported residual acetone at 5,840 ppm against limit of NMT 5,000 ppm)."
              className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Expected Condition / Limit</label>
                <ProvenanceBadge origin={getOrigin('expected_condition')} />
              </div>
              <textarea
                rows={2}
                value={current.expected_condition || ''}
                onChange={(e) => handleChange('expected_condition', e.target.value)}
                placeholder="Documented specification limit or standard procedure target"
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Actual Observed Condition</label>
                <ProvenanceBadge origin={getOrigin('observed_condition')} />
              </div>
              <textarea
                rows={2}
                value={current.observed_condition || ''}
                onChange={(e) => handleChange('observed_condition', e.target.value)}
                placeholder="Observed test reading, analytical output, or physical state"
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">What Happened (Event Sequence)</label>
              <ProvenanceBadge origin={getOrigin('what_happened')} />
            </div>
            <textarea
              rows={3}
              value={current.what_happened || ''}
              onChange={(e) => handleChange('what_happened', e.target.value)}
              placeholder="Chronological timeline of operations and detection"
              className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Immediate Containment Actions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Immediate Containment Actions Taken
              </label>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {Array.isArray(current.immediate_containment) &&
                current.immediate_containment.map((act, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs"
                  >
                    <span>{act}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveContainment(idx)}
                      className="text-amber-600 hover:text-amber-800"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add containment action (e.g. Batch quarantined in Bay 3; CVD-04 locked out)"
                value={newContainment}
                onChange={(e) => setNewContainment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddContainment())}
                className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Button variant="outline" size="sm" icon={Plus} onClick={handleAddContainment}>
                Add
              </Button>
            </div>
          </div>

          {/* Recorded Process Parameters */}
          {Array.isArray(current.relevant_parameters) && current.relevant_parameters.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block">
                Recorded Process Parameters
              </label>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Parameter</th>
                      <th className="py-2 px-3 font-semibold">Observed</th>
                      <th className="py-2 px-3 font-semibold">Specification / Target</th>
                      <th className="py-2 px-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {current.relevant_parameters.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-medium text-slate-800">{p.parameter_name}</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{p.observed_value || '-'}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{p.target_value || '-'}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              p.status === 'Deviation' || p.status === 'Alarm'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {p.status || 'Recorded'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* SECTION C — Initial Assessment */}
      <Card
        title="Section C — Quality & Downstream Impact Assessment"
        subtitle="ICH Q9 risk classification and patient exposure considerations"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Potential Quality Impact</label>
              <ProvenanceBadge origin={getOrigin('potential_quality_impact')} />
            </div>
            <textarea
              rows={2}
              value={current.potential_quality_impact || ''}
              onChange={(e) => handleChange('potential_quality_impact', e.target.value)}
              placeholder="e.g. API batch fails regulatory solvent specifications"
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Batch Disposition Impact</label>
              <ProvenanceBadge origin={getOrigin('potential_batch_impact')} />
            </div>
            <textarea
              rows={2}
              value={current.potential_batch_impact || ''}
              onChange={(e) => handleChange('potential_batch_impact', e.target.value)}
              placeholder="e.g. Quarantined; commercial release withheld pending investigation"
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Initial Risk Assessment</label>
              <ProvenanceBadge origin={getOrigin('initial_risk_assessment')} />
            </div>
            <textarea
              rows={2}
              value={current.initial_risk_assessment || ''}
              onChange={(e) => handleChange('initial_risk_assessment', e.target.value)}
              placeholder="Overall risk evaluation according to quality management system criteria"
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </Card>

      {/* SECTION D — Evidence Gaps & Missing Information */}
      <Card
        title="Section D — Evidence Gap Analysis"
        subtitle="Unreviewed records, logs, or calibrations required to substantiate root causes"
      >
        {Array.isArray(current.evidence_gaps) && current.evidence_gaps.length > 0 ? (
          <div className="space-y-3">
            {current.evidence_gaps.map((gap, idx) => (
              <div
                key={gap.id || idx}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <h5 className="text-xs font-semibold text-slate-900">{gap.description}</h5>
                      <p className="text-xs text-slate-600 mt-0.5">
                        <strong className="text-slate-700">Why it matters:</strong> {gap.why_it_matters}
                      </p>
                    </div>
                  </div>

                  <select
                    value={gap.status || 'Missing'}
                    onChange={(e) => handleGapStatusChange(gap.id, e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Missing">Status: Missing</option>
                    <option value="Requested">Status: Requested</option>
                    <option value="Provided">Status: Provided</option>
                    <option value="Reviewed">Status: Reviewed</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  {gap.helps_evaluate_cause && (
                    <span>
                      <strong>Evaluates:</strong> {gap.helps_evaluate_cause}
                    </span>
                  )}
                  {gap.suggested_verification_method && (
                    <span>
                      <strong>Verification Method:</strong> {gap.suggested_verification_method}
                    </span>
                  )}
                  <span className="font-semibold text-teal-700">Priority: {gap.priority || 'High'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No evidence gaps identified yet. Run AI analysis on the source document to automatically detect missing records.
          </div>
        )}
      </Card>
    </div>
  );
};
