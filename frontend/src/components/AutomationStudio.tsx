import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Play, 
  Clock, 
  Cpu, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  BarChart3, 
  TrendingUp,
  Workflow,
  Sparkles,
  RefreshCw,
  Mail,
  FileSpreadsheet
} from 'lucide-react';
import { UserRole, ProcessAnalysisResult } from '../types';
import { api } from '../api';
import { formatIST } from '../utils/formatters';

interface AutomationStudioProps {
  currentRole: UserRole;
  onRefreshStats: () => void;
}

export const AutomationStudio: React.FC<AutomationStudioProps> = ({
  currentRole,
  onRefreshStats,
}) => {
  const [isTriggering, setIsTriggering] = useState(false);
  const [monitorResult, setMonitorResult] = useState<any | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ProcessAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Pre-load default process analysis
    const loadDefaultAnalysis = async () => {
      setIsAnalyzing(true);
      try {
        const res = await api.analyzeProcess(currentRole);
        setAnalysisResult(res);
      } catch (err) {
        console.error('Failed to load process analysis', err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    loadDefaultAnalysis();
  }, [currentRole]);

  const handleTriggerDailyMonitor = async () => {
    setIsTriggering(true);
    try {
      const res = await api.triggerDailyMonitor(currentRole);
      setMonitorResult(res);
      onRefreshStats();
    } catch (err) {
      console.error('Daily monitor trigger failed', err);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
          <Workflow size={22} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Scheduled Automation & Process Improvement Studio
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          Demonstrates UBS Operating Model capabilities: automated scheduled triggers (via n8n and Microsoft Power Automate custom connectors) and an operations process analyzer that identifies manual tasks and calculates automation savings.
        </p>
      </div>

      {/* Part 1: Scheduled Exception Monitor (n8n / Power Automate Simulation) */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                Scheduled Portfolio Exception Monitor (08:00 AM Cron)
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Simulates automated recurrence trigger from <strong>n8n</strong> or <strong>Microsoft Power Automate</strong> calling WealthOps REST API.
            </p>
          </div>

          <button
            onClick={handleTriggerDailyMonitor}
            disabled={isTriggering}
            className="btn btn-primary"
            style={{ padding: '8px 18px' }}
          >
            {isTriggering ? (
              <>
                <RefreshCw size={15} className="pulse" />
                <span>Scanning All Portfolios...</span>
              </>
            ) : (
              <>
                <Play size={15} fill="currentColor" />
                <span>Simulate 8:00 AM Trigger</span>
              </>
            )}
          </button>
        </div>

        {monitorResult ? (
          <div style={{
            marginTop: '1rem',
            padding: '1.2rem',
            borderRadius: '8px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span className="badge badge-blue">{monitorResult.trigger_source}</span>
                <span style={{ marginLeft: '10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {formatIST(monitorResult.timestamp)}
                </span>
              </div>
              <span className="badge badge-rose">
                {monitorResult.policy_breaches_detected} Policy Breaches Detected
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '1rem' }}>
              {monitorResult.exceptions?.map((exc: any, i: number) => (
                <div key={i} style={{ padding: '10px', borderRadius: '6px', background: '#0a0f1d', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#fb7185' }}>
                    <span>{exc.client_id}</span>
                    <span>+{exc.deviation_pct}% Drift</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#f8fafc', fontWeight: 600, marginTop: '2px' }}>
                    {exc.client_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {exc.asset_class}: Current {exc.current_pct}% vs Max {exc.permitted_max_pct}%
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.8rem', color: '#93c5fd', background: 'rgba(59, 130, 246, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>
              ℹ️ <strong>Outcome:</strong> {monitorResult.recommended_action}
            </div>
          </div>
        ) : (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Click &quot;Simulate 8:00 AM Trigger&quot; to execute the automated portfolio exception sweep across all 24 accounts.
          </div>
        )}
      </div>

      {/* Part 2: UBS Operating Model - Workflow Automation Opportunity Analyzer */}
      {analysisResult && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--accent-purple)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  Workflow Automation Opportunity Analyzer (UBS Operating Model)
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Evaluates multi-step manual operations processes, matches them to agentic patterns, and estimates manual cycle reduction.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ textAlign: 'center', background: '#131c31', padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Automatable</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>
                  {analysisResult.automatable_steps} / {analysisResult.total_manual_steps} ({analysisResult.automation_percentage}%)
                </div>
              </div>
              <div style={{ textAlign: 'center', background: '#131c31', padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Est. Annual Savings</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa' }}>
                  {analysisResult.estimated_annual_hours_saved} Hours
                </div>
              </div>
            </div>
          </div>

          {/* Steps Breakdown Table */}
          <div style={{ overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Step</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Original Manual Task</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', textAlign: 'center' }}>Feasibility</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Automation Pattern</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Target Technology</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', textAlign: 'right' }}>Time Saved</th>
                </tr>
              </thead>
              <tbody>
                {analysisResult.steps_breakdown.map((s) => (
                  <tr key={s.step_number} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#60a5fa' }}>
                      #{s.step_number}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#f8fafc', fontWeight: 500 }}>
                      {s.original_step}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span className={`badge ${s.automatable ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                        {s.automatable ? 'AUTOMATABLE' : 'HUMAN GATE'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                      {s.solution_pattern}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#93c5fd' }}>
                      {s.target_technology}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#34d399' }}>
                      +{s.manual_minutes_saved} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            🛡️ <strong>Governance Note:</strong> {analysisResult.governance_advisory}
          </div>
        </div>
      )}
    </div>
  );
};
