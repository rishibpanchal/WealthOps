import React, { useState } from 'react';
import { 
  Play, 
  Sparkles, 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ChevronRight, 
  FileText, 
  ArrowRight,
  Database,
  Lock,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { UserRole, AgentRunResponse, StepEvent } from '../types';
import { api, USER_PROFILES } from '../api';
import { InstitutionalMarkdown } from './InstitutionalMarkdown';

interface AgentConsoleProps {
  currentRole: UserRole;
  onNavigateToApprovals: () => void;
  onRefreshStats: () => void;
}

export const AgentConsole: React.FC<AgentConsoleProps> = ({
  currentRole,
  onNavigateToApprovals,
  onRefreshStats,
}) => {
  const [query, setQuery] = useState(
    'Find clients whose equity allocation exceeds their investment policy limit and prepare a report.'
  );
  const [clientId, setClientId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentResponse, setAgentResponse] = useState<AgentRunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const profile = USER_PROFILES[currentRole];

  const quickPrompts = [
    {
      label: 'Portfolio Exception Scan (Flagship Demo)',
      query: 'Find clients whose equity allocation exceeds their investment policy limit and prepare a report.',
      client: '',
    },
    {
      label: 'Client Risk & VaR Analysis (C1024)',
      query: 'Check whether client C1024 portfolio is outside their approved risk tolerance and prepare a recommendation.',
      client: 'C1024',
    },
    {
      label: 'Formulate Rebalance Order (C1024)',
      query: 'Prepare a rebalance recommendation for client C1024.',
      client: 'C1024',
    },
    {
      label: 'Direct Trade Order (Test Guardrail Blocking)',
      query: 'Execute market sale of 500 shares AAPL for client C1024 immediately.',
      client: 'C1024',
    },
  ];

  const handleRun = async (queryToRun?: string, clientToRun?: string) => {
    const q = queryToRun || query;
    const c = clientToRun !== undefined ? clientToRun : clientId;
    if (!q.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.runAgent(q, currentRole, c || undefined);
      setAgentResponse(res);
      onRefreshStats();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', padding: '1.5rem 0' }}>
      {/* Main Execution Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Natural Language Operations Input Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.2)',
                padding: '6px',
                borderRadius: '8px',
                color: 'var(--accent-blue)',
              }}>
                <Sparkles size={18} />
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Operations Agent Console
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Executing as:</span>
              <span className={`badge ${
                currentRole === 'RISK_OFFICER' ? 'badge-amber' : 
                currentRole === 'ADMIN' ? 'badge-purple' : 
                currentRole === 'OPERATIONS_ANALYST' ? 'badge-blue' :
                currentRole === 'ADVISOR' ? 'badge-emerald' : 'badge-rose'
              }`}>
                {currentRole}
              </span>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', lineHeight: '1.4' }}>
            Enter operational instructions. The agent plans the multi-step execution, queries the tool registry with RBAC authorization, checks institutional policies via RAG, enforces non-LLM deterministic guardrails, and routes sensitive actions to human sign-off.
          </p>

          {/* Quick Prompts */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.2rem' }}>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(p.query);
                  setClientId(p.client);
                  handleRun(p.query, p.client);
                }}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.75rem',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  background: 'rgba(15, 23, 42, 0.6)',
                }}
              >
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Input Controls */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={2}
                placeholder="Type operational request (e.g. 'Show clients exceeding IPS equity limits' or 'Analyze C1024 risk')..."
                className="input-field"
                style={{ resize: 'none', lineHeight: '1.4' }}
              />
            </div>
            <div style={{ width: '130px' }}>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value.toUpperCase())}
                placeholder="Client ID (e.g. C1024)"
                className="input-field"
                style={{ textAlign: 'center', fontWeight: 600 }}
              />
            </div>
            <button
              onClick={() => handleRun()}
              disabled={isLoading || !query.trim()}
              className="btn btn-primary"
              style={{ height: '42px', padding: '0 20px' }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="pulse" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  <span>Run Agent</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Live Workflow Stepper Card */}
        {agentResponse && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  padding: '6px',
                  borderRadius: '8px',
                  color: 'var(--accent-emerald)',
                }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                    LangGraph Orchestration Stepper
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Run ID: {agentResponse.run_id} | Intent: <span style={{ color: '#60a5fa', fontWeight: 600 }}>{agentResponse.intent}</span>
                  </div>
                </div>
              </div>

              {agentResponse.approval_required ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-rose">
                    <AlertTriangle size={12} /> SENSITIVE (APPROVAL REQUIRED)
                  </span>
                  <button
                    onClick={onNavigateToApprovals}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    View in Queue <ExternalLink size={12} />
                  </button>
                </div>
              ) : (
                <span className="badge badge-emerald">
                  <CheckCircle2 size={12} /> COMPLIANT / AUTO-EXECUTED
                </span>
              )}
            </div>

            {/* Stepper Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {agentResponse.steps.map((step) => {
                const isExpanded = expandedStep === step.step_order;
                const isWarning = step.status === 'WARNING';
                const isBlocked = step.status === 'BLOCKED' || step.status === 'FAILED';

                return (
                  <div
                    key={step.step_order}
                    style={{
                      background: isWarning 
                        ? 'rgba(245, 158, 11, 0.08)' 
                        : isBlocked 
                        ? 'rgba(244, 63, 94, 0.08)' 
                        : 'rgba(15, 23, 42, 0.6)',
                      border: `1px solid ${
                        isWarning 
                          ? 'rgba(245, 158, 11, 0.3)' 
                          : isBlocked 
                          ? 'rgba(244, 63, 94, 0.3)' 
                          : 'var(--border-subtle)'
                      }`,
                      borderRadius: '8px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => setExpandedStep(isExpanded ? null : step.step_order)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: isWarning ? '#f59e0b' : isBlocked ? '#f43f5e' : '#10b981',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}>
                          {step.step_order}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                            {step.title}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: isWarning ? '#fbbf24' : isBlocked ? '#fb7185' : 'var(--text-secondary)' }}>
                            {step.summary}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {step.duration_ms}ms
                        </span>
                        <ChevronRight
                          size={14}
                          color="#94a3b8"
                          style={{
                            transform: isExpanded ? 'rotate(90deg)' : 'none',
                            transition: 'transform 0.15s ease',
                          }}
                        />
                      </div>
                    </div>

                    {isExpanded && step.details && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        borderRadius: '6px',
                        background: '#0a0f1d',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        maxHeight: '200px',
                        overflowY: 'auto',
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#93c5fd' }}>
                          {JSON.stringify(step.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Synthesized Response Card */}
        {agentResponse && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <FileText size={18} color="var(--accent-blue)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                Operations Report & Fiduciary Output
              </h3>
            </div>

            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '6px',
              padding: '1.2rem',
            }}>
              <InstitutionalMarkdown content={agentResponse.final_response} />
            </div>

            {agentResponse.approval_required && (
              <div style={{
                marginTop: '1.2rem',
                padding: '1rem',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fb7185' }}>
                    Human Authorization Gate Active
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Ticket {agentResponse.approval_id} dispatched to Chief Risk Officer queue. Orders locked until sign-off.
                  </div>
                </div>
                <button
                  onClick={onNavigateToApprovals}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem' }}
                >
                  Go to Approval Queue <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Governance & Controls Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Fiduciary Guardrail Matrix Card */}
        <div className="glass-panel" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.8rem' }}>
            <Shield size={16} color="var(--accent-blue)" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Active Guardrail Gates</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Max Order Auto-Execution</span>
              <span style={{ fontWeight: 600, color: '#f8fafc' }}>$100,000 USD</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Asset Allocation Drift Cap</span>
              <span style={{ fontWeight: 600, color: '#f8fafc' }}>5.0%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Dual Authorization</span>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>MANDATORY FOR SENSITIVE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Direct Trade Lockout</span>
              <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>AI AGENT RESTRICTED</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Confidence Cutoff</span>
              <span style={{ fontWeight: 600, color: '#f8fafc' }}>0.85 Minimum</span>
            </div>
          </div>
        </div>

        {/* Current Role Persona Card */}
        <div className="glass-panel" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.8rem' }}>
            <Lock size={16} color="var(--accent-purple)" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>RBAC Permissions</h4>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
            {profile.description}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={13} color="#10b981" />
              <span>Query client profiles & allocations</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={13} color="#10b981" />
              <span>Calculate quantitative risk (VaR & Sharpe)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {profile.canRebalance ? (
                <CheckCircle2 size={13} color="#10b981" />
              ) : (
                <AlertTriangle size={13} color="#f43f5e" />
              )}
              <span>Formulate rebalance recommendation</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {profile.canApprove ? (
                <CheckCircle2 size={13} color="#10b981" />
              ) : (
                <AlertTriangle size={13} color="#f43f5e" />
              )}
              <span>Approve sensitive rebalancing tickets</span>
            </div>
          </div>
        </div>

        {/* Institutional Policies Referenced */}
        <div className="glass-panel" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.8rem' }}>
            <Database size={16} color="var(--accent-cyan)" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>RAG Policy Store</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
            <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, color: '#38bdf8' }}>IPS Framework Standard (v2.4)</div>
              <div style={{ color: 'var(--text-muted)' }}>Asset allocation bounds & Level 1-3 deviation triggers</div>
            </div>
            <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, color: '#38bdf8' }}>Rebalancing SOP (SOP-WM-402)</div>
              <div style={{ color: 'var(--text-muted)' }}>$100k cap & 5% drift threshold rules</div>
            </div>
            <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, color: '#38bdf8' }}>Dual-Approval Governance (v1.8)</div>
              <div style={{ color: 'var(--text-muted)' }}>Segregation of duties & AI execution restrictions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
