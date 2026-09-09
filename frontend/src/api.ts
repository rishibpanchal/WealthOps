import {
  UserRole,
  ClientSummary,
  ClientDetail,
  AgentRunResponse,
  ApprovalItem,
  AuditRecord,
  PolicyDoc,
  ObservabilityStats,
  EvalBenchmarkResult,
  ProcessAnalysisResult,
} from './types';

const resolveApiBase = (): string => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE;
  if (envUrl) {
    const trimmed = envUrl.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }
  return 'http://127.0.0.1:8000/api';
};

const API_BASE = resolveApiBase();

export const USER_PROFILES: Record<UserRole, { name: string; email: string; description: string; canApprove: boolean; canRebalance: boolean }> = {
  OPERATIONS_ANALYST: {
    name: 'Rishi Sharma',
    email: 'rishi.ops@wealthops.internal',
    description: 'Operations Analyst — Formulate analyses & recommendations; cannot execute sensitive orders directly',
    canApprove: false,
    canRebalance: true,
  },
  RISK_OFFICER: {
    name: 'Elena Rostova',
    email: 'elena.rostova@wealthops.internal',
    description: 'Chief Risk Officer — Highest dual-approval authority for sensitive rebalancing and policy overrides',
    canApprove: true,
    canRebalance: true,
  },
  ADVISOR: {
    name: 'Marcus Vance',
    email: 'marcus.vance@wealthops.internal',
    description: 'Wealth Advisor — Client advisory, suitability reviews & portfolio allocations',
    canApprove: false,
    canRebalance: true,
  },
  ADMIN: {
    name: 'Sarah Jenkins',
    email: 'admin.ops@wealthops.internal',
    description: 'Platform Admin — Complete governance oversight, audit inspection, and policy management',
    canApprove: true,
    canRebalance: true,
  },
  VIEWER: {
    name: 'Alex Morgan',
    email: 'guest.auditor@wealthops.internal',
    description: 'Read-Only Viewer — Inquiry & reporting only; blocked by RBAC from initiating operational actions',
    canApprove: false,
    canRebalance: false,
  },
};

export const api = {
  async runAgent(query: string, role: UserRole, clientId?: string): Promise<AgentRunResponse> {
    const res = await fetch(`${API_BASE}/agent/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role,
      },
      body: JSON.stringify({ query, client_id: clientId || null }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to execute agent request');
    }
    return res.json();
  },

  async getClients(role: UserRole): Promise<ClientSummary[]> {
    const res = await fetch(`${API_BASE}/clients`, {
      headers: { 'X-User-Role': role },
    });
    if (!res.ok) throw new Error('Failed to fetch clients');
    return res.json();
  },

  async getClientDetail(clientId: string, role: UserRole): Promise<ClientDetail> {
    const res = await fetch(`${API_BASE}/clients/${clientId}`, {
      headers: { 'X-User-Role': role },
    });
    if (!res.ok) throw new Error(`Failed to fetch client ${clientId}`);
    return res.json();
  },

  async getApprovals(role: UserRole, statusFilter?: string): Promise<ApprovalItem[]> {
    const url = statusFilter ? `${API_BASE}/approvals?status_filter=${statusFilter}` : `${API_BASE}/approvals`;
    const res = await fetch(url, {
      headers: { 'X-User-Role': role },
    });
    if (!res.ok) throw new Error('Failed to fetch approvals');
    return res.json();
  },

  async approveTicket(approvalId: string, role: UserRole, note?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/approvals/${approvalId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role,
      },
      body: JSON.stringify({ note: note || 'Authorized per SOP-WM-402' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Authorization failed');
    }
    return res.json();
  },

  async rejectTicket(approvalId: string, role: UserRole, note?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/approvals/${approvalId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role,
      },
      body: JSON.stringify({ note: note || 'Rejected by risk review' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Rejection failed');
    }
    return res.json();
  },

  async getPolicies(role: UserRole): Promise<PolicyDoc[]> {
    const res = await fetch(`${API_BASE}/policies`, {
      headers: { 'X-User-Role': role },
    });
    if (!res.ok) throw new Error('Failed to fetch policies');
    return res.json();
  },

  async searchPolicies(query: string, role: UserRole): Promise<any> {
    const res = await fetch(`${API_BASE}/policies/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role,
      },
      body: JSON.stringify({ query, top_k: 3 }),
    });
    if (!res.ok) throw new Error('Policy search failed');
    return res.json();
  },

  async getAuditLogs(role: UserRole, roleFilter?: string, decisionFilter?: string): Promise<AuditRecord[]> {
    let url = `${API_BASE}/audit?limit=50`;
    if (roleFilter) url += `&role_filter=${roleFilter}`;
    if (decisionFilter) url += `&decision_filter=${decisionFilter}`;
    const res = await fetch(url, {
      headers: { 'X-User-Role': role },
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getStats(role: UserRole): Promise<ObservabilityStats> {
    const res = await fetch(`${API_BASE}/audit/stats`, {
      headers: { 'X-User-Role': role },
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async triggerDailyMonitor(role: UserRole): Promise<any> {
    const res = await fetch(`${API_BASE}/automation/daily-monitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role,
      },
    });
    if (!res.ok) throw new Error('Daily monitor trigger failed');
    return res.json();
  },

  async analyzeProcess(role: UserRole, processName?: string, rawSteps?: string[]): Promise<ProcessAnalysisResult> {
    const res = await fetch(`${API_BASE}/automation/process-analyzer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role,
      },
      body: JSON.stringify({ process_name: processName, raw_steps: rawSteps }),
    });
    if (!res.ok) throw new Error('Process analysis failed');
    return res.json();
  },

  async runEvalBenchmark(role: UserRole): Promise<EvalBenchmarkResult> {
    const res = await fetch(`${API_BASE}/eval/benchmark`, {
      headers: { 'X-User-Role': role },
    });
    if (!res.ok) throw new Error('Benchmark evaluation failed');
    return res.json();
  },
};
