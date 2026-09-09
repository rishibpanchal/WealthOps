import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { InstitutionalApprovals } from './components/InstitutionalApprovals';
import { InstitutionalClients } from './components/InstitutionalClients';
import { InstitutionalPolicies } from './components/InstitutionalPolicies';
import { AgentTimeline } from './components/AgentTimeline';
import { InstitutionalAudit } from './components/InstitutionalAudit';
import { InstitutionalGovernance } from './components/InstitutionalGovernance';
import { InstitutionalProcess } from './components/InstitutionalProcess';
import { LandingExperience } from './components/LandingExperience';
import { PlatformInitialization } from './components/PlatformInitialization';
import { UserRole, ClientSummary, AgentRunResponse } from './types';
import { api } from './api';

type AppMode = 'LANDING' | 'INITIALIZING' | 'PLATFORM';

export function App() {
  const [appMode, setAppMode] = useState<AppMode>('LANDING');
  const [currentRole, setCurrentRole] = useState<UserRole>('OPERATIONS_ANALYST');
  const [activeView, setActiveView] = useState<string>('overview');
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(1);
  const [exceptionsCount, setExceptionsCount] = useState<number>(4);
  const [currentResponse, setCurrentResponse] = useState<AgentRunResponse | null>(null);

  const refreshPlatformData = async () => {
    try {
      const [clientsData, statsData] = await Promise.all([
        api.getClients(currentRole).catch(() => []),
        api.getStats(currentRole).catch(() => ({ pending_approvals: 1, policy_breaches_flagged: 4 })),
      ]);
      if (clientsData && clientsData.length > 0) {
        setClients(clientsData);
        const breaches = clientsData.filter((c: any) => c.policy_status === 'BREACH').length;
        setExceptionsCount(breaches || 4);
      }
      if (statsData) {
        setPendingApprovalsCount(statsData.pending_approvals);
      }
    } catch (err) {
      console.error('Failed to refresh data', err);
    }
  };

  useEffect(() => {
    refreshPlatformData();
  }, [currentRole]);

  // If in Landing Experience mode
  if (appMode === 'LANDING') {
    return (
      <LandingExperience
        onEnterPlatform={() => setAppMode('INITIALIZING')}
        onDispatchQuery={(query, clientId) => {
          setAppMode('INITIALIZING');
        }}
      />
    );
  }

  // If in Initializing mode (1.2s typographic sequence)
  if (appMode === 'INITIALIZING') {
    return (
      <PlatformInitialization
        onComplete={() => setAppMode('PLATFORM')}
      />
    );
  }

  // Institutional Command Platform
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)' }}>
      {/* Editorial Sidebar */}
      <Sidebar
        currentRole={currentRole}
        onRoleChange={(role) => {
          setCurrentRole(role);
          refreshPlatformData();
        }}
        activeView={activeView}
        onViewChange={setActiveView}
        pendingApprovalsCount={pendingApprovalsCount}
        exceptionsCount={exceptionsCount}
        onReturnToLanding={() => setAppMode('LANDING')}
      />

      {/* Main Body Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header currentRole={currentRole} activeView={activeView} />

        <main style={{ flex: 1, padding: '0 40px', overflowY: 'auto' }}>
          {activeView === 'overview' && (
            <DashboardOverview
              currentRole={currentRole}
              onNavigate={(view, clientId) => {
                setActiveView(view);
              }}
              clients={clients}
              pendingApprovalsCount={pendingApprovalsCount}
              exceptionsCount={exceptionsCount}
              onAgentRunComplete={(res) => {
                setCurrentResponse(res);
                refreshPlatformData();
              }}
            />
          )}

          {activeView === 'workflows' && (
            <WorkflowCanvas
              currentResponse={currentResponse}
              onNavigateToApprovals={() => setActiveView('approvals')}
            />
          )}

          {activeView === 'exceptions' && (
            <InstitutionalClients
              currentRole={currentRole}
              onDispatchClientQuery={(cId) => {
                setActiveView('overview');
              }}
            />
          )}

          {activeView === 'approvals' && (
            <InstitutionalApprovals
              currentRole={currentRole}
              onRefreshStats={refreshPlatformData}
            />
          )}

          {activeView === 'clients' && (
            <InstitutionalClients
              currentRole={currentRole}
              onDispatchClientQuery={(cId) => {
                setActiveView('overview');
              }}
            />
          )}

          {activeView === 'policies' && (
            <InstitutionalPolicies currentRole={currentRole} />
          )}

          {activeView === 'agent-runs' && (
            <AgentTimeline
              currentResponse={currentResponse}
              onNavigateToApprovals={() => setActiveView('approvals')}
            />
          )}

          {activeView === 'knowledge' && (
            <InstitutionalPolicies currentRole={currentRole} />
          )}

          {activeView === 'process' && (
            <InstitutionalProcess
              currentRole={currentRole}
              onRefreshStats={refreshPlatformData}
            />
          )}

          {activeView === 'audit' && (
            <InstitutionalAudit currentRole={currentRole} />
          )}

          {activeView === 'evaluation' && (
            <InstitutionalGovernance currentRole={currentRole} />
          )}
        </main>

        {/* Editorial Subdued Footer */}
        <footer style={{
          borderTop: '1px solid var(--border-hairline)',
          background: 'var(--bg-canvas)',
          padding: '16px 40px',
          fontSize: '0.74rem',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <strong>WealthOps</strong> · Private Banking & Operations Intelligence Platform · Controlled Fiduciary Automation
          </div>
          <div style={{ display: 'flex', gap: '20px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
            <span>RBAC: {currentRole}</span>
            <span>Policy: SOP-WM-402</span>
            <span>Audit: Immutable Ledger Active</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
