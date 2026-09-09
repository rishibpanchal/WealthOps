import React, { useState } from 'react';
import { AgentRunResponse, StepEvent } from '../types';

interface AgentTimelineProps {
  currentResponse: AgentRunResponse | null;
  onNavigateToApprovals: () => void;
}

export const AgentTimeline: React.FC<AgentTimelineProps> = ({
  currentResponse,
  onNavigateToApprovals,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Fallback demo timeline items if no active run has occurred yet
  const defaultItems = [
    { time: '15:42:08', title: 'Request received', summary: 'Natural language query submitted: "Analyze portfolio C1024"', tool: 'gateway', status: 'COMPLETED', latency: '4ms' },
    { time: '15:42:08', title: 'Intent identified', summary: 'Classified intent: PORTFOLIO_RISK_ANALYSIS (Confidence 0.96)', tool: 'classify_intent', status: 'COMPLETED', latency: '18ms' },
    { time: '15:42:09', title: 'Policy retrieved', summary: 'Retrieved Investment Policy Statement (IPS-C1024) and SOP-WM-402 via RAG', tool: 'rag_search', status: 'COMPLETED', latency: '34ms' },
    { time: '15:42:10', title: 'Portfolio analyzed', summary: 'Calculated current exposure: 67.2% equity exposure ($1.91M)', tool: 'calculate_allocation', status: 'COMPLETED', latency: '22ms' },
    { time: '15:42:11', title: 'Policy exception detected', summary: 'Maximum permitted equity limit is 60.0% (+7.2% breach identified)', tool: 'check_policy', status: 'WARNING', latency: '15ms' },
    { time: '15:42:11', title: 'Recommendation formulated', summary: 'Modeled trim order schedule: Sell $105.2k AAPL, Sell $100k MSFT, Buy BND', tool: 'create_rebalance_recommendation', status: 'COMPLETED', latency: '29ms' },
    { time: '15:42:12', title: 'Human approval required', summary: 'Order volume ($205,200) exceeds $100k threshold. Dispatched ticket to Risk Officer.', tool: 'guardrail_check', status: 'WARNING', latency: '12ms' },
  ];

  const hasLiveRun = !!currentResponse && currentResponse.steps?.length > 0;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 0 80px 0' }}>
      {/* Title & Masthead */}
      <section style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '20px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}>
              Operational Execution Trace
            </div>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.2rem',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}>
              Agent Operations Timeline
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Chronological log of multi-step agent decisions, policy citations, tool executions, and fiduciary guardrails.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className="status-pill status-pill-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
              RUN #{currentResponse ? currentResponse.run_id.slice(-6).toUpperCase() : '1284'}
            </span>
          </div>
        </div>
      </section>

      {/* Vertical Timeline */}
      <div style={{ position: 'relative', paddingLeft: '32px' }}>
        {/* Continuous hairline connector line */}
        <div style={{
          position: 'absolute',
          left: '11px',
          top: '8px',
          bottom: '16px',
          width: '1px',
          background: 'var(--border-muted)',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {hasLiveRun ? (
            currentResponse.steps.map((step, idx) => {
              const isExpanded = expandedIndex === idx;
              const isWarning = step.status === 'WARNING';
              const isBlocked = step.status === 'BLOCKED';

              return (
                <div key={idx} style={{ position: 'relative' }}>
                  {/* Subtle Timeline Node Marker */}
                  <div style={{
                    position: 'absolute',
                    left: '-32px',
                    top: '4px',
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: isWarning ? 'var(--semantic-amber)' : isBlocked ? 'var(--semantic-crimson)' : 'var(--text-primary)',
                    border: '2px solid var(--bg-canvas)',
                  }} />

                  {/* Step Card */}
                  <div
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    style={{
                      border: '1px solid var(--border-hairline)',
                      background: 'var(--bg-surface)',
                      borderRadius: '4px',
                      padding: '16px 20px',
                      cursor: 'pointer',
                      transition: 'border-color 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-strong)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-hairline)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          15:42:{10 + idx}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {step.title}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-bronze)' }}>
                          [{step.node_name}]
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {step.duration_ms}ms
                        </span>
                        <span className={`status-pill ${
                          isWarning ? 'status-pill-amber' :
                          isBlocked ? 'status-pill-crimson' : 'status-pill-neutral'
                        }`} style={{ fontSize: '0.62rem' }}>
                          {step.status}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {step.summary}
                    </p>

                    {isExpanded && step.details && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        borderRadius: '3px',
                        background: 'var(--bg-surface-subdued)',
                        border: '1px solid var(--border-hairline)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        color: 'var(--text-secondary)',
                        maxHeight: '220px',
                        overflowY: 'auto',
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(step.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            defaultItems.map((item, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '-32px',
                  top: '4px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: item.status === 'WARNING' ? 'var(--semantic-amber)' : 'var(--text-primary)',
                  border: '2px solid var(--bg-canvas)',
                }} />

                <div style={{
                  border: '1px solid var(--border-hairline)',
                  background: 'var(--bg-surface)',
                  borderRadius: '4px',
                  padding: '16px 20px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.time}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {item.title}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-bronze)' }}>
                        [{item.tool}]
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {item.latency}
                      </span>
                      <span className={`status-pill ${item.status === 'WARNING' ? 'status-pill-amber' : 'status-pill-neutral'}`} style={{ fontSize: '0.62rem' }}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item.summary}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {currentResponse?.approval_required && (
        <div style={{ marginTop: '32px', textAlign: 'right' }}>
          <button
            onClick={onNavigateToApprovals}
            className="btn-institutional btn-institutional-primary"
          >
            Review Pending Approval Ticket in Queue →
          </button>
        </div>
      )}
    </div>
  );
};
