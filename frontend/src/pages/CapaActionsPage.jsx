import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllCapaActions,
  updateCapaStatusThunk,
} from '../features/capa/capaSlice';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  CheckCircle2,
  Filter,
  Search,
  ExternalLink,
  RefreshCw,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export const CapaActionsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { allActions, loading } = useSelector((state) => state.capa);

  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  useEffect(() => {
    dispatch(
      fetchAllCapaActions({
        actionType: typeFilter,
        status: statusFilter,
        priority: priorityFilter,
      })
    );
  }, [dispatch, typeFilter, statusFilter, priorityFilter]);

  const handleStatusChange = (actionId, newStatus) => {
    dispatch(
      updateCapaStatusThunk({
        actionId,
        updates: { status: newStatus },
      })
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">CAPA Actions Management</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Track corrective actions, preventive actions, and long-term effectiveness verifications
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
        >
          <option value="All">All Action Types</option>
          <option value="Corrective">Corrective Actions</option>
          <option value="Preventive">Preventive Actions</option>
          <option value="Effectiveness Verification">Effectiveness Verifications</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
        >
          <option value="All">All Statuses</option>
          <option value="Proposed">Proposed</option>
          <option value="Approved">Approved</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Effectiveness Pending">Effectiveness Pending</option>
          <option value="Effective">Effective</option>
          <option value="Ineffective">Ineffective</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
        >
          <option value="All">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={() =>
            dispatch(
              fetchAllCapaActions({
                actionType: typeFilter,
                status: statusFilter,
                priority: priorityFilter,
              })
            )
          }
        >
          Refresh
        </Button>
      </div>

      {/* Actions Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-2" />
            Loading actions...
          </div>
        ) : allActions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300" />
            <p>No CAPA actions match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3 px-6 font-semibold">Action ID</th>
                  <th className="py-3 px-6 font-semibold">Type</th>
                  <th className="py-3 px-6 font-semibold">Description</th>
                  <th className="py-3 px-6 font-semibold">Priority</th>
                  <th className="py-3 px-6 font-semibold">Responsible</th>
                  <th className="py-3 px-6 font-semibold">Target Date</th>
                  <th className="py-3 px-6 font-semibold">Status</th>
                  <th className="py-3 px-6 font-semibold text-right">Investigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {allActions.map((act) => (
                  <tr key={act.id || act.action_id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                      {act.action_id}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          act.action_type === 'Corrective'
                            ? 'bg-amber-100 text-amber-800'
                            : act.action_type === 'Preventive'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {act.action_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-900 max-w-sm">
                      {act.description}
                    </td>
                    <td className="py-3.5 px-6 font-semibold">{act.priority}</td>
                    <td className="py-3.5 px-6 text-slate-600">{act.responsible_role}</td>
                    <td className="py-3.5 px-6 text-slate-500">{act.target_date || '-'}</td>
                    <td className="py-3.5 px-6">
                      <select
                        value={act.status || 'Proposed'}
                        onChange={(e) => handleStatusChange(act.id, e.target.value)}
                        className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-800"
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
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {act.investigation_id ? (
                        <button
                          onClick={() => navigate(`/investigations/${act.investigation_id}`)}
                          className="text-teal-700 hover:text-teal-900 font-mono font-semibold flex items-center gap-1 justify-end"
                        >
                          <span>{act.investigation_id}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
