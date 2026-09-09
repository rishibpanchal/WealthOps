import React, { useState } from 'react';
import { LivingFinancialVisual } from './LivingFinancialVisual';
import { AgentRunResponse } from '../types';
import { api } from '../api';

interface LandingExperienceProps {
  onEnterPlatform: () => void;
  onDispatchQuery: (query: string, clientId?: string) => void;
}

export const LandingExperience: React.FC<LandingExperienceProps> = ({
  onEnterPlatform,
  onDispatchQuery,
}) => {
  const [dispatchInput, setDispatchInput] = useState('Find clients whose equity allocation exceeds their IPS limit.');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchPhase, setDispatchPhase] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<AgentRunResponse | null>(null);

  const cyclingExamples = [
    'Find portfolios outside their equity limits.',
    'Prepare today\'s exception report for C1024.',
    'Review pending dual-approvals.',
    'Analyze 1-day 95% Parametric VaR for account C1132.',
  ];

  const handleSignatureDispatch = async () => {
    if (!dispatchInput.trim()) return;
    setIsDispatching(true);
    setDispatchResult(null);

    // Signature phase transformation sequence
    const phases = [
      'UNDERSTANDING OPERATIONAL REQUEST...',
      'IDENTIFYING CLIENT MANDATE & IPS BOUNDS...',
      'RETRIEVING INSTITUTIONAL POLICIES (RAG)...',
      'ANALYZING PORTFOLIO HOLDINGS & DRIFT...',
      'EVALUATING DETERMINISTIC GUARDRAILS...',
      'SYNTHESIZING FIDUCIARY REPORT...',
    ];

    for (let i = 0; i < phases.length; i++) {
      setDispatchPhase(phases[i]);
      await new Promise((r) => setTimeout(r, 260));
    }

    try {
      const res = await api.runAgent(dispatchInput, 'OPERATIONS_ANALYST');
      setDispatchResult(res);
    } catch (err) {
      console.error('Dispatch failed', err);
    } finally {
      setIsDispatching(false);
      setDispatchPhase(null);
    }
  };

  return (
    <div style={{ background: '#FBFBFA', color: '#121316', overflowX: 'hidden' }}>
      {/* SECTION 01 — HERO SCREEN (100vh × 100vw) */}
      <section style={{
        position: 'relative',
        height: '100vh',
        minHeight: '700px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '36px 48px',
        borderBottom: '1px solid #E4E1D9',
        overflow: 'hidden',
      }}>
        {/* Living Financial Intelligence Canvas */}
        <LivingFinancialVisual mode="hero" />

        {/* Minimal Top Masthead */}
        <header style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '32px' }}>
            <span style={{
              fontFamily: 'Newsreader, Georgia, serif',
              fontSize: '1.4rem',
              fontWeight: 500,
              letterSpacing: '0.04em',
              color: '#121316',
            }}>
              WEALTHOPS
            </span>
            <nav style={{ display: 'flex', gap: '24px', fontSize: '0.72rem', letterSpacing: '0.08em', color: '#58554F', textTransform: 'uppercase', fontWeight: 500 }}>
              <a href="#complexity" style={{ color: 'inherit', textDecoration: 'none' }}>The Complexity</a>
              <a href="#operating-layer" style={{ color: 'inherit', textDecoration: 'none' }}>One Operating Layer</a>
              <a href="#workflow" style={{ color: 'inherit', textDecoration: 'none' }}>Workflow Graph</a>
              <a href="#dispatch" style={{ color: 'inherit', textDecoration: 'none' }}>Dispatch Engine</a>
            </nav>
          </div>

          <div>
            <button
              onClick={onEnterPlatform}
              className="btn-institutional btn-institutional-primary"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.75rem',
                padding: '7px 16px',
                letterSpacing: '0.04em',
              }}
            >
              ENTER PLATFORM →
            </button>
          </div>
        </header>

        {/* Hero Composition */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '780px', marginBottom: '40px' }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            color: '#9E6B47',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            Institutional Wealth Management Automation
          </div>

          <h1 style={{
            fontFamily: 'Newsreader, Georgia, serif',
            fontSize: 'clamp(3rem, 6.5vw, 5.2rem)',
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: '#121316',
            marginBottom: '24px',
          }}>
            Wealth operations,
            <br />
            <em style={{ fontStyle: 'italic', fontWeight: 300 }}>reimagined.</em>
          </h1>

          <p style={{
            fontSize: '1.1rem',
            lineHeight: 1.6,
            color: '#58554F',
            maxWidth: '540px',
            marginBottom: '32px',
            fontWeight: 400,
          }}>
            Intelligent workflows for the operations behind modern wealth management. Controlled, policy-grounded, and auditable.
          </p>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
              onClick={onEnterPlatform}
              className="btn-institutional btn-institutional-primary"
              style={{ padding: '12px 28px', fontSize: '0.88rem' }}
            >
              Enter WealthOps →
            </button>
            <a
              href="#dispatch"
              className="btn-institutional btn-institutional-secondary"
              style={{ padding: '12px 24px', fontSize: '0.88rem', textDecoration: 'none' }}
            >
              Explore Operations Engine
            </a>
          </div>
        </div>

        {/* Hero Footer Bar */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderTop: '1px solid #E4E1D9',
          paddingTop: '16px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.72rem',
          color: '#8A867E',
        }}>
          <div>09 SEPTEMBER 2026 · SYSTEM STATUS: ONLINE</div>
          <div>DISCRETIONARY ASSETS: $24.8M MONITORED</div>
          <div>GUARDRAILS: DETERMINISTIC ENFORCEMENT</div>
        </div>
      </section>

      {/* SECTION 02 — THE COMPLEXITY */}
      <section id="complexity" style={{
        padding: '120px 48px',
        maxWidth: '1200px',
        margin: '0 auto',
        borderBottom: '1px solid #E4E1D9',
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.72rem',
          letterSpacing: '0.08em',
          color: '#8A867E',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}>
          02 · The Problem
        </div>

        <h2 style={{
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: '#121316',
          marginBottom: '32px',
          lineHeight: 1.15,
        }}>
          Modern wealth creates
          <br />
          operational complexity.
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '36px',
          fontSize: '0.95rem',
          color: '#58554F',
          lineHeight: 1.7,
        }}>
          <div style={{ borderTop: '1px solid #E4E1D9', paddingTop: '16px' }}>
            <strong style={{ color: '#121316', display: 'block', marginBottom: '6px' }}>
              Thousands of Accounts
            </strong>
            Discretionary mandates distributed across custodians, multiple currencies, and disparate asset allocations.
          </div>

          <div style={{ borderTop: '1px solid #E4E1D9', paddingTop: '16px' }}>
            <strong style={{ color: '#121316', display: 'block', marginBottom: '6px' }}>
              Custom Policy Statements
            </strong>
            Each client holds a distinct Investment Policy Statement (IPS) with strict equity ceilings and liquidity floors.
          </div>

          <div style={{ borderTop: '1px solid #E4E1D9', paddingTop: '16px' }}>
            <strong style={{ color: '#121316', display: 'block', marginBottom: '6px' }}>
              Regulatory Dual Controls
            </strong>
            Rebalancing trades and policy exceptions strictly require segregated human authorization under fiduciary duty rules.
          </div>
        </div>
      </section>

      {/* SECTION 03 — THE SYSTEM (ONE OPERATING LAYER) */}
      <section id="operating-layer" style={{
        padding: '120px 48px',
        maxWidth: '1200px',
        margin: '0 auto',
        borderBottom: '1px solid #E4E1D9',
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.72rem',
          letterSpacing: '0.08em',
          color: '#8A867E',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}>
          03 · The System
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
          <div>
            <h2 style={{
              fontFamily: 'Newsreader, Georgia, serif',
              fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: '#121316',
              marginBottom: '20px',
              lineHeight: 1.2,
            }}>
              One operating layer.
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#58554F', lineHeight: 1.7, marginBottom: '24px' }}>
              WealthOps unifies client registries, market feeds, portfolio analytics, and compliance documentation into an intelligent, auditable orchestration layer.
            </p>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.78rem',
              color: '#9E6B47',
              lineHeight: 2,
            }}>
              <div>CLIENTS · PORTFOLIOS · POLICIES</div>
              <div>MARKETS · RISK ENGINE · OPERATIONS</div>
              <div style={{ fontWeight: 700, color: '#121316', marginTop: '6px' }}>→ WEALTHOPS AGENT ORCHESTRATOR</div>
            </div>
          </div>

          <div style={{
            background: '#F5F4F0',
            border: '1px solid #E4E1D9',
            borderRadius: '4px',
            padding: '32px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.8rem',
          }}>
            <div style={{ color: '#8A867E', marginBottom: '12px' }}>// ARCHITECTURAL GUARANTEE</div>
            <div style={{ color: '#121316', lineHeight: 1.8 }}>
              &quot;We never allow the LLM to decide security or compliance policy. The model plans and proposes actions, while authorization, deterministic risk checks, and execution remain independently governed.&quot;
            </div>
            <div style={{ marginTop: '16px', color: '#9E6B47', fontSize: '0.72rem' }}>
              — Fiduciary Architecture Standard SOP-WM-402
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 04 & 05 — THE WORKFLOW GRAPH */}
      <section id="workflow" style={{
        padding: '120px 48px',
        maxWidth: '1200px',
        margin: '0 auto',
        borderBottom: '1px solid #E4E1D9',
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.72rem',
          letterSpacing: '0.08em',
          color: '#8A867E',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}>
          04 · Causal Progression
        </div>

        <h2 style={{
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: '#121316',
          marginBottom: '20px',
        }}>
          Controlled workflow sequencing.
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#58554F', maxWidth: '640px', lineHeight: 1.7, marginBottom: '40px' }}>
          Every operation transitions deterministically through 9 auditable gates.
        </p>

        {/* Minimal Horizontal Node Sequence */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '12px',
          borderTop: '1px solid #E4E1D9',
          borderBottom: '1px solid #E4E1D9',
          padding: '24px 0',
        }}>
          {[
            { step: '01', title: 'REQUEST', desc: 'Natural Language' },
            { step: '02', title: 'INTENT', desc: 'Task Routing' },
            { step: '03', title: 'CLIENT', desc: 'KYC & Profile' },
            { step: '04', title: 'PORTFOLIO', desc: 'Asset Weights' },
            { step: '05', title: 'POLICY RAG', desc: 'IPS Standards' },
            { step: '06', title: 'RISK', desc: 'Parametric VaR' },
            { step: '07', title: 'GUARDRAIL', desc: '$100k Limit' },
            { step: '08', title: 'APPROVAL', desc: 'Dual Control' },
            { step: '09', title: 'AUDIT', desc: 'Immutable Log' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '0 8px' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#9E6B47', fontWeight: 600 }}>
                {item.step}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#121316', marginTop: '2px' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#8A867E', marginTop: '2px' }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 06 & 07 — SIGNATURE DISPATCH ENGINE */}
      <section id="dispatch" style={{
        padding: '120px 48px',
        maxWidth: '1200px',
        margin: '0 auto',
        borderBottom: '1px solid #E4E1D9',
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.72rem',
          letterSpacing: '0.08em',
          color: '#8A867E',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}>
          05 · The Signature Experience
        </div>

        <h2 style={{
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: '#121316',
          marginBottom: '16px',
        }}>
          Operations Dispatch.
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#58554F', maxWidth: '640px', lineHeight: 1.7, marginBottom: '32px' }}>
          Experience the agent in action. Submit an operational query and watch the system orchestrate retrieval, policy compliance, and validation.
        </p>

        {/* Large Editorial Input Box */}
        <div style={{
          border: '1px solid #D6D2C8',
          borderRadius: '4px',
          background: '#FFFFFF',
          padding: '24px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          marginBottom: '24px',
        }}>
          <label style={{ fontSize: '0.72rem', color: '#8A867E', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            What needs attention?
          </label>
          <textarea
            value={dispatchInput}
            onChange={(e) => setDispatchInput(e.target.value)}
            rows={2}
            placeholder="Type instructions (e.g. 'Check client C1024 equity limit' or 'Find clients in breach')..."
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '1.05rem',
              fontFamily: 'Newsreader, Georgia, serif',
              color: '#121316',
              lineHeight: 1.5,
              resize: 'none',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E4E1D9', paddingTop: '16px', marginTop: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {cyclingExamples.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => setDispatchInput(ex)}
                  style={{
                    border: '1px solid #E4E1D9',
                    borderRadius: '3px',
                    background: '#F5F4F0',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    color: '#58554F',
                    cursor: 'pointer',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>

            <button
              onClick={handleSignatureDispatch}
              disabled={isDispatching || !dispatchInput.trim()}
              className="btn-institutional btn-institutional-primary"
              style={{ padding: '8px 24px', fontSize: '0.84rem' }}
            >
              {isDispatching ? 'Executing...' : 'Dispatch Workflow →'}
            </button>
          </div>
        </div>

        {/* Dynamic Phase Transformation Box */}
        {isDispatching && dispatchPhase && (
          <div style={{
            padding: '16px 20px',
            borderRadius: '4px',
            background: '#F5F4F0',
            border: '1px solid #E4E1D9',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.8rem',
            color: '#9E6B47',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#9E6B47' }} />
            <span>{dispatchPhase}</span>
          </div>
        )}

        {/* Result Reveal */}
        {dispatchResult && (
          <div style={{
            marginTop: '24px',
            padding: '24px',
            borderRadius: '4px',
            background: '#FFFFFF',
            border: '1px solid #E4E1D9',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #E4E1D9', paddingBottom: '12px', marginBottom: '16px' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#9E6B47', fontWeight: 600 }}>
                ORCHESTRATION COMPLETE · RUN #{dispatchResult.run_id.slice(-6).toUpperCase()}
              </span>
              <button
                onClick={onEnterPlatform}
                className="btn-institutional btn-institutional-primary"
                style={{ fontSize: '0.75rem', padding: '4px 12px' }}
              >
                Inspect in Command Center →
              </button>
            </div>
            <div style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#121316', whiteSpace: 'pre-line' }}>
              {dispatchResult.final_response}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 08 — EDITORIAL CLOSING & ENTER PLATFORM CTA */}
      <section style={{
        padding: '140px 48px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: '#121316',
          lineHeight: 1.15,
          marginBottom: '20px',
        }}>
          Intelligence for the
          <br />
          <em style={{ fontStyle: 'italic' }}>operations behind wealth.</em>
        </div>

        <p style={{ fontSize: '1rem', color: '#58554F', maxWidth: '480px', margin: '0 auto 36px auto', lineHeight: 1.6 }}>
          Transform manual compliance checks and portfolio reconciliations into controlled agentic execution.
        </p>

        <button
          onClick={onEnterPlatform}
          className="btn-institutional btn-institutional-primary"
          style={{
            fontSize: '1rem',
            padding: '16px 40px',
            borderRadius: '4px',
          }}
        >
          ENTER WEALTHOPS COMMAND CENTER →
        </button>
      </section>

      {/* Editorial Minimal Footer */}
      <footer style={{
        borderTop: '1px solid #E4E1D9',
        padding: '24px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontSize: '0.74rem',
        color: '#8A867E',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        <div>WEALTHOPS AGENT · VERSION 1.0 INSTITUTIONAL RELEASE</div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <span>OPERATIONS</span>
          <span>INTELLIGENCE</span>
          <span>CONTROL</span>
          <span>GOVERNANCE</span>
        </div>
      </footer>
    </div>
  );
};
