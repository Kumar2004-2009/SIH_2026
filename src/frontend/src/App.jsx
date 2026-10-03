import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedFindingForRemediation, setSelectedFindingForRemediation] = useState(null);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'audit':
        return <ConfigAudit setActiveTab={setActiveTab} />;
      case 'compliance':
        return <ComplianceExplorer />;
      case 'findings':
        return (
          <Findings
            setActiveTab={setActiveTab}
            onSelectRemediation={(finding) => setSelectedFindingForRemediation(finding)}
          />
        );
      case 'graph':
        return <SecurityGraph />;
      case 'risk':
        return <RiskAnalysis setActiveTab={setActiveTab} />;
      case 'remediation':
        return (
          <RemediationSimulator
            selectedFindingFromOtherTab={selectedFindingForRemediation}
          />
        );
      case 'drift':
        return <ConfigDrift />;
      case 'reports':
        return <AuditReports />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-100">
      {/* Top SOC Navbar */}
      <Navbar onQuickAuditClick={() => setActiveTab('audit')} />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-5 md:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
          <div className="max-w-7xl mx-auto">
            {renderActivePage()}
          </div>
        </main>
      </div>
    </div>
  );
}
