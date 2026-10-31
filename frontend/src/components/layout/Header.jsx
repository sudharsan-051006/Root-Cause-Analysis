import React from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, Bell, User, Sparkles } from 'lucide-react';
import { useSelector } from 'react-redux';

export const Header = () => {
  const location = useLocation();
  const { current, hasUnsavedChanges } = useSelector((state) => state.investigation);

  // Compute breadcrumb title
  const getBreadcrumb = () => {
    if (location.pathname === '/') return 'Quality Overview & Metrics';
    if (location.pathname === '/investigations') return 'Investigations Directory';
    if (location.pathname === '/investigations/new') return 'New AI Investigation Workspace';
    if (location.pathname.startsWith('/investigations/')) {
      return `Investigation: ${current?.id || 'Active Workspace'}`;
    }
    if (location.pathname === '/capa') return 'CAPA Actions & Verification';
    if (location.pathname === '/settings') return 'System Configuration & Diagnostics';
    return 'Workspace';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-slate-800">{getBreadcrumb()}</h1>
        {hasUnsavedChanges && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Unsaved Changes
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Pharma advisory pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-800 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Evidence-Led Conclusions</span>
        </div>

        {/* User / Profile Area */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs">
            QA
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800">Lead QA Investigator</div>
            <div className="text-[10px] text-slate-500">API Quality Operations</div>
          </div>
        </div>
      </div>
    </header>
  );
};
