import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { approveInvestigationThunk, saveReviewDecisionThunk } from './investigationSlice';
import { Button } from '../../components/common/Button';
import {
  ShieldCheck,
  AlertTriangle,
  X,
  FileCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const ApprovalModal = ({ isOpen, onClose, investigationId }) => {
  const dispatch = useDispatch();
  const { current } = useSelector((state) => state.investigation);

  const [approverName, setApproverName] = useState('Dr. Marcus Webb, QA Director');
  const [approvalNotes, setApprovalNotes] = useState(
    'All critical evidence reviewed. 5 Whys and Fishbone analyses verified. CAPA actions approved for implementation.'
  );
  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!confirmedCheck) return;
    setSubmitting(true);
    try {
      await dispatch(
        approveInvestigationThunk({
          id: investigationId,
          data: {
            approved_by: approverName,
            approval_notes: approvalNotes,
          },
        })
      ).unwrap();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Authorize & Approve Investigation
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {current.id} — {current.api_product || 'API Batch'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          {/* Demonstration Notice Alert */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="leading-relaxed">
              <strong>Demonstration Workflow Notice:</strong> This sign-off illustrates the human review & approval gate in QualiRoot AI. It is NOT a legally binding 21 CFR Part 11 compliant digital signature in this development environment.
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Authorized Approver Name & Title
            </label>
            <input
              type="text"
              value={approverName}
              onChange={(e) => setApproverName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Final Approval & Batch Quality Remarks
            </label>
            <textarea
              rows={3}
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
            />
          </div>

          <label className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={confirmedCheck}
              onChange={(e) => setConfirmedCheck(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="leading-snug text-slate-800">
              I confirm that I have reviewed the AI-extracted incident evidence, verified the 5 Whys and Fishbone analyses, and authorize the scheduled CAPA corrective and preventive actions.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={CheckCircle2}
            loading={submitting}
            disabled={!confirmedCheck}
            onClick={handleApprove}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Formally Approve Investigation
          </Button>
        </div>
      </div>
    </div>
  );
};
