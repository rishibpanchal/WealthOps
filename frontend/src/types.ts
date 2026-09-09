export type UserRole = 
  | 'ADMIN'
  | 'OPERATIONS_ANALYST'
  | 'ADVISOR'
  | 'RISK_OFFICER'
  | 'VIEWER';

export interface UserProfile {
  role: UserRole;
  name: string;
  email: string;
  description: string;
  canApprove: boolean;
  canRebalance: boolean;
}

export interface ClientSummary {
  id: string;
  name: string;
  email: string;
  risk_tolerance: string;
  aum: number;
  equity_pct: number;
  policy_status: 'COMPLIANT' | 'BREACH';
  breach_count: number;
  status: string;
}

export interface Holding {
  ticker: string;
  name: string;
  asset_class: string;
  quantity: number;
  current_price: number;
  market_value: number;
  weight_pct: number;
}

export interface ClientDetail {
  client: {
    id: string;
    name: string;
    email: string;
    risk_tolerance: string;
    net_worth: number;
    aum: number;
    advisor_id: string;
    status: string;
  };
  portfolio: {
    id: string;
    total_value: number;
    cash_balance: number;
    currency: string;
    holdings: Holding[];
  };
  policy: {
    policy_name: string;
    min_equity_pct: number;
    max_equity_pct: number;
    target_equity_pct: number;
    min_fixed_income_pct: number;
    max_fixed_income_pct: number;
    target_fixed_income_pct: number;
    min_cash_pct: number;
    max_cash_pct: number;
    status: string;
    breaches: any[];
  };
  risk_metrics: {
    var_pct_1d: number;
    var_amount_usd: number;
    sharpe_ratio: number;
    sharpe_rating: string;
  };
}

export interface StepEvent {
  step_order: number;
  node_name: string;
  title: string;
  status: 'STARTED' | 'COMPLETED' | 'WARNING' | 'BLOCKED' | 'FAILED';
  summary: string;
  details?: any;
  duration_ms: number;
}

export interface AgentRunResponse {
  run_id: string;
  user_id: string;
  user_role: string;
  query: string;
  intent: string;
  confidence: number;
  client_id?: string;
  plan: any[];
  steps: StepEvent[];
  retrieved_policies: any[];
  tool_results: any;
  validation: any;
  approval_required: boolean;
  approval_id?: string;
  risk_level: string;
  final_response: string;
  audit_id: string;
}

export interface ApprovalItem {
  id: string;
  workflow_run_id?: string;
  client_id: string;
  action_type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  risk_level: string;
  reason: string;
  estimated_value: number;
  proposed_payload: any;
  policy_reference?: string;
  requested_by_user_id: string;
  requested_by_role: string;
  resolved_by_user_id?: string;
  resolved_by_role?: string;
  resolution_note?: string;
  created_at: string;
  resolved_at?: string;
}

export interface AuditRecord {
  id: string;
  request_id: string;
  user_id: string;
  user_role: string;
  action: string;
  intent?: string;
  client_id?: string;
  tools_used: string[];
  policy_references: string[];
  decision: string;
  status: string;
  metadata: any;
  timestamp: string;
}

export interface PolicyDoc {
  id: string;
  title: string;
  category: string;
  version: string;
  summary: string;
  content: string;
}

export interface ObservabilityStats {
  total_agent_runs: number;
  successful_operations: number;
  pending_approvals: number;
  approved_tickets: number;
  rejected_tickets: number;
  policy_breaches_flagged: number;
  unauthorized_attempts_blocked: number;
  average_latency_sec: number;
  active_clients_monitored: number;
}

export interface EvalBenchmarkResult {
  benchmark_summary: {
    total_test_cases: number;
    intent_classification_accuracy: string;
    tool_selection_accuracy: string;
    policy_retrieval_precision: string;
    unauthorized_action_blocking_rate: string;
    fiduciary_escalation_accuracy: string;
    hallucination_rate: string;
  };
  metrics: {
    intent_accuracy_pct: number;
    tool_accuracy_pct: number;
    policy_accuracy_pct: number;
    unauthorized_blocking_pct: number;
    escalation_accuracy_pct: number;
    hallucination_pct: number;
  };
  test_results: Array<{
    query: string;
    category: string;
    expected_intent: string;
    predicted_intent: string;
    intent_pass: boolean;
    blocked_as_expected?: boolean | null;
    escalated: boolean;
  }>;
}

export interface ProcessAnalysisResult {
  process_name: string;
  total_manual_steps: number;
  automatable_steps: number;
  automation_percentage: number;
  estimated_time_saved_per_day_minutes: number;
  estimated_annual_hours_saved: number;
  steps_breakdown: Array<{
    step_number: number;
    original_step: string;
    automatable: boolean;
    solution_pattern: string;
    target_technology: string;
    manual_minutes_saved: number;
  }>;
  governance_advisory: string;
}
