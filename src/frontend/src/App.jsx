import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Dashboard from './pages/Dashboard';
import ConfigAudit from './pages/ConfigAudit';
import ComplianceExplorer from './pages/ComplianceExplorer';
import Findings from './pages/Findings';
import SecurityGraph from './pages/SecurityGraph';
import RiskAnalysis from './pages/RiskAnalysis';
import RemediationSimulator from './pages/RemediationSimulator';
import ConfigDrift from './pages/ConfigDrift';
import AuditReports from './pages/AuditReports';

export default function App() {
  // Show landing page first; once the user clicks "Open dashboard" we enter the app
  const [showLanding, setShowLanding] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedFindingForRemediation, setSelectedFindingForRemediation] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':    return <Dashboard setActiveTab={setActiveTab} />;
      case 'audit':        return <ConfigAudit setActiveTab={setActiveTab} />;
      case 'compliance':   return <ComplianceExplorer />;
      case 'findings':     return (
        <Findings
          setActiveTab={setActiveTab}
          onSelectRemediation={(f) => setSelectedFindingForRemediation(f)}
        />
      );
      case 'graph':        return <SecurityGraph />;
      case 'risk':         return <RiskAnalysis setActiveTab={setActiveTab} />;
      case 'remediation':  return <RemediationSimulator selectedFindingFromOtherTab={selectedFindingForRemediation} />;
      case 'drift':        return <ConfigDrift />;
      case 'reports':      return <AuditReports />;
      default:             return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  // Landing page — shown before entering the app
  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  // Main app shell
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <Navbar onQuickAuditClick={() => setActiveTab('audit')} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />

        <main
          className="flex-1 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 44px)' }}
        >
          <div className="p-5 max-w-[1600px]">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
