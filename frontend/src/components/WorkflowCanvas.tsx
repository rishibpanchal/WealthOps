import React, { useState } from 'react';
import { AgentRunResponse } from '../types';
import { InstitutionalMarkdown } from './InstitutionalMarkdown';

interface WorkflowCanvasProps {
  currentResponse: AgentRunResponse | null;
  onNavigateToApprovals: () => void;
}

interface WorkflowNodeDef {
  id: string;
  label: string;
  stepNumber: number;
  sublabel: string;
  defaultTool?: string;
  description: string;
}

const WORKFLOW_NODES: WorkflowNodeDef[] = [
  { id: 'request', stepNumber: 1, label: 'OPERATIONAL REQUEST', sublabel: 'Inbound Input', description: 'Unstructured natural-language operational instruction' },
  { id: 'intent', stepNumber: 2, label: 'INTENT ROUTING', sublabel: 'Domain Intent', defaultTool: 'classify_intent', description: 'Determines target operational task & extracts account entity' },
  { id: 'client', stepNumber: 3, label: 'CLIENT CONTEXT', sublabel: 'KYC & Risk Tier', defaultTool: 'get_client_profile', description: 'Retrieves client suitability profile, net worth, and advisor assignment' },
  { id: 'portfolio', stepNumber: 4, label: 'PORTFOLIO ENGINE', sublabel: 'Valuation & Weights', defaultTool: 'calculate_allocation', description: 'Calculates asset class distribution and current market exposure' },
  { id: 'policy', stepNumber: 5, label: 'POLICY RAG', sublabel: 'IPS & SOP Retrieval', defaultTool: 'rag_search', description: 'Cosine vector retrieval against institutional IPS guidelines and SOP-WM-402' },
  { id: 'risk', stepNumber: 6, label: 'RISK ANALYSIS', sublabel: 'Parametric VaR & Drift', defaultTool: 'check_policy', description: 'Computes deviation from target weights, 1-day 95% VaR, and Sharpe' },
  { id: 'validation', stepNumber: 7, label: 'GUARDRAIL GATE', sublabel: 'Deterministic Limits', defaultTool: 'guardrail_check', description: 'Evaluates ₹10 Lakhs volume cap & 5.0% asset class shift rule' },
  { id: 'approval', stepNumber: 8, label: 'DUAL APPROVAL', sublabel: 'Human-in-the-Loop', defaultTool: 'request_approval', description: 'Dispatches sensitive trades to Risk Officer authorization queue' },
  { id: 'audit', stepNumber: 9, label: 'IMMUTABLE AUDIT', sublabel: 'Compliance Ledger', defaultTool: 'record_audit', description: 'Persists cryptographic checksum, parameter diffs, and decision trace' },
];

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  currentResponse,
  onNavigateToApprovals,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Extract step execution data from currentResponse
  const getStepData = (nodeId: string) => {
    if (!currentResponse) return null;
    const steps = currentResponse.steps || [];
    switch (nodeId) {
      case 'request':
        return { status: 'COMPLETED', duration_ms: 0, summary: currentResponse.query, details: { query: currentResponse.query, client: currentResponse.client_id } };
      case 'intent':
        return steps.find((s) => s.node_name === 'classify_intent') || null;
      case 'client':
      case 'portfolio':
      case 'risk':
        return steps.find((s) => s.node_name === 'execute_financial_tools') || null;
      case 'policy':
        return steps.find((s) => s.node_name === 'retrieve_policy_context') || null;
      case 'validation':
        return steps.find((s) => s.node_name === 'evaluate_guardrails') || null;
      case 'approval':
        return currentResponse.approval_required ? { status: 'WARNING', summary: `Approval required (Ticket ${currentResponse.approval_id})`, details: currentResponse.validation } : { status: 'COMPLETED', summary: 'Auto-executed (Within limits)', details: {} };
      case 'audit':
        return steps.find((s) => s.node_name === 'record_audit') || null;
      default:
        return null;
    }
  };

  const selectedNode = WORKFLOW_NODES.find((n) => n.id === selectedNodeId);
  const selectedStepData = selectedNodeId ? getStepData(selectedNodeId) : null;

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
              Operational Architecture
            </div>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.2rem',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}>
              Controlled Workflow Graph
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Deterministic state machine sequencing tool selection, RAG retrieval, fiduciary validation, and human authorization.
            </p>
          </div>

          {currentResponse && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Active Execution Trace</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {currentResponse.run_id} ({currentResponse.intent})
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Canvas & Detail Drawer Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedNode ? '7fr 5fr' : '1fr', gap: '32px' }}>
        {/* Visual Node Chain */}
        <div style={{
          background: 'var(--bg-surface-subdued)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '4px',
          padding: '32px',
        }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            marginBottom: '24px',
          }}>
            Pipeline Sequencing Matrix (Linear LangGraph State Graph)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {WORKFLOW_NODES.map((node, idx) => {
              const stepData = getStepData(node.id);
              const isSelected = selectedNodeId === node.id;
              const hasRun = !!currentResponse;
              const isWarning = stepData?.status === 'WARNING';
              const isBlocked = stepData?.status === 'BLOCKED';

              return (
                <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  {/* Node Row */}
                  <div
                    onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      background: isSelected ? 'var(--bg-canvas)' : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? 'var(--accent-bronze)' : 'var(--border-hairline)'}`,
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(0, 0, 0, 0.04)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-strong)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-hairline)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        width: '20px',
                      }}>
                        0{node.stepNumber}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                          {node.label}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {node.sublabel} {node.defaultTool ? `· tool: ${node.defaultTool}` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {hasRun && stepData ? (
                        <span className={`status-pill ${
                          isWarning ? 'status-pill-amber' :
                          isBlocked ? 'status-pill-crimson' : 'status-pill-green'
                        }`}>
                          {isWarning ? 'Escalated' : isBlocked ? 'Blocked' : 'Verified'}
                        </span>
                      ) : (
                        <span className="status-pill status-pill-neutral">Standby</span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {isSelected ? 'Close ▲' : 'Inspect ▼'}
                      </span>
                    </div>
                  </div>

                  {/* Hairline Connector Line between nodes */}
                  {idx < WORKFLOW_NODES.length - 1 && (
                    <div style={{
                      width: '1px',
                      height: '16px',
                      background: 'var(--border-muted)',
                      marginLeft: '28px',
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Inspection Drawer */}
        {selectedNode && (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '4px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    NODE SPECIFICATION · STEP 0{selectedNode.stepNumber}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {selectedNode.label}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                {selectedNode.description}
              </p>

              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Operational State:
              </div>

              {selectedStepData ? (
                <div style={{
                  background: 'var(--bg-surface-subdued)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: '4px',
                  padding: '14px',
                  fontSize: '0.78rem',
                  lineHeight: 1.5,
                  marginBottom: '20px',
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {selectedStepData.summary || 'Node processed successfully'}
                  </div>
                  {selectedStepData.duration_ms !== undefined && (
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      Execution Latency: {selectedStepData.duration_ms}ms
                    </div>
                  )}

                  {selectedStepData.details && (
                    <pre style={{
                      marginTop: '10px',
                      padding: '10px',
                      borderRadius: '3px',
                      background: 'var(--bg-canvas)',
                      border: '1px solid var(--border-hairline)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary)',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {JSON.stringify(selectedStepData.details, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <div style={{
                  padding: '14px',
                  borderRadius: '4px',
                  background: 'var(--bg-surface-subdued)',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  marginBottom: '20px',
                }}>
                  No active execution trace loaded for this node. Run an operations workflow from the Overview or dispatch bar.
                </div>
              )}
            </div>

            {selectedNode.id === 'approval' && currentResponse?.approval_required && (
              <button
                onClick={onNavigateToApprovals}
                className="btn-institutional btn-institutional-primary"
                style={{ width: '100%' }}
              >
                Go to Dual-Approval Queue →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Synthesized Fiduciary Output Box (When run completed) */}
      {currentResponse && (
        <section style={{
          marginTop: '40px',
          border: '1px solid var(--border-hairline)',
          background: 'var(--bg-surface)',
          borderRadius: '4px',
          padding: '24px 32px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              Operational Findings & Synthesized Report
            </h3>
            <span className={`status-pill ${currentResponse.approval_required ? 'status-pill-amber' : 'status-pill-green'}`}>
              {currentResponse.approval_required ? 'Dual Sign-off Required' : 'Fully Compliant'}
            </span>
          </div>

          <InstitutionalMarkdown content={currentResponse.final_response} />

          {currentResponse.approval_required && (
            <div style={{
              marginTop: '20px',
              padding: '14px 18px',
              borderRadius: '4px',
              background: 'var(--semantic-amber-bg)',
              border: '1px solid #ECD9C0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--semantic-amber)' }}>
                  Fiduciary Action Restricted to Human Authorization
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Approval Ticket ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{currentResponse.approval_id}</span>
                </div>
              </div>
              <button
                onClick={onNavigateToApprovals}
                className="btn-institutional btn-institutional-primary"
                style={{ fontSize: '0.8rem' }}
              >
                Review & Authorize
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
