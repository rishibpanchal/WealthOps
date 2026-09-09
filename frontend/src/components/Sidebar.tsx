import React from 'react';
import { UserRole } from '../types';
import { USER_PROFILES } from '../api';

interface SidebarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeView: string;
  onViewChange: (view: string) => void;
  pendingApprovalsCount: number;
  exceptionsCount: number;
  onReturnToLanding?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  onRoleChange,
  activeView,
  onViewChange,
  pendingApprovalsCount,
  exceptionsCount,
  onReturnToLanding,
}) => {
  const profile = USER_PROFILES[currentRole];

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'overview', label: 'Overview' },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'workflows', label: 'Workflows' },
        { id: 'exceptions', label: 'Exceptions', badge: exceptionsCount > 0 ? `${exceptionsCount}` : undefined },
        { id: 'approvals', label: 'Approvals', badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined },
      ],
    },
    {
      title: 'CLIENTS',
      items: [
        { id: 'clients', label: 'Clients & Portfolios' },
        { id: 'policies', label: 'Policies' },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'agent-runs', label: 'Agent Runs' },
        { id: 'knowledge', label: 'Policy Knowledge' },
        { id: 'process', label: 'Process Modeling' },
      ],
    },
    {
      title: 'CONTROL',
      items: [
        { id: 'audit', label: 'Audit' },
        { id: 'evaluation', label: 'AI Evaluation' },
      ],
    },
  ];

  return (
    <aside style={{
      width: '240px',
      minWidth: '240px',
      background: 'var(--bg-surface-subdued)',
      borderRight: '1px solid var(--border-hairline)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100vh',
      position: 'sticky',
      top: 0,
      userSelect: 'none',
    }}>
      {/* Brand & Masthead */}
      <div>
        {onReturnToLanding && (
          <button
            onClick={onReturnToLanding}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 24px',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border-hairline)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'color 0.15s ease, background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent-bronze)';
              e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span>←</span>
            <span>Editorial Presentation</span>
          </button>
        )}

        <div style={{
          padding: '22px 24px 18px 24px',
          borderBottom: '1px solid var(--border-hairline)',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              fontWeight: 500,
              letterSpacing: '0.02em',
              color: 'var(--text-primary)',
            }}>
              WEALTHOPS
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
            }}>
              09.09.26
            </span>
          </div>
          <div style={{
            fontSize: '0.72rem',
            color: 'var(--text-secondary)',
            marginTop: '4px',
            lineHeight: 1.3,
          }}>
            Institutional Operations Platform
          </div>
        </div>

        {/* Navigation Sections */}
        <nav style={{ padding: '16px 0', overflowY: 'auto' }}>
          {navSections.map((section) => (
            <div key={section.title} style={{ marginBottom: '18px' }}>
              <div style={{
                padding: '0 24px 6px 24px',
                fontSize: '0.68rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}>
                {section.title}
              </div>
              <div>
                {section.items.map((item) => {
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onViewChange(item.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '7px 24px',
                        background: isActive ? 'var(--bg-canvas)' : 'transparent',
                        border: 'none',
                        borderLeft: isActive ? '2px solid var(--accent-bronze)' : '2px solid transparent',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background 0.12s ease, color 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span>{item.label}</span>
                      {item.badge && (
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          background: item.id === 'exceptions' ? 'var(--semantic-crimson-bg)' : 'var(--semantic-amber-bg)',
                          color: item.id === 'exceptions' ? 'var(--semantic-crimson)' : 'var(--semantic-amber)',
                          fontWeight: 600,
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Role / Persona Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border-hairline)',
        background: 'var(--bg-surface)',
      }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
          Active Persona
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
            {profile.name}
          </div>
          <span className="status-pill status-pill-neutral" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
            {currentRole === 'RISK_OFFICER' ? 'Dual Sign-off' : currentRole === 'OPERATIONS_ANALYST' ? 'Operations' : currentRole}
          </span>
        </div>

        <select
          value={currentRole}
          onChange={(e) => onRoleChange(e.target.value as UserRole)}
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: '0.75rem',
            background: 'var(--bg-surface-subdued)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '4px',
            color: 'var(--text-primary)',
            outline: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <option value="OPERATIONS_ANALYST">Rishi Sharma — Operations Analyst</option>
          <option value="RISK_OFFICER">Elena Rostova — Chief Risk Officer</option>
          <option value="ADVISOR">Marcus Vance — Senior Advisor</option>
          <option value="ADMIN">Sarah Jenkins — Platform Admin</option>
          <option value="VIEWER">Alex Morgan — Read-Only Auditor</option>
        </select>
      </div>
    </aside>
  );
};
