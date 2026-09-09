# Microsoft Power Automate & Microsoft Copilot Studio Integration Architecture

## 1. Overview
In enterprise banking environments such as **UBS**, wealth management operational processes frequently interface with **Microsoft Power Platform**, **Power Automate**, and **Microsoft Copilot Studio**. 

WealthOps Agent is architected with open OpenAPI REST standards and webhook listeners to integrate seamlessly into Microsoft Power Platform topologies.

---

## 2. Integration Architecture

```text
┌─────────────────────────────────────────────────────────┐
│              Microsoft 365 / Power Platform             │
│                                                         │
│  ┌───────────────────────┐   ┌───────────────────────┐  │
│  │ Microsoft Copilot     │   │ Power Automate Flow   │  │
│  │ Studio                │   │ (Daily 8:00 AM Cron   │  │
│  │ (Advisor Chat Client) │   │ or Inbound Inquiries) │  │
│  └───────────┬───────────┘   └───────────┬───────────┘  │
└──────────────┼───────────────────────────┼──────────────┘
               │                           │
               │ HTTP Custom Connector     │ HTTP Action / Webhook
               ▼                           ▼
┌─────────────────────────────────────────────────────────┐
│                    WealthOps Gateway                    │
│                      FastAPI API                        │
│            Authentication & RBAC Header Validation      │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   LangGraph Agent Core                  │
│       Intent Routing → Planner → Policy RAG → Tools     │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│           Deterministic Guardrail Engine & HITL         │
│          - Value Thresholds ($100,000 limit)            │
│          - Allocation Drift (> 5.0% requires approval)  │
│          - Dual-Signoff Escalation                      │
└──────────────────────────┬──────────────────────────────┘
                           │
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
[Low-Risk Direct Response]           [Sensitive Action]
       │                                       │
       │                                       ▼
       │                             Adaptive Card Sent to
       │                             Microsoft Teams / Outlook
       │                             (Risk Officer [Approve] / [Reject])
       │                                       │
       └───────────────────┬───────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Immutable Audit Log                  │
│           Request, Plan, Tools, Approvals, Diffs        │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Power Automate Flow 1: Daily Automated Portfolio Exception Sweep

### Trigger
- **Schedule**: Recurrence trigger set to `Every weekday at 08:00 AM EST`.

### Actions
1. **HTTP Action**:
   - `Method`: `POST`
   - `URI`: `https://api.wealthops.internal/api/automation/daily-monitor`
   - `Headers`:
     - `X-User-Role`: `ADMIN`
     - `Content-Type`: `application/json`
2. **Parse JSON**:
   - Schema parses `portfolios_evaluated`, `policy_breaches_detected`, and `exceptions[]`.
3. **Condition**:
   - If `policy_breaches_detected > 0`:
     - **Post an Adaptive Card in Microsoft Teams** channel: *Wealth Management Operations & Risk*.
     - Show list of accounts in breach (e.g. `Client C1024: Equity 67.2% vs 60.0% max limit`).
     - Provide direct link button: `[Open WealthOps Dashboard Approval Queue]`.

---

## 4. Power Automate Flow 2: Outlook Inbound Operations Request to WealthOps Agent

### Trigger
- **Office 365 Outlook**: `When a new email arrives in Operations Inbox` with subject containing `[PORTFOLIO REVIEW]`.

### Actions
1. **Extract Body Content**:
   - Email text: *"Please check whether client C1024 is within their approved risk tolerance and prepare a rebalance recommendation."*
2. **HTTP Custom Connector Call**:
   - `POST /api/agent/run`
   - Body: `{"query": "@{triggerOutputs()?['body/body']}", "client_id": "C1024"}`
   - Header: `X-User-Role: OPERATIONS_ANALYST`
3. **Handle Response**:
   - If `approval_required == true`:
     - Send **Outlook Actionable Message** to Chief Risk Officer with `Approve` and `Reject` buttons.
   - If `approval_required == false`:
     - Reply to sender with synthesized fiduciary report.

---

## 5. OpenAPI Custom Connector Specification for Power Platform

To import WealthOps directly into Microsoft Power Automate or Copilot Studio:
1. Navigate to **Power Automate Portal** -> **Data** -> **Custom Connectors**.
2. Select **New Custom Connector** -> **Import an OpenAPI URL**.
3. Input `http://localhost:8000/openapi.json`.
4. Define Authentication Type: `API Key` (mapped to `X-User-Role` and Bearer token).
5. All 10+ financial tools and agent endpoints are immediately available as native Power Platform actions.
