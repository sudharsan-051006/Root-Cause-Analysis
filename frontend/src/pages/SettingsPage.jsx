import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  Cpu,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCode,
  Layers,
  Terminal,
} from 'lucide-react';

export const SettingsPage = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = () => {
    setLoading(true);
    api.getHealth()
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        setHealth({
          status: 'error',
          error: err.message,
          database: { connected: false },
          ai_engine: { configured: false, message: 'Backend unreachable' },
        });
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System Diagnostics & Settings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify runtime connectivity, AI orchestration status, and database persistence
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          loading={loading}
          onClick={fetchStatus}
        >
          Run Diagnostics
        </Button>
      </div>

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Groq AI Engine */}
        <Card
          title="Groq AI Inference Service"
          subtitle="LangGraph structured output generation"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-700">Status</span>
              <span
                className={`inline-flex items-center gap-1.5 font-bold ${
                  health?.ai_engine?.configured ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {health?.ai_engine?.configured ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    CONFIGURED & READY
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    KEY NOT CONFIGURED
                  </>
                )}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Model Engine:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {health?.ai_engine?.model || 'llama-3.3-70b-versatile'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Orchestrator:</span>
                <span className="font-mono font-semibold text-slate-800">LangGraph (Typed State)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-100 rounded-lg text-slate-700 font-mono text-[11px] leading-relaxed">
              {health?.ai_engine?.message}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              To configure live Groq inference, set <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-bold">GROQ_API_KEY=gsk_...</code> in <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">backend/.env</code> and restart the backend.
            </p>
          </div>
        </Card>

        {/* Database Persistence */}
        <Card
          title="Persistent Database Engine"
          subtitle="SQLAlchemy ORM + PostgreSQL / Embedded SQLite"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-700">Database Connection</span>
              <span
                className={`inline-flex items-center gap-1.5 font-bold ${
                  health?.database?.connected ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {health?.database?.connected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    CONNECTED ({health.database.type.toUpperCase()})
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    DISCONNECTED
                  </>
                )}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Engine Type:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {health?.database?.type || 'unknown'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Survival on Refresh:</span>
                <span className="text-emerald-700 font-semibold">Active & Persistent</span>
              </div>
            </div>

            <div className="p-3 bg-slate-100 rounded-lg text-slate-700 text-[11px] leading-relaxed">
              All investigation records, 5 Whys analyses, fishbone causes, and CAPA actions are stored persistently on the backend disk and survive application restarts.
            </div>
          </div>
        </Card>
      </div>

      {/* Compliance & Safety Principles */}
      <Card
        title="Regulatory Quality Principles (ICH Q9 / Q10)"
        subtitle="Core engineering principles guiding QualiRoot AI"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <h5 className="font-bold text-slate-900">Hypotheses vs Confirmed Root Causes</h5>
            <p className="text-slate-600 leading-relaxed">
              AI-generated causal statements are hypotheses until supported by verified evidence and authorized by a designated human QA reviewer.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <h5 className="font-bold text-slate-900">Field-Level Provenance</h5>
            <p className="text-slate-600 leading-relaxed">
              Every value clearly indicates whether it was directly extracted from source text, inferred by the model, user-entered, or reviewer-confirmed.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <h5 className="font-bold text-slate-900">Evidence Gap Assessment</h5>
            <p className="text-slate-600 leading-relaxed">
              The AI distinguishes between records not mentioned in the intake material vs records confirmed not to exist.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <h5 className="font-bold text-slate-900">Advisory CAPA Boundaries</h5>
            <p className="text-slate-600 leading-relaxed">
              CAPA recommendations are advisory actions for qualified quality evaluation, never automatic batch release or disposition commands.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
