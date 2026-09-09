import React, { useState, useEffect } from 'react';
import { UserRole, ApprovalItem } from '../types';
import { api, USER_PROFILES } from '../api';
import { formatINR, formatIST } from '../utils/formatters';

interface InstitutionalApprovalsProps {
  currentRole: UserRole;
  onRefreshStats: () => void;
}

export const InstitutionalApprovals: React.FC<InstitutionalApprovalsProps> = ({
  currentRole,
  onRefreshStats,
}) => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [resolutionNotice, setResolutionNotice] = useState<string | null>(null);

  const profile = USER_PROFILES[currentRole];
  const canAuthorize = profile.canApprove; // Strictly RISK_OFFICER and ADMIN

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

  const handleAuthorize = async (id: string) => {
    if (!canAuthorize) return;
    setActiveTicketId(id);
    setResolutionNotice(null);
    try {
      await api.approveTicket(id, currentRole, 'Authorized by Chief Risk Officer per SOP-WM-402 dual control.');
      setResolutionNotice(`Ticket ${id} approved. Fiduciary authorization logged to immutable audit ledger.`);
      await loadApprovals();
      onRefreshStats();
    } catch (err: any) {
      setResolutionNotice(`Error: ${err.message}`);
    } finally {
      setActiveTicketId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!canAuthorize) return;
    setActiveTicketId(id);
    setResolutionNotice(null);
    try {
      await api.rejectTicket(id, currentRole, 'Proposed rebalance postponed due to tactical liquidity allocation.');
      setResolutionNotice(`Ticket ${id} rejected.`);
      await loadApprovals();
      onRefreshStats();
    } catch (err: any) {
      setResolutionNotice(`Error: ${err.message}`);
    } finally {
      setActiveTicketId(null);
    }
  };

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
              Fiduciary Controls & Dual Authorization
            </div>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.2rem',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}>
              Operations Approval Center
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Human oversight queue for sensitive portfolio rebalancing orders and fiduciary policy breaches.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`btn-institutional ${filter === f ? 'btn-institutional-primary' : 'btn-institutional-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '5px 12px' }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Role Authority Indicator */}
      {!canAuthorize && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '4px',
          background: 'var(--semantic-amber-bg)',
          border: '1px solid #EAD8C1',
          fontSize: '0.8rem',
          color: 'var(--semantic-amber)',
          marginBottom: '24px',
        }}>
          <strong>Dual-Authorization Restriction:</strong> You are viewing as <strong>{currentRole}</strong> (Inquiry only).
          Sign-off authority is strictly restricted to <strong>Risk Officer (Elena Rostova)</strong> or <strong>Platform Admin</strong> under Dual-Approval Governance Policy (v1.8).
        </div>
      )}

      {resolutionNotice && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '4px',
          background: 'var(--semantic-green-bg)',
          border: '1px solid #CFE2D6',
          fontSize: '0.8rem',
          color: 'var(--semantic-green)',
          marginBottom: '24px',
        }}>
          {resolutionNotice}
        </div>
      )}

      {/* Approvals List */}
      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading approval ledger...
        </div>
      ) : approvals.length === 0 ? (
        <div style={{
          padding: '60px 0',
          textAlign: 'center',
          border: '1px solid var(--border-hairline)',
          borderRadius: '4px',
          background: 'var(--bg-surface)',
        }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-primary)' }}>
            No approvals waiting.
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Your operations queue is currently clear of pending portfolio exception reviews.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {approvals.map((ticket) => {
            const isPending = ticket.status === 'PENDING';
            const isApproved = ticket.status === 'APPROVED';
            const payload = ticket.proposed_payload || {};
            const adjustments = payload.target_adjustments || payload.recommendations || [];

            return (
              <div
                key={ticket.id}
                style={{
                  border: '1px solid var(--border-hairline)',
                  borderRadius: '4px',
                  background: 'var(--bg-surface)',
                  padding: '24px 32px',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.92rem', color: 'var(--accent-bronze)' }}>
                        {ticket.client_id}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {ticket.action_type.replace(/_/g, ' ')}
                      </span>
                      <span className={`status-pill ${
                        ticket.risk_level === 'HIGH' ? 'status-pill-crimson' : 'status-pill-amber'
                      }`}>
                        {ticket.risk_level} RISK
                      </span>
                      <span className={`status-pill ${
                        isPending ? 'status-pill-amber' : isApproved ? 'status-pill-green' : 'status-pill-crimson'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Ticket ID: {ticket.id} · Requested by {ticket.requested_by_role} ({ticket.requested_by_user_id}) · {formatIST(ticket.created_at)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Estimated Order Volume
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.6rem',
                      color: 'var(--text-primary)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {formatINR(ticket.estimated_value, { decimals: 2 })}
                    </div>
                  </div>
                </div>

                {/* Justification statement */}
                <div style={{
                  padding: '14px 18px',
                  background: 'var(--bg-surface-subdued)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: '3px',
                  fontSize: '0.84rem',
                  lineHeight: 1.5,
                  color: 'var(--text-primary)',
                  marginBottom: '20px',
                }}>
                  <strong style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.72rem', display: 'block', marginBottom: '4px' }}>
                    Trigger Condition & Breach Justification
                  </strong>
                  {ticket.reason}
                </div>

                {/* Proposed Adjustments Table */}
                {adjustments.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Proposed Trade Schedule
                    </div>

                    <div style={{ overflow: 'hidden', border: '1px solid var(--border-hairline)', borderRadius: '3px' }}>
                      <table className="institutional-table">
                        <thead>
                          <tr>
                            <th>Action</th>
                            <th>Security / Asset Class</th>
                            <th style={{ textAlign: 'right' }}>Current Allocation</th>
                            <th style={{ textAlign: 'right' }}>Target Allocation</th>
                            <th style={{ textAlign: 'right' }}>Order Amount (INR)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adjustments.map((adj: any, i: number) => {
                            const isSell = adj.action?.includes('SELL') || adj.action?.includes('TRIM');
                            return (
                              <tr key={i}>
                                <td style={{ fontWeight: 600, color: isSell ? 'var(--semantic-crimson)' : 'var(--semantic-green)' }}>
                                  {adj.action}
                                </td>
                                <td style={{ fontWeight: 500 }}>
                                  {adj.ticker || adj.asset_class}
                                </td>
                                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                  {adj.current_pct ? `${adj.current_pct}%` : '—'}
                                </td>
                                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                  {adj.target_pct ? `${adj.target_pct}%` : '—'}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                                  {formatINR(adj.amount_usd || adj.estimated_amount_usd || 0, { decimals: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer and authorization buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-hairline)',
                  paddingTop: '16px',
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Governing Policy: <strong>{ticket.policy_reference || 'SOP-WM-402 Dual-Control'}</strong>
                    {ticket.resolved_at && (
                      <span style={{ marginLeft: '12px' }}>
                        · Resolved by {ticket.resolved_by_role} on {new Date(ticket.resolved_at).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {isPending && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleReject(ticket.id)}
                        disabled={!canAuthorize || activeTicketId === ticket.id}
                        className="btn-institutional btn-institutional-secondary"
                        style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAuthorize(ticket.id)}
                        disabled={!canAuthorize || activeTicketId === ticket.id}
                        className="btn-institutional btn-institutional-primary"
                        style={{ padding: '6px 20px', fontSize: '0.8rem' }}
                      >
                        {activeTicketId === ticket.id ? 'Signing...' : 'Approve & Authorize'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
