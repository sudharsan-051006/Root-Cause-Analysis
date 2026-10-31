import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvestigations } from '../features/investigation/investigationSlice';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import {
  Search,
  Filter,
  PlusCircle,
  FileText,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

export const InvestigationsList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list, loading } = useSelector((state) => state.investigation);

  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('All');
  const [status, setStatus] = useState('All');

  useEffect(() => {
    dispatch(fetchInvestigations({ search, severity, status }));
  }, [dispatch]);

  const handleSearch = () => {
    dispatch(fetchInvestigations({ search, severity, status }));
  };

  const handleReset = () => {
    setSearch('');
    setSeverity('All');
    setStatus('All');
    dispatch(fetchInvestigations());
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Investigations Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive register of pharmaceutical deviation records and root cause analyses
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={PlusCircle}
          onClick={() => navigate('/investigations/new')}
        >
          New Investigation
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, API name, batch number, equipment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
            <option value="Undetermined">Undetermined</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Awaiting Review">Awaiting Review</option>
            <option value="Approved">Approved</option>
            <option value="Closed">Closed</option>
          </select>

          <Button variant="secondary" size="sm" onClick={handleSearch}>
            Filter
          </Button>

          {(search || severity !== 'All' || status !== 'All') && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Directory Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-2" />
            Loading investigations...
          </div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-3">
            <FileText className="w-8 h-8 mx-auto text-slate-400" />
            <p>No investigations match the selected filter criteria.</p>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3 px-6 font-semibold">Investigation ID</th>
                  <th className="py-3 px-6 font-semibold">Title</th>
                  <th className="py-3 px-6 font-semibold">API Product</th>
                  <th className="py-3 px-6 font-semibold">Batch</th>
                  <th className="py-3 px-6 font-semibold">Severity</th>
                  <th className="py-3 px-6 font-semibold">Status</th>
                  <th className="py-3 px-6 font-semibold">Owner</th>
                  <th className="py-3 px-6 font-semibold">Updated</th>
                  <th className="py-3 px-6 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {list.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/investigations/${inv.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                      {inv.id}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-900 max-w-xs truncate">
                      {inv.title}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-800">
                      {inv.api_product || '-'}
                    </td>
                    <td className="py-3.5 px-6 font-mono">{inv.batch_number || '-'}</td>
                    <td className="py-3.5 px-6">
                      <SeverityBadge severity={inv.severity} />
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">{inv.owner || 'QA'}</td>
                    <td className="py-3.5 px-6 text-slate-400">
                      {new Date(inv.updated_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/investigations/${inv.id}`);
                        }}
                      >
                        Open
                      </Button>
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
