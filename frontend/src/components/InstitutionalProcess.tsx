import React, { useState, useEffect } from 'react';
import { UserRole, ProcessAnalysisResult } from '../types';
import { api } from '../api';

interface InstitutionalProcessProps {
  currentRole: UserRole;
  onRefreshStats: () => void;
}

export const InstitutionalProcess: React.FC<InstitutionalProcessProps> = ({
  currentRole,
  onRefreshStats,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ProcessAnalysisResult | null>(null);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const res = await api.analyzeProcess(currentRole);
        setAnalysisResult(res);
      } catch (err) {
        console.error('Failed to load process analysis', err);
      }
    };
    loadAnalysis();
  }, [currentRole]);

  const handleExecuteScan = async () => {
    setIsScanning(true);
    try {
      const res = await api.triggerDailyMonitor(currentRole);
      setScanResult(res);
      onRefreshStats();
    } catch (err) {
      console.error('Daily monitor failed', err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 0 80px 0' }}>
      {/* Title & Masthead */}
      <section style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '20px', marginBottom: '32px' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}>
          Process Engineering & Automation Modeling
        </div>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2.2rem',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
        }}>
          Operations Automation Studio (UBS Model)
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
          Simulates scheduled batch triggers (n8n / Microsoft Power Automate) and models manual operations process improvements.
        </p>
      </section>

      {/* Section 1: Morning 08:00 AM Recurrence Sweep */}
      <section style={{
        border: '1px solid var(--border-hairline)',
        borderRadius: '4px',
        background: 'var(--bg-surface)',
        padding: '24px 32px',
        marginBottom: '40px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 400, color: 'var(--text-primary)' }}>
              Scheduled Portfolio Exception Sweep (08:00 AM EST Cron)
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Simulates automated recurrence trigger from Power Automate or n8n calling the WealthOps gateway.
            </p>
          </div>

          <button
            onClick={handleExecuteScan}
            disabled={isScanning}
            className="btn-institutional btn-institutional-primary"
            style={{ padding: '8px 18px', fontSize: '0.82rem' }}
          >
            {isScanning ? 'Evaluating Universe...' : 'Simulate 08:00 AM Trigger'}
          </button>
        </div>

        {scanResult ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Connector Source: <strong>{scanResult.trigger_source}</strong>
              </span>
              <span className="status-pill status-pill-crimson">
                {scanResult.policy_breaches_detected} Accounts Exceeding Permitted Bands
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              {scanResult.exceptions?.map((exc: any, i: number) => (
                <div key={i} style={{ padding: '12px 16px', borderRadius: '3px', background: 'var(--bg-surface-subdued)', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-bronze)', fontSize: '0.85rem' }}>
                      {exc.client_id}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--semantic-crimson)' }}>
                      +{exc.deviation_pct}% Drift
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {exc.client_name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {exc.asset_class}: Current {exc.current_pct}% vs Limit {exc.permitted_max_pct}%
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '10px 14px', background: 'var(--bg-canvas)', border: '1px solid var(--border-hairline)', borderRadius: '3px' }}>
              Fiduciary Dispatch: {scanResult.recommended_action}
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            Click &quot;Simulate 08:00 AM Trigger&quot; to execute batch analysis across the 24 active portfolios.
          </div>
        )}
      </section>

      {/* Section 2: UBS Operating Model - Process Opportunity Analyzer */}
      {analysisResult && (
        <section style={{
          border: '1px solid var(--border-hairline)',
          borderRadius: '4px',
          background: 'var(--bg-surface)',
          padding: '24px 32px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 400, color: 'var(--text-primary)' }}>
                Operations Process Opportunity Analyzer
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Decomposition of manual back-office tasks into agentic automation patterns and human-in-the-loop governance gates.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '20px', textAlign: 'right' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Manual Reduction</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--semantic-green)', fontVariantNumeric: 'tabular-nums' }}>
                  {analysisResult.automation_percentage}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Annual Hours Saved</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {analysisResult.estimated_annual_hours_saved} hrs
                </div>
              </div>
            </div>
          </div>

          <div style={{ overflow: 'hidden', border: '1px solid var(--border-hairline)', borderRadius: '3px' }}>
            <table className="institutional-table">
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Current Manual Task</th>
                  <th style={{ textAlign: 'center' }}>Feasibility</th>
                  <th>Target Technology Pattern</th>
                  <th>Target Module</th>
                  <th style={{ textAlign: 'right' }}>Cycle Savings</th>
                </tr>
              </thead>
              <tbody>
                {analysisResult.steps_breakdown.map((s) => (
                  <tr key={s.step_number}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)' }}>
                      0{s.step_number}
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {s.original_step}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-pill ${s.automatable ? 'status-pill-green' : 'status-pill-amber'}`}>
                        {s.automatable ? 'AUTOMATED' : 'HUMAN GATE'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {s.solution_pattern}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-bronze)' }}>
                      {s.target_technology}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--semantic-green)', fontVariantNumeric: 'tabular-nums' }}>
                      +{s.manual_minutes_saved} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Fiduciary Principle: {analysisResult.governance_advisory}
          </div>
        </section>
      )}
    </div>
  );
};
