import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { InvestigationsList } from './pages/InvestigationsList';
import { InvestigationWorkspace } from './pages/InvestigationWorkspace';
import { CapaActionsPage } from './pages/CapaActionsPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="investigations" element={<InvestigationsList />} />
        <Route path="investigations/new" element={<InvestigationWorkspace />} />
        <Route path="investigations/:id" element={<InvestigationWorkspace />} />
        <Route path="capa" element={<CapaActionsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
