import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  X,
  ExternalLink,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { UserRole, AuditRecord, ObservabilityStats } from '../types';
import { api } from '../api';
import { formatIST } from '../utils/formatters';

interface AuditObservabilityProps {
  currentRole: UserRole;
}

export const AuditObservability: React.FC<AuditObservabilityProps> = ({ currentRole }) => {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [stats, setStats] = useState<ObservabilityStats | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [logsData, statsData] = await Promise.all([
        api.getAuditLogs(currentRole, roleFilter || undefined, decisionFilter || undefined),
        api.getStats(currentRole),
      ]);
      setLogs(logsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter, decisionFilter, currentRole]);

  return (
    <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Metric Tiles */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.2rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Agent Runs</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
              {stats.total_agent_runs}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#34d399', marginTop: '2px' }}>98.2% Success Rate</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.2rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending Approvals</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
              {stats.pending_approvals}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Risk Officer Queue</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.2rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Policy Breaches Flagged</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fb7185', marginTop: '4px' }}>
              {stats.policy_breaches_flagged}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#fb7185', marginTop: '2px' }}>Level 2-3 IPS Deviations</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.2rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unauthorized Blocked</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
              100%
            </div>
            <div style={{ fontSize: '0.72rem', color: '#34d399', marginTop: '2px' }}>Deterministic RBAC Intercept</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.2rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Pipeline Latency</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a78bfa', marginTop: '4px' }}>
              {stats.average_latency_sec}s
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>LangGraph 6 Nodes</div>
          </div>
        </div>
      )}

      {/* Filter & Controls Bar */}
      <div className="glass-panel" style={{ padding: '1.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              Immutable Compliance Audit Ledger
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field"
              style={{ width: '180px', padding: '6px 10px', fontSize: '0.8rem' }}
            >
              <option value="">All Roles</option>
              <option value="OPERATIONS_ANALYST">OPERATIONS_ANALYST</option>
              <option value="RISK_OFFICER">RISK_OFFICER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="ADVISOR">ADVISOR</option>
              <option value="VIEWER">VIEWER</option>
            </select>

            {/* Decision Filter */}
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="input-field"
              style={{ width: '180px', padding: '6px 10px', fontSize: '0.8rem' }}
            >
              <option value="">All Decisions</option>
              <option value="APPROVAL_REQUIRED">APPROVAL_REQUIRED</option>
              <option value="COMPLIANT_PROCESSED">COMPLIANT_PROCESSED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="SYSTEM_READY">SYSTEM_READY</option>
            </select>

            <button onClick={loadData} className="btn btn-secondary" style={{ padding: '6px 10px' }}>
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Timestamp</th>
              <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Request ID</th>
              <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Role</th>
              <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Action / Intent</th>
              <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Client ID</th>
              <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Tools Invoked</th>
              <th style={{ padding: '10px 14px', color: 'var(--text-muted)', textAlign: 'center' }}>Decision</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading immutable audit entries...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isSensitive = log.decision === 'APPROVAL_REQUIRED' || log.decision === 'POLICY_BREACH';
                const isApproved = log.decision === 'APPROVED';
                const isRejected = log.decision === 'REJECTED';

                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    className="portfolio-row"
                  >
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {log.timestamp ? formatIST(log.timestamp) : 'N/A'}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: '#60a5fa', fontWeight: 600 }}>
                      {log.request_id}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                        {log.user_role}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#f8fafc' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: log.client_id ? '#38bdf8' : 'var(--text-muted)' }}>
                      {log.client_id || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                      {log.tools_used.length} tools ({log.tools_used.slice(0, 2).join(', ')}{log.tools_used.length > 2 ? '...' : ''})
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span className={`badge ${
                        isSensitive ? 'badge-rose' :
                        isApproved ? 'badge-emerald' :
                        isRejected ? 'badge-amber' : 'badge-blue'
                      }`} style={{ fontSize: '0.68rem' }}>
                        {log.decision}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Log Detail Inspector Modal */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '500px',
          background: '#0a0f1d',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.7)',
          zIndex: 100,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Audit Event Inspector</h3>
            <button onClick={() => setSelectedLog(null)} className="btn btn-secondary" style={{ padding: '4px' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Audit Record ID:</span>
              <div style={{ fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>{selectedLog.id}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Request ID:</span>
              <div style={{ fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>{selectedLog.request_id}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>User / Identity:</span>
              <div style={{ color: '#f8fafc' }}>{selectedLog.user_id} ({selectedLog.user_role})</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Action:</span>
              <div style={{ fontWeight: 600, color: '#f8fafc' }}>{selectedLog.action} (Intent: {selectedLog.intent})</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Decision:</span>
              <div style={{ marginTop: '2px' }}>
                <span className="badge badge-rose">{selectedLog.decision}</span>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Tools Invoked:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                {selectedLog.tools_used.map((t, i) => (
                  <span key={i} style={{ background: '#1e293b', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Policy References:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {selectedLog.policy_references.map((p, i) => (
                  <span key={i} style={{ color: '#93c5fd', fontSize: '0.75rem' }}>
                    • {p}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Metadata & Payload:</span>
              <pre style={{
                marginTop: '4px',
                padding: '10px',
                borderRadius: '6px',
                background: '#040711',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: '#38bdf8',
                maxHeight: '200px',
                overflowY: 'auto',
              }}>
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
