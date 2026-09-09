# WealthOps System Architecture & Technical Specifications

## 1. System Overview
**WealthOps Agent** is an institutional wealth management operations automation platform designed for tier-1 financial institutions. It bridges the gap between conversational AI and compliant, auditable back-office operations.

---

## 2. End-to-End Component Architecture

```text
                               ┌──────────────────────────────────────────────┐
                               │           Client / Presentation Layer        │
                               │          React / TypeScript Dashboard        │
                               │  - Workflow Stepper & Execution Timeline     │
                               │  - RBAC Persona Switcher (5 Roles)           │
                               │  - Risk Officer Dual-Approval Queue          │
                               │  - Portfolio Universe & Breach Badges        │
                               │  - RAG Semantic Policy Explorer              │
                               │  - Automated Cron Trigger & Process Studio   │
                               │  - AI Evaluation & Governance Console        │
                               └──────────────────────┬───────────────────────┘
                                                      │ REST / JSON (Headers: X-User-Role)
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │             FastAPI Gateway API              │
                               │       - Dynamic RBAC Middleware              │
                               │       - CORS & Request Validation            │
                               │       - SSE / Async Lifecycle Hooks          │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │        LangGraph Agent Orchestrator          │
                               │                                              │
                               │  Node 1: Intent & Entity Classification      │
                               │          ↓                                   │
                               │  Node 2: Dynamic Multi-Step Planner          │
                               │          ↓                                   │
                               │  Node 3: Semantic Policy RAG Retrieval       │
                               │          ↓                                   │
                               │  Node 4: Authorized Tool Execution (RBAC)    │
                               │          ↓                                   │
                               │  Node 5: Deterministic Guardrail Evaluation  │
                               │          ↓                                   │
                               │  Node 6: Immutable Compliance Audit Ledger   │
                               │          ↓                                   │
                               │  Node 7: Grounded Response Synthesis         │
                               └──────────────┬───────────────────────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    │                                                   │
                    ▼                                                   ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐
│        Financial Tool Registry        │   │        RAG Policy Knowledge Base      │
│  - get_client_profile()               │   │  - Cosine similarity vector search    │
│  - get_portfolio()                    │   │  - Institutional IPS Standards v2.4   │
│  - get_holdings()                     │   │  - Rebalancing SOP-WM-402             │
│  - calculate_allocation()             │   │  - Dual-Approval Governance Policy    │
│  - calculate_var() (95% 1-Day)        │   │  - Quantitative Risk Oversight        │
│  - calculate_sharpe()                 │   │  - Client Suitability Fiduciary Rules │
│  - check_policy() (Breach Detection)  │   └───────────────────────────────────────┘
│  - create_rebalance_recommendation()  │
│  - request_approval()                 │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│     Deterministic Guardrail Engine    │
│  - RBAC matrix per tool and per role  │
│  - Rebalance drift cap: 5.0%          │
│  - Transaction volume cap: $100,000   │
│  - Direct market execution locked     │
│  - Missing client/policy interception │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│     Human-in-the-Loop Approval Queue  │
│  - PENDING -> APPROVED / REJECTED     │
│  - Restricted to RISK_OFFICER & ADMIN │
│  - Dual-authorization audit linkage   │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│      Persistence & Audit Storage      │
│  - SQLite (Local) / PostgreSQL        │
│  - Tables: Clients, Portfolios,       │
│    Holdings, Policies, Approvals,     │
│    AuditLogs, WorkflowRuns            │
└───────────────────────────────────────┘
```

---

## 3. RBAC Matrix & Principle of Least Privilege

| Feature / Action | VIEWER | ADVISOR | OPERATIONS_ANALYST | RISK_OFFICER | ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| Read Client Profile & AUM | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Portfolio Holdings & Weights | ✅ | ✅ | ✅ | ✅ | ✅ |
| Run VaR & Sharpe Risk Calculations | ❌ | ✅ | ✅ | ✅ | ✅ |
| Run Policy Compliance & Breach Check | ✅ | ✅ | ✅ | ✅ | ✅ |
| Formulate Rebalance Recommendation | ❌ | ✅ | ✅ | ✅ | ✅ |
| Approve / Reject Sensitive Rebalance Tickets | ❌ | ❌ | ❌ | ✅ | ✅ |
| Execute Direct Market Orders | ❌ | ❌ | ❌ | ❌ (Dual sign-off req) | ❌ |
| Inspect Full Immutable Audit Trail | ❌ | ❌ | ✅ | ✅ | ✅ |
| Configure System & Policy Standards | ❌ | ❌ | ❌ | ❌ | ✅ |
