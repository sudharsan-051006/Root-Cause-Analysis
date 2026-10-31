import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDashboardSummary,
  fetchInvestigations,
} from '../features/investigation/investigationSlice';
import {
  SearchCheck,
  Clock,
  CheckCircle2,
  AlertOctagon,
  PlusCircle,
  Search,
  Filter,
  ArrowRight,
  FileText,
  Building,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';

export const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { summary, list, loading } = useSelector((state) => state.investigation);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  useEffect(() => {
    dispatch(fetchDashboardSummary());
    dispatch(fetchInvestigations());
  }, [dispatch]);

  const handleFilter = () => {
    dispatch(
      fetchInvestigations({
        search: searchTerm,
        severity: selectedSeverity,
        status: selectedStatus,
      })
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSeverity('All');
    setSelectedStatus('All');
    dispatch(fetchInvestigations());
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 to-navy-800 text-white p-6 rounded-2xl shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Pharmaceutical Quality Risk Management (ICH Q9 / Q10)
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Root Cause Analysis Operations</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            AI-assisted investigations with verified field provenance. All model outputs remain hypotheses until authorized by human QA review.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            icon={RefreshCw}
            onClick={() => {
              dispatch(fetchDashboardSummary());
              dispatch(fetchInvestigations());
            }}
            className="text-slate-800 bg-white hover:bg-slate-50 border-white/20"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={PlusCircle}
            onClick={() => navigate('/investigations/new')}
          >
            Start Investigation
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Investigations
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {summary.total_investigations}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <SearchCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
            <span>Persistent API records</span>
          </p>
        </Card>

        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                In Progress
              </p>
              <h3 className="text-2xl font-bold text-teal-700 mt-1">
                {summary.in_progress_count}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-teal-600 font-medium mt-3">Under active investigation</p>
        </Card>

        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Awaiting Review
              </p>
              <h3 className="text-2xl font-bold text-amber-700 mt-1">
                {summary.awaiting_review_count}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-amber-600 font-medium mt-3">Requires QA Lead authorization</p>
        </Card>

        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Open CAPA Actions
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {summary.open_capa_count}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Corrective & preventive tasks</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, API product, batch, equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
            <option value="Undetermined">Undetermined</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Awaiting Review">Awaiting Review</option>
            <option value="Approved">Approved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleFilter}>
            Apply Filters
          </Button>
          {(searchTerm || selectedSeverity !== 'All' || selectedStatus !== 'All') && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Investigations Table */}
      <Card
        title="Recent Investigations"
        subtitle="Saved pharmaceutical deviation records and root cause assessments"
      >
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
            Loading investigations...
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-900">No investigations recorded</h4>
              <p className="text-xs text-slate-500 mt-1">
                Start an investigation by uploading a deviation report PDF, pasting incident text, or entering an email notification.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              icon={PlusCircle}
              onClick={() => navigate('/investigations/new')}
            >
              Start First Investigation
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3 px-6 font-semibold">Investigation ID</th>
                  <th className="py-3 px-6 font-semibold">Title</th>
                  <th className="py-3 px-6 font-semibold">API / Product</th>
                  <th className="py-3 px-6 font-semibold">Batch</th>
                  <th className="py-3 px-6 font-semibold">Severity</th>
                  <th className="py-3 px-6 font-semibold">Status</th>
                  <th className="py-3 px-6 font-semibold">Last Updated</th>
                  <th className="py-3 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {list.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/investigations/${inv.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-6 font-mono text-xs font-semibold text-slate-900">
                      {inv.id}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-900 max-w-xs truncate">
                      {inv.title}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {inv.api_product || <span className="text-slate-400 italic">Not set</span>}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-xs">
                      {inv.batch_number || <span className="text-slate-400 italic">-</span>}
                    </td>
                    <td className="py-3.5 px-6">
                      <SeverityBadge severity={inv.severity} />
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-500">
                      {inv.updated_at ? new Date(inv.updated_at).toLocaleString() : '-'}
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
                        Open Workspace
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
