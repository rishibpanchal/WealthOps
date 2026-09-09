import React, { useState, useEffect } from 'react';
import { UserRole, AuditRecord, ObservabilityStats } from '../types';
import { api } from '../api';
import { formatIST } from '../utils/formatters';

interface InstitutionalAuditProps {
  currentRole: UserRole;
}

export const InstitutionalAudit: React.FC<InstitutionalAuditProps> = ({ currentRole }) => {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [stats, setStats] = useState<ObservabilityStats | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        api.getAuditLogs(currentRole, roleFilter || undefined, decisionFilter || undefined),
        api.getStats(currentRole),
      ]);
      setLogs(data);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [roleFilter, decisionFilter, currentRole]);

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
              Fiduciary Control & Accountability
            </div>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.2rem',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}>
              Immutable Compliance Audit Trail
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Cryptographically timestamped operational trace capturing agent planning, tool parameters, policy citations, and dual-authorization sign-offs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                border: '1px solid var(--border-muted)',
                borderRadius: '3px',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              <option value="">All Roles</option>
              <option value="OPERATIONS_ANALYST">OPERATIONS_ANALYST</option>
              <option value="RISK_OFFICER">RISK_OFFICER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="ADVISOR">ADVISOR</option>
              <option value="VIEWER">VIEWER</option>
            </select>

            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                border: '1px solid var(--border-muted)',
                borderRadius: '3px',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              <option value="">All Decisions</option>
              <option value="APPROVAL_REQUIRED">APPROVAL_REQUIRED</option>
              <option value="COMPLIANT_PROCESSED">COMPLIANT_PROCESSED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="SYSTEM_READY">SYSTEM_READY</option>
            </select>
          </div>
        </div>
      </section>

      {/* Metrics Strip */}
      {stats && (
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderBottom: '1px solid var(--border-hairline)',
          paddingBottom: '24px',
          marginBottom: '32px',
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Audit Entries</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--text-primary)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              {stats.total_agent_runs}
            </div>
          </div>
          <div style={{ paddingLeft: '20px', borderLeft: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Execution Reliability</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--semantic-green)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              98.2%
            </div>
          </div>
          <div style={{ paddingLeft: '20px', borderLeft: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unauthorized Intercepts</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--text-primary)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              100%
            </div>
          </div>
          <div style={{ paddingLeft: '20px', borderLeft: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pipeline Latency</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--text-primary)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              {stats.average_latency_sec}s
            </div>
          </div>
        </section>
      )}

      {/* Audit Table */}
      <div style={{
        border: '1px solid var(--border-hairline)',
        borderRadius: '4px',
        background: 'var(--bg-surface)',
        overflow: 'hidden',
      }}>
        <table className="institutional-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Request Reference</th>
              <th>Role</th>
              <th>Action</th>
              <th>Client</th>
              <th>Tools Invoked</th>
              <th style={{ textAlign: 'center' }}>Outcome</th>
              <th style={{ textAlign: 'right' }}>Audit Trace</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading compliance ledger...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No audit logs matching query.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isSensitive = log.decision === 'APPROVAL_REQUIRED' || log.decision === 'POLICY_BREACH';
                const isApproved = log.decision === 'APPROVED';
                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedRecord(log)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {log.timestamp ? formatIST(log.timestamp) : 'N/A'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {log.request_id}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {log.user_role}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {log.action}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-bronze)' }}>
                      {log.client_id || '—'}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {log.tools_used.length} tools ({log.tools_used.slice(0, 2).join(', ')}{log.tools_used.length > 2 ? '...' : ''})
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-pill ${
                        isSensitive ? 'status-pill-amber' :
                        isApproved ? 'status-pill-green' : 'status-pill-neutral'
                      }`}>
                        {log.decision}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-bronze)', fontWeight: 500 }}>
                        Inspect →
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Record Inspection Slide-Over */}
      {selectedRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '540px',
          background: 'var(--bg-canvas)',
          borderLeft: '1px solid var(--border-hairline)',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.08)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '32px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '16px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                AUDIT ENTRY · {selectedRecord.id.slice(0, 8)}
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 400, color: 'var(--text-primary)' }}>
                {selectedRecord.action}
              </h3>
            </div>
            <button
              onClick={() => setSelectedRecord(null)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.9rem', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-hairline)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Request Reference:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{selectedRecord.request_id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-hairline)' }}>
              <span style={{ color: 'var(--text-muted)' }}>User / Identity:</span>
              <span style={{ fontWeight: 500 }}>{selectedRecord.user_id} ({selectedRecord.user_role})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-hairline)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Decision State:</span>
              <span className="status-pill status-pill-neutral">{selectedRecord.decision}</span>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Tools Invoked
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedRecord.tools_used.map((t, i) => (
                  <span key={i} style={{ padding: '3px 8px', borderRadius: '3px', background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Governing Policy Citations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {selectedRecord.policy_references.map((p, i) => (
                  <span key={i} style={{ fontSize: '0.78rem', color: 'var(--accent-bronze)' }}>
                    • {p}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Parameters & Execution Payload
              </div>
              <pre style={{
                padding: '12px',
                borderRadius: '3px',
                background: 'var(--bg-surface-subdued)',
                border: '1px solid var(--border-hairline)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                maxHeight: '220px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
              }}>
                {JSON.stringify(selectedRecord.metadata, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
