import api from '@/services/api';

export interface DispatchRule {
  id?: string;
  rule_name: string;
  weight_distance: number;
  weight_gps: number;
  weight_online_status: number;
  weight_shift_status: number;
  weight_kyc: number;
  weight_fraud_score: number;
  weight_workload: number;
  weight_vehicle: number;
  weight_avg_delivery_time: number;
  weight_acceptance_rate: number;
  weight_completion_rate: number;
  weight_rating: number;
  weight_geofence: number;
  weight_traffic_delay: number;
  weight_estimated_arrival: number;
  weight_idle_time: number;
  max_search_radius_km: number;
  max_active_orders_per_partner: number;
  auto_assign_enabled: boolean;
  max_retry_attempts: number;
  reassign_timeout_seconds: number;
  is_active?: boolean;
}

export interface FactorScores {
  distance: number;
  gps: number;
  online_status: number;
  shift_status: number;
  kyc: number;
  fraud_score: number;
  workload: number;
  vehicle: number;
  avg_delivery_time: number;
  acceptance_rate: number;
  completion_rate: number;
  rating: number;
  geofence: number;
  traffic_delay: number;
  estimated_arrival: number;
  idle_time: number;
}

export interface RawMetrics {
  distance_km: number;
  eta_minutes: number;
  gps_age_minutes: number;
  idle_minutes: number;
  active_workload: number;
  fraud_risk_score: number;
  rating: number;
  acceptance_rate: number;
  completion_rate: number;
  vehicle_type: string;
}

export interface ScoringBreakdown {
  total_score: number;
  factor_scores: FactorScores;
  weights: Record<string, number>;
  raw_metrics: RawMetrics;
}

export interface RankedCandidate {
  partner_id: string;
  partner_name: string;
  vehicle_type: string;
  rating: number;
  is_eligible: boolean;
  total_score: number;
  scoring_breakdown: ScoringBreakdown;
  decision_reason: string;
}

export interface AssignedPartner {
  id: string;
  full_name: string;
  phone_number: string;
  vehicle_type: string;
  rating: number;
  score: number;
  distance_km: number;
  eta_minutes: number;
  decision_reason: string;
}

export interface DispatchRunResult {
  dispatch_run_id: string;
  order_id: string;
  status: string;
  summary: string;
  assigned_partner: AssignedPartner | null;
  ranked_candidates: RankedCandidate[];
  rules_applied?: DispatchRule;
  execution_time_ms: number;
}

export interface DispatchHistoryItem {
  id: string;
  dispatch_run_id: string;
  order_id: string;
  assigned_partner_id: string | null;
  trigger_type: string;
  attempt_number: number;
  status: string;
  candidates_evaluated: number;
  ai_decision_summary: string;
  execution_time_ms: number;
  total_amount?: number;
  order_status?: string;
  restaurant_name?: string;
  partner_name?: string;
  partner_phone?: string;
  partner_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface DispatchLogItem {
  id: string;
  dispatch_run_id: string;
  order_id: string;
  partner_id: string | null;
  total_score: number;
  scoring_breakdown: ScoringBreakdown;
  decision_reason: string;
  status: string;
  partner_name?: string;
  vehicle_type?: string;
  partner_rating?: number;
  partner_phone?: string;
  created_at: string;
}

export async function runDispatch(payload?: { orderId?: string; forceReassign?: boolean }): Promise<DispatchRunResult> {
  const res = await api.post('/api/admin/dispatch/run', payload || {});
  return res.data.data;
}

export async function fetchDispatchHistory(params?: { status?: string; order_id?: string; limit?: number; offset?: number }): Promise<{ history: DispatchHistoryItem[]; total: number; limit: number; offset: number }> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.order_id) sp.set('order_id', params.order_id);
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.offset != null) sp.set('offset', String(params.offset));
  const query = sp.toString() ? `?${sp}` : '';
  const res = await api.get(`/api/admin/dispatch/history${query}`);
  return res.data.data;
}

export async function fetchDispatchLogs(params?: { dispatch_run_id?: string; order_id?: string; limit?: number }): Promise<{ logs: DispatchLogItem[]; total: number }> {
  const sp = new URLSearchParams();
  if (params?.dispatch_run_id) sp.set('dispatch_run_id', params.dispatch_run_id);
  if (params?.order_id) sp.set('order_id', params.order_id);
  if (params?.limit != null) sp.set('limit', String(params.limit));
  const query = sp.toString() ? `?${sp}` : '';
  const res = await api.get(`/api/admin/dispatch/logs${query}`);
  return res.data.data;
}

export async function fetchDispatchRules(): Promise<DispatchRule> {
  const res = await api.get('/api/admin/dispatch/rules');
  return res.data.data;
}

export async function updateDispatchRules(rules: Partial<DispatchRule>): Promise<DispatchRule> {
  const res = await api.patch('/api/admin/dispatch/rules', rules);
  return res.data.data;
}
