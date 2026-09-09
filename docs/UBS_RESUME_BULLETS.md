# WealthOps Agent: Resume & Interview Playbook for UBS

## 1. Resume Project Entry

### **WealthOps Agent — AI-Powered Wealth Management Operations Automation Platform**
*Python, FastAPI, LangGraph, PostgreSQL/SQLAlchemy, pgvector/RAG, n8n/Power Automate, React/TypeScript*

- **Architected an enterprise agentic operations platform** that converts unstructured natural-language wealth operations requests into multi-step execution graphs via LangGraph planning, tool calling, and RAG policy retrieval.
- **Built an authorized financial tool registry & deterministic guardrail engine** integrating portfolio, market, and risk APIs with strict role-based access controls (RBAC), transaction volume caps ($100k), and asset-class drift boundaries.
- **Implemented human-in-the-loop (HITL) dual-approval governance** routing sensitive rebalancing recommendations (>5% drift or >$100k value) to Risk Officers with an immutable compliance audit trail capturing decisions, tool calls, and model outputs.
- **Automated scheduled portfolio exception monitoring** via n8n / Power Automate webhook triggers, simulating daily 8:00 AM sweeps across active accounts to detect IPS limits breaches and generate automated breach alerts.
- **Developed an operations process opportunity analyzer & AI evaluation framework** measuring intent accuracy (94.7%), tool selection precision (92.4%), and 100% unauthorized action interception across benchmark operational test scenarios.

---

## 2. Interview Talking Points Mapped to the UBS Job Description

### "Tell me about an agentic workflow you designed."
> *"At a high level, rather than building another generic conversational chatbot, I built WealthOps as an enterprise operations platform for wealth management.
> In wealth operations, an analyst might ask: 'Check whether client C1024's portfolio is outside their approved risk tolerance and prepare a recommendation.'
> 
> My platform runs this through a 6-stage LangGraph state machine:
> 1. Intent & Entity Routing classifies the request and identifies the target client.
> 2. The Planner Agent outlines the required financial tools.
> 3. Semantic RAG retrieves the client's documented Investment Policy Statement (IPS) and institutional Rebalancing SOP.
> 4. Financial tools calculate current asset allocations and detect that equity exposure is 67.2% against a 60% policy cap.
> 5. A non-LLM deterministic guardrail engine evaluates the proposed rebalance. Because the trade exceeds $100k and involves a >5% shift, the agent is deterministically blocked from auto-executing and instead queues an approval ticket for the Risk Officer.
> 6. An immutable audit trail persists every tool invocation, parameter, and retrieved document checksum for regulatory compliance."*

### "How do you prevent an AI agent from making unsafe or hallucinated trades?"
> *"I follow the fundamental architectural principle: **Never let the LLM decide the security policy or execute financial transactions unilaterally.**
> In WealthOps, the LLM is restricted to reasoning, planning, and proposing actions. Fiduciary bounds, role authorization, and trade validation are enforced by a **deterministic guardrail engine** outside the LLM. 
> Furthermore, sensitive operations require signed human-in-the-loop sign-off before simulated execution can occur, and every single step is logged in an immutable audit ledger."*

### "How does this connect with tools like Power Automate or n8n?"
> *"I designed the platform with an API-first approach using FastAPI and OpenAPI specs. We have importable webhook templates for n8n and Microsoft Power Automate. For instance, every weekday at 8:00 AM, a scheduled cron trigger hits `/api/automation/daily-monitor`. It scans the portfolio database, flags all accounts in breach, and posts an Adaptive Card into Microsoft Teams for the risk team with one-click links to the approval queue."*

### "How did you model business process improvement?"
> *"In the UBS operating model, teams collaborate with business analysts to identify manual steps ripe for automation. I built a 'Workflow Automation Opportunity Analyzer' inside the platform. It takes standard operating procedures—like a 7-step manual Excel and email workflow—and evaluates each step for automation potential: converting manual downloads to API connectors, Excel math to deterministic endpoints, policy searches to RAG, and email threads to audited approval queues, achieving an estimated 71% reduction in manual cycle time."*
