import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  DollarSign, 
  TrendingDown, 
  ArrowRight,
  UserCheck,
  RefreshCw,
  Lock
} from 'lucide-react';
import { UserRole, ApprovalItem } from '../types';
import { api, USER_PROFILES } from '../api';

interface ApprovalQueueProps {
  currentRole: UserRole;
  onRefreshStats: () => void;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  currentRole,
  onRefreshStats,
}) => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [filter, setFilter] = useState<string>('PENDING');
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const profile = USER_PROFILES[currentRole];
  const canApprove = profile.canApprove; // Only RISK_OFFICER and ADMIN

  const loadApprovals = async () => {
    setIsLoading(true);
    try {
      const data = await api.getApprovals(currentRole, filter === 'ALL' ? undefined : filter);
      setApprovals(data);
    } catch (err) {
      console.error('Failed to load approvals', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, [filter, currentRole]);

  const handleApprove = async (id: string) => {
    if (!canApprove) return;
    setResolvingId(id);
    setActionMessage(null);
    try {
      const res = await api.approveTicket(id, currentRole, 'Authorized by Chief Risk Officer. Policy checks verified.');
      setActionMessage(`Ticket ${id} approved successfully! Audit record updated.`);
      await loadApprovals();
      onRefreshStats();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setResolvingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!canApprove) return;
    setResolvingId(id);
    setActionMessage(null);
    try {
      await api.rejectTicket(id, currentRole, 'Market conditions require postponement of rebalancing.');
      setActionMessage(`Ticket ${id} rejected.`);
      await loadApprovals();
      onRefreshStats();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: 'rgba(245, 158, 11, 0.15)',
                padding: '8px',
                borderRadius: '8px',
                color: 'var(--accent-amber)',
              }}>
                <ShieldAlert size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  Human-in-the-Loop (HITL) Dual-Approval Queue
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Per Fiduciary Governance Policy SOP-WM-402, operations exceeding $100k or involving &gt; 5.0% asset class drift require Risk Officer authorization.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                {f}
              </button>
            ))}
            <button
              onClick={loadApprovals}
              className="btn btn-secondary"
              style={{ padding: '6px 10px' }}
              title="Refresh queue"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Role permission alert */}
        {!canApprove && (
          <div style={{
            marginTop: '1.2rem',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.82rem',
            color: '#fbbf24',
          }}>
            <Lock size={16} />
            <span>
              You are currently logged in as <strong>{currentRole}</strong> (Read-only on approval queue). 
              To test approving or rejecting tickets, switch your persona in the top right to <strong>Risk Officer (Elena Rostova)</strong> or <strong>Admin</strong>.
            </span>
          </div>
        )}

        {actionMessage && (
          <div style={{
            marginTop: '1.2rem',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <CheckCircle size={16} />
            <span>{actionMessage}</span>
          </div>
        )}
      </div>

      {/* Approvals List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="pulse" style={{ margin: '0 auto 10px' }} />
            <div>Loading approval queue...</div>
          </div>
        ) : approvals.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 10px' }} />
            <h3 style={{ fontSize: '1rem', color: '#f1f5f9', marginBottom: '4px' }}>No Tickets Matching Filter</h3>
            <p style={{ fontSize: '0.85rem' }}>No pending rebalance recommendations in the selected category.</p>
          </div>
        ) : (
          approvals.map((ticket) => {
            const isPending = ticket.status === 'PENDING';
            const isApproved = ticket.status === 'APPROVED';
            const isRejected = ticket.status === 'REJECTED';
            const payload = ticket.proposed_payload || {};
            const adjustments = payload.target_adjustments || payload.recommendations || [];

            return (
              <div key={ticket.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      background: '#1e293b',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      color: '#60a5fa',
                      fontSize: '0.9rem',
                    }}>
                      {ticket.client_id}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                          {ticket.action_type.replace(/_/g, ' ')}
                        </h3>
                        <span className={`badge ${
                          ticket.risk_level === 'HIGH' ? 'badge-rose' : 'badge-amber'
                        }`}>
                          {ticket.risk_level} RISK
                        </span>
                        <span className={`badge ${
                          isPending ? 'badge-amber' : isApproved ? 'badge-emerald' : 'badge-rose'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Ticket ID: `{ticket.id}` | Requested by: {ticket.requested_by_role} ({ticket.requested_by_user_id}) | {new Date(ticket.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Order Value</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                      ${ticket.estimated_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                  color: '#e2e8f0',
                  marginBottom: '1rem',
                  lineHeight: '1.5',
                }}>
                  <strong>Breach Justification:</strong> {ticket.reason}
                </div>

                {/* Proposed Rebalancing Adjustments */}
                {adjustments.length > 0 && (
                  <div style={{ marginBottom: '1.2rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Proposed Trade Allocations:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                      {adjustments.map((adj: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            background: '#0a0f1d',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.78rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span style={{ color: adj.action?.includes('SELL') || adj.action?.includes('TRIM') ? '#fb7185' : '#34d399' }}>
                              {adj.action}
                            </span>
                            <span>{adj.ticker || adj.asset_class}</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', marginTop: '3px' }}>
                            ${(adj.amount_usd || adj.estimated_amount_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            {adj.adjustment_pct && ` (Δ ${adj.adjustment_pct}%)`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution Footer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {ticket.policy_reference && (
                      <span>Governing Standard: <strong>{ticket.policy_reference}</strong></span>
                    )}
                    {ticket.resolved_at && (
                      <span style={{ marginLeft: '12px' }}>
                        Resolved by: {ticket.resolved_by_role} on {new Date(ticket.resolved_at).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {isPending && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => handleReject(ticket.id)}
                        disabled={!canApprove || resolvingId === ticket.id}
                        className="btn btn-danger"
                        style={{ fontSize: '0.8rem' }}
                      >
                        <XCircle size={15} /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(ticket.id)}
                        disabled={!canApprove || resolvingId === ticket.id}
                        className="btn btn-success"
                        style={{ fontSize: '0.8rem' }}
                      >
                        <CheckCircle size={15} /> Approve & Authorize
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
