export interface Fault {
  name: string;
  description: string;
  target_service: string;
  default_variant: string;
  active_variant: string;
  state: string;
  is_active: boolean;
  variants: Record<string, any>;
}

export interface EvidenceItem {
  id: string; // E1, E2, ...
  type: string;
  service: string;
  summary: string;
  details: Record<string, any>;
  severity: 'high' | 'medium' | 'low';
}

export interface SuspectScore {
  service: string;
  score: number;
  rank: number;
  error_rate_delta: number;
  latency_p95_delta: number;
  trace_error_count: number;
  log_error_count: number;
  evidence_ids: string[];
}

export interface InternalTicket {
  title: string;
  severity: string;
  steps_to_reproduce: string[];
  suspected_cause: string;
  next_actions: string[];
}

export interface AnalysisOutput {
  summary: string;
  impacted_services: string[];
  probable_root_cause: string;
  confidence: number;
  evidence_ids_used: string[];
  customer_update: string;
  internal_ticket: InternalTicket;
  runbook_markdown: string;
}

export interface Incident {
  id: string;
  fault_name: string;
  ground_truth_service: string;
  status: 'active' | 'analyzing' | 'analyzed' | 'resolved';
  start_time: string;
  end_time?: string;
  evidence: EvidenceItem[];
  ranked_suspects: SuspectScore[];
  analysis?: AnalysisOutput;
  created_at: string;
}

export interface ServiceHealth {
  service: string;
  error_rate: number;
  p95_latency_ms: number;
  request_rate: number;
  status: 'healthy' | 'degraded' | 'critical';
  active_fault?: string | null;
}

export interface HealthStreamPayload {
  timestamp: number;
  active_faults_count: number;
  overall_signal_noise: number;
  services: ServiceHealth[];
}
