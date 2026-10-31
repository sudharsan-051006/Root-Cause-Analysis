import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateLocalCapa,
  removeLocalCapa,
  addLocalCapa,
} from './capaSlice';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  ShieldCheck,
  AlertOctagon,
  Sparkles,
  Layers,
} from 'lucide-react';

export const CapaWorkspace = () => {
  const dispatch = useDispatch();
  const { actions, disclaimer } = useSelector((state) => state.capa);
  const { causes } = useSelector((state) => state.rootCause);

  const [activeTypeTab, setActiveTypeTab] = useState('All'); // 'All', 'Corrective', 'Preventive', 'Effectiveness Verification'
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('Corrective');
  const [newRole, setNewRole] = useState('QA / Manufacturing Lead');
  const [newPriority, setNewPriority] = useState('Medium');

  const handleAddAction = () => {
    if (!newDesc.trim()) return;
    const prefix = newType === 'Corrective' ? 'CA' : newType === 'Preventive' ? 'PA' : 'EV';
    const count = actions.filter((a) => a.action_type === newType).length + 1;
    const newAction = {
      action_id: `${prefix}-${count < 10 ? '0' : ''}${count}`,
      action_type: newType,
      description: newDesc.trim(),
      priority: newPriority,
      responsible_role: newRole,
      status: 'Proposed',
      target_date: newType === 'Corrective' ? 'Within 7 days' : 'Within 30 days',
      rationale: 'Addressing verified root cause',
      effectiveness_verification_method: 'Audit and record verification',
    };
    dispatch(addLocalCapa(newAction));
    setNewDesc('');
  };

  const handleUpdate = (action_id, field, value) => {
    dispatch(updateLocalCapa({ action_id, updates: { [field]: value } }));
  };

  const filteredActions =
    activeTypeTab === 'All'
      ? actions
      : actions.filter((a) => a.action_type === activeTypeTab);

  return (
    <div className="space-y-6">
      {/* Pharma Disclaimer */}
      <div className="p-3.5 bg-slate-900 text-slate-200 border border-slate-800 rounded-xl flex items-start gap-3 text-xs">
        <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-white">Regulatory Quality Disclaimer:</strong> All corrective and preventive recommendations are advisory quality measures for qualified QA evaluation. They do NOT constitute automated batch release, rejection, or reprocessing orders.
        </p>
      </div>

      {/* Filter Tabs and Add Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          {['All', 'Corrective', 'Preventive', 'Effectiveness Verification'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTypeTab(t)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTypeTab === t
                  ? 'bg-white text-teal-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t} (
              {t === 'All'
                ? actions.length
                : actions.filter((a) => a.action_type === t).length}
              )
            </button>
          ))}
        </div>

        {/* Add Manual Action Form */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="Corrective">Corrective</option>
            <option value="Preventive">Preventive</option>
            <option value="Effectiveness Verification">Effectiveness Verification</option>
          </select>

          <input
            type="text"
            placeholder="Action description..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[200px]"
          />

          <Button variant="primary" size="sm" icon={Plus} onClick={handleAddAction}>
            Add Action
          </Button>
        </div>
      </div>

      {/* Actions List */}
      <div className="space-y-4">
        {filteredActions.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200">
            No CAPA actions recorded for this category yet. Click "Generate CAPA Recommendations" or add actions manually.
          </div>
        ) : (
          filteredActions.map((act) => (
            <div
              key={act.action_id || act.id}
              className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    {act.action_id}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      act.action_type === 'Corrective'
                        ? 'bg-amber-100 text-amber-800'
                        : act.action_type === 'Preventive'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {act.action_type}
                  </span>
                  <span className="text-xs text-slate-400">|</span>
                  <span className="text-xs font-semibold text-slate-700">
                    Priority: {act.priority}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-500">Status:</label>
                  <select
                    value={act.status || 'Proposed'}
                    onChange={(e) => handleUpdate(act.action_id, 'status', e.target.value)}
                    className="text-xs font-semibold px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Proposed">Proposed</option>
                    <option value="Approved">Approved</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Effectiveness Pending">Effectiveness Pending</option>
                    <option value="Effective">Effective</option>
                    <option value="Ineffective">Ineffective</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => dispatch(removeLocalCapa(act.action_id))}
                    className="text-slate-400 hover:text-red-600 p-1 rounded"
                    title="Remove action"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Description */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Action Description & Objective
                </label>
                <textarea
                  rows={2}
                  value={act.description || ''}
                  onChange={(e) => handleUpdate(act.action_id, 'description', e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-y"
                />
              </div>

              {/* Rationale and Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Responsible Role / Owner
                  </label>
                  <input
                    type="text"
                    value={act.responsible_role || ''}
                    onChange={(e) =>
                      handleUpdate(act.action_id, 'responsible_role', e.target.value)
                    }
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Target Completion Date
                  </label>
                  <input
                    type="text"
                    value={act.target_date || ''}
                    onChange={(e) => handleUpdate(act.action_id, 'target_date', e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Effectiveness Verification Method
                  </label>
                  <input
                    type="text"
                    value={act.effectiveness_verification_method || ''}
                    onChange={(e) =>
                      handleUpdate(
                        act.action_id,
                        'effectiveness_verification_method',
                        e.target.value
                      )
                    }
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
