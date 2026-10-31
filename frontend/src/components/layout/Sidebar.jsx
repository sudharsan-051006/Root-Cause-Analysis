import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  SearchCheck,
  CheckCircle2,
  Settings as SettingsIcon,
  PlusCircle,
  Activity,
  Layers,
  Database,
  Cpu,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';

export const Sidebar = () => {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: 'offline', database: { connected: false }, ai_engine: { configured: false } }));
  }, []);

  const navItems = [
    { name: 'Overview', to: '/', icon: LayoutDashboard },
    { name: 'Investigations', to: '/investigations', icon: SearchCheck },
    { name: 'CAPA Actions', to: '/capa', icon: CheckCircle2 },
    { name: 'Settings', to: '/settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 select-none">
      {/* Brand & Logo */}
      <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold shadow-inner">
            <Layers className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <div className="font-bold text-white text-base tracking-tight flex items-center gap-1.5">
              QualiRoot <span className="text-teal-400 font-black">AI</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
              Pharma RCA Suite
            </div>
          </div>
        </div>
      </div>

      {/* Start Investigation CTA */}
      <div className="px-4 py-4">
        <NavLink
          to="/investigations/new"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-semibold shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Start Investigation</span>
        </NavLink>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-teal-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Footprint */}
      <div className="p-4 border-t border-slate-800 text-xs space-y-2 bg-slate-950/40">
        <div className="flex items-center justify-between text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            Database
          </span>
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                health?.database?.connected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            {health?.database?.type?.toUpperCase() || 'OFFLINE'}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            Groq AI Engine
          </span>
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                health?.ai_engine?.configured ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            {health?.ai_engine?.configured ? 'READY' : 'UNCONFIGURED'}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
          <span>ICH Q9 / Q10 cGMP</span>
          <span className="font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
