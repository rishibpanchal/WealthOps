import React, { useState, useEffect } from 'react';
import { UserRole, ClientSummary, ClientDetail } from '../types';
import { api } from '../api';

interface InstitutionalClientsProps {
  currentRole: UserRole;
  onDispatchClientQuery: (clientId: string) => void;
}

export const InstitutionalClients: React.FC<InstitutionalClientsProps> = ({
  currentRole,
  onDispatchClientQuery,
}) => {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BREACH' | 'COMPLIANT'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientDetail, setClientDetail] = useState<ClientDetail | null>(null);
  const [activeDossierTab, setActiveDossierTab] = useState<'PORTFOLIO' | 'RISK' | 'POLICY' | 'HOLDINGS'>('PORTFOLIO');

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients(currentRole);
      setClients(data);
    } catch (err) {
      console.error('Failed to load clients', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [currentRole]);

  const loadClientDossier = async (id: string) => {
    setSelectedClientId(id);
    try {
      const detail = await api.getClientDetail(id, currentRole);
      setClientDetail(detail);
    } catch (err) {
      console.error(`Failed to load detail for ${id}`, err);
    }
  };

  const filtered = clients.filter((c) => {
    const matchesSearch = c.id.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' ? true : c.policy_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
              Private Wealth Mandates
            </div>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.2rem',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}>
              Client Account Universe
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Discretionary investment relationships under active fiduciary monitoring and continuous policy inspection.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {(['ALL', 'BREACH', 'COMPLIANT'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`btn-institutional ${statusFilter === s ? 'btn-institutional-primary' : 'btn-institutional-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '5px 12px' }}
              >
                {s === 'BREACH' ? 'Exceptions' : s === 'COMPLIANT' ? 'Compliant' : 'All Accounts'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Search Input */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by account identifier (e.g. C1024) or client name..."
          style={{
            width: '100%',
            maxWidth: '480px',
            padding: '10px 14px',
            fontSize: '0.85rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-muted)',
            borderRadius: '4px',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
      </div>

      {/* Institutional Table */}
      <div style={{
        border: '1px solid var(--border-hairline)',
        borderRadius: '4px',
        background: 'var(--bg-surface)',
        overflow: 'hidden',
      }}>
        <table className="institutional-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Client Name</th>
              <th>Risk Tier</th>
              <th style={{ textAlign: 'right' }}>AUM (USD)</th>
              <th style={{ textAlign: 'right' }}>Equity Exposure</th>
              <th style={{ textAlign: 'center' }}>Fiduciary Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading account universe...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No client mandates matching criteria.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const isBreach = c.policy_status === 'BREACH';
                return (
                  <tr
                    key={c.id}
                    onClick={() => loadClientDossier(c.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-bronze)' }}>
                      {c.id}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {c.name}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>{c.email}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {c.risk_tolerance}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      ${c.aum.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </td>
                    <td style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      color: isBreach ? 'var(--semantic-crimson)' : 'var(--semantic-green)',
                    }}>
                      {c.equity_pct}%
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-pill ${isBreach ? 'status-pill-crimson' : 'status-pill-green'}`}>
                        {isBreach ? `EXCEPTION (+${c.breach_count})` : 'COMPLIANT'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDispatchClientQuery(c.id);
                        }}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--accent-bronze)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-Over Dossier for Selected Client */}
      {selectedClientId && clientDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '600px',
          background: 'var(--bg-canvas)',
          borderLeft: '1px solid var(--border-hairline)',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.08)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '32px',
        }}>
          {/* Dossier Masthead */}
          <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '18px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-bronze)' }}>
                {clientDetail.client.id} · Private Client Mandate
              </div>
              <button
                onClick={() => setSelectedClientId(null)}
                style={{ border: 'none', background: 'transparent', fontSize: '0.9rem', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 400, color: 'var(--text-primary)' }}>
              {clientDetail.client.name}
            </h2>

            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <span>AUM: <strong style={{ color: 'var(--text-primary)' }}>${clientDetail.client.aum.toLocaleString()}</strong></span>
              <span>Risk Tier: <strong style={{ color: 'var(--text-primary)' }}>{clientDetail.client.risk_tolerance}</strong></span>
              <span>
                IPS Status:{' '}
                <span className={`status-pill ${clientDetail.policy.status === 'BREACH' ? 'status-pill-crimson' : 'status-pill-green'}`} style={{ fontSize: '0.65rem' }}>
                  {clientDetail.policy.status}
                </span>
              </span>
            </div>
          </div>

          {/* Dossier Tab Controls */}
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '12px', marginBottom: '24px' }}>
            {(['PORTFOLIO', 'RISK', 'POLICY', 'HOLDINGS'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveDossierTab(tab)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '4px 0',
                  fontSize: '0.78rem',
                  fontWeight: activeDossierTab === tab ? 600 : 400,
                  color: activeDossierTab === tab ? 'var(--accent-bronze)' : 'var(--text-secondary)',
                  borderBottom: activeDossierTab === tab ? '2px solid var(--accent-bronze)' : '2px solid transparent',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab 1: Portfolio Breakdown */}
          {activeDossierTab === 'PORTFOLIO' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Market Value</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-primary)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                    ${clientDetail.portfolio.total_value.toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: '16px', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Cash</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-primary)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                    ${clientDetail.portfolio.cash_balance.toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Asset Class Exposure
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {clientDetail.policy.breaches?.length > 0 && (
                    <div style={{ padding: '10px 14px', borderRadius: '3px', background: 'var(--semantic-crimson-bg)', border: '1px solid #E5CECE', fontSize: '0.8rem', color: 'var(--semantic-crimson)' }}>
                      Policy Breach: Current equity exceeds maximum documented IPS ceiling.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Quantitative Risk */}
          {activeDossierTab === 'RISK' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>1-Day 95% Parametric VaR</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--semantic-crimson)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                  {clientDetail.risk_metrics.var_pct_1d}% (${clientDetail.risk_metrics.var_amount_usd.toLocaleString()})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Calculated using asset class covariance and 252-day annualized historical volatility.
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Annualized Sharpe Ratio</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--text-primary)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                  {clientDetail.risk_metrics.sharpe_ratio} ({clientDetail.risk_metrics.sharpe_rating})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Benchmarked against 4.5% risk-free rate proxy.
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: IPS Policy */}
          {activeDossierTab === 'POLICY' && (
            <div style={{ padding: '16px', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', fontSize: '0.84rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {clientDetail.policy.policy_name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-hairline)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Permitted Equities:</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {clientDetail.policy.min_equity_pct}% – {clientDetail.policy.max_equity_pct}% (Target {clientDetail.policy.target_equity_pct}%)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-hairline)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Permitted Fixed Income:</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {clientDetail.policy.min_fixed_income_pct}% – {clientDetail.policy.max_fixed_income_pct}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Fiduciary Status:</span>
                <span className={`status-pill ${clientDetail.policy.status === 'BREACH' ? 'status-pill-crimson' : 'status-pill-green'}`}>
                  {clientDetail.policy.status}
                </span>
              </div>
            </div>
          )}

          {/* Tab 4: Holdings */}
          {activeDossierTab === 'HOLDINGS' && (
            <div style={{ overflow: 'hidden', border: '1px solid var(--border-hairline)', borderRadius: '3px' }}>
              <table className="institutional-table">
                <thead>
                  <tr>
                    <th>Security</th>
                    <th>Asset Class</th>
                    <th style={{ textAlign: 'right' }}>Market Value</th>
                    <th style={{ textAlign: 'right' }}>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {clientDetail.portfolio.holdings.map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{h.ticker}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{h.asset_class}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${h.market_value.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{h.weight_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom Action */}
          <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
            <button
              onClick={() => {
                onDispatchClientQuery(clientDetail.client.id);
                setSelectedClientId(null);
              }}
              className="btn-institutional btn-institutional-primary"
              style={{ width: '100%' }}
            >
              Dispatch Rebalance Recommendation for {clientDetail.client.id} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
