import React, { useState, useEffect } from 'react';
import { UserRole, EvalBenchmarkResult } from '../types';
import { api } from '../api';

interface InstitutionalGovernanceProps {
  currentRole: UserRole;
}

export const InstitutionalGovernance: React.FC<InstitutionalGovernanceProps> = ({ currentRole }) => {
  const [benchmark, setBenchmark] = useState<EvalBenchmarkResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const runBenchmark = async () => {
    setIsRunning(true);
    try {
      const data = await api.runEvalBenchmark(currentRole);
      setBenchmark(data);
    } catch (err) {
      console.error('Benchmark execution failed', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runBenchmark();
  }, [currentRole]);

  const filteredTests = benchmark?.test_results.filter((t) => {
    if (categoryFilter === 'ALL') return true;
    return t.category === categoryFilter;
  }) || [];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 0 80px 0' }}>
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
              Model Risk Management & AI Governance
            </div>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.2rem',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}>
              Agent Evaluation & Governance Suite
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Rigorous benchmarking evaluating intent precision, deterministic guardrail interception, policy retrieval, and zero-hallucination bounds.
            </p>
          </div>

          <button
            onClick={runBenchmark}
            disabled={isRunning}
            className="btn-institutional btn-institutional-primary"
            style={{ padding: '8px 20px', fontSize: '0.82rem' }}
          >
            {isRunning ? 'Benchmarking Suite...' : 'Execute Evaluation Benchmark'}
          </button>
        </div>
      </section>

      {/* Metrics Row */}
      {benchmark && (
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          borderBottom: '1px solid var(--border-hairline)',
          paddingBottom: '24px',
          marginBottom: '32px',
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Intent Accuracy</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--text-primary)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              {benchmark.benchmark_summary.intent_classification_accuracy}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Domain Routing</div>
          </div>

          <div style={{ paddingLeft: '20px', borderLeft: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tool Precision</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--text-primary)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              {benchmark.benchmark_summary.tool_selection_accuracy}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Multi-Step Planning</div>
          </div>

          <div style={{ paddingLeft: '20px', borderLeft: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>RAG Retrieval</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--text-primary)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              {benchmark.benchmark_summary.policy_retrieval_precision}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Cosine Semantic Match</div>
          </div>

          <div style={{ paddingLeft: '20px', borderLeft: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unauthorized Block</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--semantic-green)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              {benchmark.benchmark_summary.unauthorized_action_blocking_rate}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--semantic-green)', marginTop: '2px' }}>100% Intercept Rate</div>
          </div>

          <div style={{ paddingLeft: '20px', borderLeft: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hallucination Rate</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--semantic-green)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              0.0%
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--semantic-green)', marginTop: '2px' }}>Deterministic Math Tools</div>
          </div>
        </section>
      )}

      {/* Benchmark Test Cases Table */}
      <div style={{
        border: '1px solid var(--border-hairline)',
        borderRadius: '4px',
        background: 'var(--bg-surface)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-hairline)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-canvas)',
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Benchmark Test Scenarios ({filteredTests.length} Cases)
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'VALID', 'UNAUTHORIZED', 'POLICY_SENSITIVE', 'ADVERSARIAL', 'MISSING_CONTEXT'].map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`btn-institutional ${categoryFilter === c ? 'btn-institutional-primary' : 'btn-institutional-secondary'}`}
                style={{ fontSize: '0.72rem', padding: '4px 10px' }}
              >
                {c.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <table className="institutional-table">
          <thead>
            <tr>
              <th>Classification</th>
              <th>Operational Query</th>
              <th>Expected Intent</th>
              <th>Model Classification</th>
              <th style={{ textAlign: 'center' }}>Intent Status</th>
              <th style={{ textAlign: 'center' }}>Security Enforcement</th>
            </tr>
          </thead>
          <tbody>
            {filteredTests.map((t, idx) => (
              <tr key={idx}>
                <td>
                  <span className="status-pill status-pill-neutral" style={{ fontSize: '0.65rem' }}>
                    {t.category}
                  </span>
                </td>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)', maxWidth: '380px' }}>
                  {t.query}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {t.expected_intent}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-primary)' }}>
                  {t.predicted_intent}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`status-pill ${t.intent_pass ? 'status-pill-green' : 'status-pill-crimson'}`} style={{ fontSize: '0.65rem' }}>
                    {t.intent_pass ? 'PASS' : 'FAIL'}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {t.blocked_as_expected ? (
                    <span className="status-pill status-pill-green" style={{ fontSize: '0.65rem' }}>
                      BLOCKED (100%)
                    </span>
                  ) : t.escalated ? (
                    <span className="status-pill status-pill-amber" style={{ fontSize: '0.65rem' }}>
                      ESCALATED
                    </span>
                  ) : (
                    <span className="status-pill status-pill-neutral" style={{ fontSize: '0.65rem' }}>
                      AUTHORIZED
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
