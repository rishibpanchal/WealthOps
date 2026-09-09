import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  PieChart, 
  TrendingUp, 
  ShieldCheck, 
  X,
  ArrowRight,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { UserRole, ClientSummary, ClientDetail } from '../types';
import { api } from '../api';

interface PortfolioExplorerProps {
  currentRole: UserRole;
  onSelectClientForAgent: (clientId: string) => void;
}

export const PortfolioExplorer: React.FC<PortfolioExplorerProps> = ({
  currentRole,
  onSelectClientForAgent,
}) => {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BREACH' | 'COMPLIANT'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientDetail, setClientDetail] = useState<ClientDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

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

  const loadClientDetail = async (id: string) => {
    setSelectedClientId(id);
    setIsDetailLoading(true);
    try {
      const data = await api.getClientDetail(id, currentRole);
      setClientDetail(data);
    } catch (err) {
      console.error(`Failed to load detail for ${id}`, err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch = 
      c.id.toLowerCase().includes(search.toLowerCase()) || 
      c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = 
      statusFilter === 'ALL' ? true : c.policy_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Filter Bar */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--accent-blue)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Client Account Universe</h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Total active accounts monitored against documented Investment Policy Statement (IPS) tolerances.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {(['ALL', 'BREACH', 'COMPLIANT'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                {s}
              </button>
            ))}
            <button onClick={loadClients} className="btn btn-secondary" style={{ padding: '6px 10px' }}>
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client ID (e.g. C1024, C1098) or account name..."
            className="input-field"
            style={{ paddingLeft: '38px' }}
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Client ID</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Account Name</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Risk Tier</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>AUM (USD)</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Equity Alloc %</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>IPS Status</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading portfolios...
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No accounts found matching filter.
                </td>
              </tr>
            ) : (
              filteredClients.map((c) => {
                const isBreach = c.policy_status === 'BREACH';
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => loadClientDetail(c.id)}
                    className="portfolio-row"
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#60a5fa' }}>
                      {c.id}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f8fafc' }}>
                      {c.name}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${
                        c.risk_tolerance === 'Conservative' ? 'badge-blue' :
                        c.risk_tolerance === 'Moderate' ? 'badge-amber' : 'badge-purple'
                      }`} style={{ fontSize: '0.7rem' }}>
                        {c.risk_tolerance}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#f8fafc' }}>
                      ${c.aum.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: isBreach ? '#fb7185' : '#34d399' }}>
                      {c.equity_pct}%
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span className={`badge ${isBreach ? 'badge-rose' : 'badge-emerald'}`}>
                        {isBreach ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                        {isBreach ? `BREACH (${c.breach_count})` : 'COMPLIANT'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClientForAgent(c.id);
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        title="Analyze with Agent"
                      >
                        Analyze <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Client Detail Slide-over / Modal */}
      {selectedClientId && clientDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '540px',
          background: '#0a0f1d',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.7)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: '#1e293b',
                padding: '6px 10px',
                borderRadius: '6px',
                fontWeight: 800,
                color: '#60a5fa',
              }}>
                {clientDetail.client.id}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{clientDetail.client.name}</h3>
            </div>
            <button
              onClick={() => setSelectedClientId(null)}
              className="btn btn-secondary"
              style={{ padding: '6px' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '1.5rem' }}>
            <div style={{ background: '#131c31', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Portfolio Value</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                ${clientDetail.portfolio.total_value.toLocaleString()}
              </div>
            </div>
            <div style={{ background: '#131c31', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>1-Day 95% VaR</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fb7185' }}>
                {clientDetail.risk_metrics.var_pct_1d}%
              </div>
            </div>
            <div style={{ background: '#131c31', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sharpe Ratio</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>
                {clientDetail.risk_metrics.sharpe_ratio}
              </div>
            </div>
          </div>

          {/* IPS Limits Check */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Investment Policy Statement (IPS) Parameters:
            </h4>
            <div style={{
              background: '#131c31',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <div style={{ fontWeight: 600, color: '#38bdf8' }}>{clientDetail.policy.policy_name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Equities Limit:</span>
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                  {clientDetail.policy.min_equity_pct}% - {clientDetail.policy.max_equity_pct}% (Target {clientDetail.policy.target_equity_pct}%)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Fixed Income Limit:</span>
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                  {clientDetail.policy.min_fixed_income_pct}% - {clientDetail.policy.max_fixed_income_pct}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Fiduciary Status:</span>
                <span className={`badge ${clientDetail.policy.status === 'BREACH' ? 'badge-rose' : 'badge-emerald'}`}>
                  {clientDetail.policy.status}
                </span>
              </div>
            </div>
          </div>

          {/* Holdings Breakdown */}
          <div style={{ flex: 1, marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Current Portfolio Holdings:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {clientDetail.portfolio.holdings.map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#131c31',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{h.ticker}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{h.asset_class}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>${h.market_value.toLocaleString()}</div>
                    <div style={{ fontSize: '0.72rem', color: '#60a5fa' }}>{h.weight_pct}% weight</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                onSelectClientForAgent(clientDetail.client.id);
                setSelectedClientId(null);
              }}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              Analyze in Operations Console <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
