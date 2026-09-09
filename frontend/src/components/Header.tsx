import React from 'react';
import { UserRole } from '../types';
import { LiveOperationsTicker } from './LiveOperationsTicker';

interface HeaderProps {
  currentRole: UserRole;
  activeView: string;
}

const VIEW_TITLES: Record<string, { category: string; title: string }> = {
  overview: { category: 'Operations Command', title: 'Executive Overview' },
  workflows: { category: 'Operations Architecture', title: 'Interactive Workflow Canvas' },
  exceptions: { category: 'Policy Monitoring', title: 'Active Portfolio Exceptions' },
  approvals: { category: 'Fiduciary Governance', title: 'Dual-Approval Review Queue' },
  clients: { category: 'Discretionary Accounts', title: 'Client Universe & Dossier' },
  policies: { category: 'Institutional Governance', title: 'Policy Knowledge Base' },
  'agent-runs': { category: 'Agent Execution', title: 'Operations Activity Timeline' },
  knowledge: { category: 'Semantic RAG', title: 'Policy Retrieval & Vectors' },
  process: { category: 'UBS Operating Model', title: 'Workflow Opportunity Analyzer' },
  audit: { category: 'Regulatory Compliance', title: 'Immutable Audit Ledger' },
  evaluation: { category: 'Model Risk Management', title: 'AI Governance Benchmark' },
};

export const Header: React.FC<HeaderProps> = ({ currentRole, activeView }) => {
  const current = VIEW_TITLES[activeView] || { category: 'Operations', title: 'Overview' };

  return (
    <header style={{
      height: '60px',
      borderBottom: '1px solid var(--border-hairline)',
      background: 'var(--bg-canvas)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      gap: '24px',
    }}>
      {/* Breadcrumb path */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
        <span style={{ color: 'var(--text-muted)' }}>{current.category}</span>
        <span style={{ color: 'var(--border-strong)' }}>/</span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{current.title}</span>
      </div>

      {/* Center Live Operations Ticker */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-surface-subdued)',
        border: '1px solid var(--border-hairline)',
        borderRadius: '20px',
        padding: '5px 16px',
        maxWidth: '520px',
        overflow: 'hidden',
      }}>
        <LiveOperationsTicker />
      </div>

      {/* Date & Compliance indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--semantic-green)',
          }} />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
            Deterministic Guardrails Active (SOP-WM-402)
          </span>
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          fontSize: '0.72rem',
          borderLeft: '1px solid var(--border-hairline)',
          paddingLeft: '16px',
        }}>
          09 SEP 2026 · 15:42 EST
        </div>
      </div>
    </header>
  );
};
