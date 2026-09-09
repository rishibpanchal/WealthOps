import React, { useState } from 'react';
import { UserRole, AgentRunResponse, ClientSummary } from '../types';
import { api, USER_PROFILES } from '../api';

interface DashboardOverviewProps {
  currentRole: UserRole;
  onNavigate: (view: string, clientId?: string) => void;
  clients: ClientSummary[];
  pendingApprovalsCount: number;
  exceptionsCount: number;
  onAgentRunComplete: (res: AgentRunResponse) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  currentRole,
  onNavigate,
  clients,
  pendingApprovalsCount,
  exceptionsCount,
  onAgentRunComplete,
}) => {
  const profile = USER_PROFILES[currentRole];
  const [query, setQuery] = useState(
    'Find clients whose equity allocation exceeds their investment policy limit and prepare a report.'
  );
  const [clientId, setClientId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const breachedClients = clients.filter((c) => c.policy_status === 'BREACH');

  const operationalPrompts = [
    {
      title: 'Portfolio Exception Scan',
      desc: 'Scan active client universe for IPS asset class drift',
      query: 'Find clients whose equity allocation exceeds their investment policy limit and prepare a report.',
      client: '',
    },
    {
      title: 'Analyze Client C1024 Risk',
      desc: 'Evaluate 1-day 95% VaR and Sharpe ratio against policy',
      query: 'Check whether client C1024 portfolio is outside their approved risk tolerance and prepare a recommendation.',
      client: 'C1024',
    },
    {
      title: 'Formulate Rebalance (C1024)',
      desc: 'Model buy/sell adjustments and evaluate $100k threshold',
      query: 'Prepare a rebalance recommendation for client C1024.',
      client: 'C1024',
    },
    {
      title: 'Direct Order (Test RBAC)',
      desc: 'Attempt direct market execution to verify guardrail lock',
      query: 'Execute market sale of 500 shares AAPL for client C1024 immediately.',
      client: 'C1024',
    },
  ];

  const handleExecute = async (overrideQuery?: string, overrideClient?: string) => {
    const q = overrideQuery || query;
    const c = overrideClient !== undefined ? overrideClient : clientId;
    if (!q.trim()) return;

    setIsRunning(true);
    setError(null);
    try {
      const res = await api.runAgent(q, currentRole, c || undefined);
      onAgentRunComplete(res);
      onNavigate('workflows');
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 0 80px 0' }}>
      {/* Editorial Masthead / Greeting */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderBottom: '1px solid var(--border-hairline)',
          paddingBottom: '20px',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}>
              Operations Command Center · 09 September 2026
            </div>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.5rem',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              lineHeight: 1.15,
            }}>
              Good morning, {profile.name.split(' ')[0]}.
            </h1>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Turn complex wealth-management workflows into controlled, auditable operations with intelligent automation.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => onNavigate('workflows')}
              className="btn-institutional btn-institutional-secondary"
            >
              Explore Workflows
            </button>
            <button
              onClick={() => onNavigate('approvals')}
              className="btn-institutional btn-institutional-primary"
            >
              Open Approvals ({pendingApprovalsCount})
            </button>
          </div>
        </div>
      </section>

      {/* Editorial Key Metrics Row (No Giant Rounded Cards) */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        borderBottom: '1px solid var(--border-hairline)',
        paddingBottom: '32px',
        marginBottom: '48px',
      }}>
        <div style={{ paddingRight: '24px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Assets Monitored
          </div>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.2rem',
            color: 'var(--text-primary)',
            marginTop: '4px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            $24.8M
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Across 24 active discretionary accounts
          </div>
        </div>

        <div style={{ padding: '0 24px', borderLeft: '1px solid var(--border-hairline)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Agent Operations Runs
          </div>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.2rem',
            color: 'var(--text-primary)',
            marginTop: '4px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            1,284
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--semantic-green)', marginTop: '4px' }}>
            98.2% automated execution rate
          </div>
        </div>

        <div style={{ padding: '0 24px', borderLeft: '1px solid var(--border-hairline)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Policy Exceptions
          </div>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.2rem',
            color: exceptionsCount > 0 ? 'var(--semantic-crimson)' : 'var(--text-primary)',
            marginTop: '4px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {exceptionsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Accounts outside documented IPS limits
          </div>
        </div>

        <div style={{ paddingLeft: '24px', borderLeft: '1px solid var(--border-hairline)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Pending Dual Approvals
          </div>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.2rem',
            color: pendingApprovalsCount > 0 ? 'var(--semantic-amber)' : 'var(--text-primary)',
            marginTop: '4px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {pendingApprovalsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Awaiting Risk Officer sign-off (SOP-WM-402)
          </div>
        </div>
      </section>

      {/* Main Two-Column Editorial Operations Dispatch */}
      <section style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '48px' }}>
        {/* Left: Natural-Language Operations Dispatch */}
        <div>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.4rem',
            fontWeight: 400,
            color: 'var(--text-primary)',
            marginBottom: '6px',
          }}>
            Operations Dispatch
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Instruct the operations agent in plain language. Actions are governed by the deterministic policy engine, validated against client IPS documents, and routed for dual approval when drift thresholds are breached.
          </p>

          {/* Prompt Entry Box */}
          <div style={{
            border: '1px solid var(--border-muted)',
            background: 'var(--bg-surface)',
            borderRadius: '4px',
            padding: '16px',
            marginBottom: '24px',
          }}>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              placeholder="Enter operational instruction..."
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.92rem',
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                resize: 'none',
              }}
            />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-hairline)',
              paddingTop: '12px',
              marginTop: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Account:</span>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value.toUpperCase())}
                  placeholder="e.g. C1024"
                  style={{
                    width: '90px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    border: '1px solid var(--border-hairline)',
                    borderRadius: '3px',
                    background: 'var(--bg-surface-subdued)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    textAlign: 'center',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Authority: <strong>{currentRole}</strong>
                </span>
                <button
                  onClick={() => handleExecute()}
                  disabled={isRunning || !query.trim()}
                  className="btn-institutional btn-institutional-primary"
                  style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                >
                  {isRunning ? 'Processing...' : 'Run Workflow'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '4px',
              background: 'var(--semantic-crimson-bg)',
              border: '1px solid #E8CFCF',
              color: 'var(--semantic-crimson)',
              fontSize: '0.82rem',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          {/* Operational Presets */}
          <div>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}>
              Standard Operational Workflows
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {operationalPrompts.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setQuery(p.query);
                    setClientId(p.client);
                    handleExecute(p.query, p.client);
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-hairline)',
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-bronze)';
                    e.currentTarget.style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hairline)';
                    e.currentTarget.style.background = 'var(--bg-surface)';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {p.desc}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-bronze)', fontWeight: 500 }}>
                    Execute →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Active Policy Exceptions Feed */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.4rem',
              fontWeight: 400,
              color: 'var(--text-primary)',
            }}>
              Policy Drift Feed
            </div>
            <button
              onClick={() => onNavigate('exceptions')}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '0.78rem',
                color: 'var(--accent-bronze)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              View all ({breachedClients.length}) →
            </button>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Accounts currently exceeding permitted asset allocation boundaries under documented IPS terms.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-hairline)', borderRadius: '4px', background: 'var(--bg-surface)' }}>
            {breachedClients.slice(0, 4).map((c, i) => (
              <div
                key={c.id}
                style={{
                  padding: '14px 18px',
                  borderBottom: i < 3 ? '1px solid var(--border-hairline)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {c.id}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {c.name}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    AUM ${c.aum.toLocaleString()} · {c.risk_tolerance} Profile
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="status-pill status-pill-crimson" style={{ fontSize: '0.68rem' }}>
                    Equity {c.equity_pct}%
                  </span>
                  <div style={{ marginTop: '4px' }}>
                    <button
                      onClick={() => {
                        setQuery(`Prepare a rebalance recommendation for client ${c.id}.`);
                        setClientId(c.id);
                        handleExecute(`Prepare a rebalance recommendation for client ${c.id}.`, c.id);
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: '0.72rem',
                        color: 'var(--accent-bronze)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Formulate Rebalance →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Governance Notice Box */}
          <div style={{
            marginTop: '20px',
            padding: '14px 16px',
            borderRadius: '4px',
            background: 'var(--bg-surface-subdued)',
            border: '1px solid var(--border-hairline)',
            fontSize: '0.78rem',
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>Dual-Approval Requirement:</strong> Recommendations involving asset allocation adjustments &gt; 5.0% or transaction volumes &gt; $100,000 strictly mandate Risk Officer review prior to simulated order routing.
          </div>
        </div>
      </section>
    </div>
  );
};
