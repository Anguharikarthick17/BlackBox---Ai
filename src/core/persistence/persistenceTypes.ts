/**
 * BLACKBOX X — Persistence Layer Type Definitions
 * 
 * Database row interfaces (DTOs) for Supabase persistence.
 * These are NOT domain objects — they are storage representations.
 * 
 * Bidirectional mapping between domain objects and these rows is in supabaseMappers.ts.
 */

// ============================================================
// DATABASE ROW INTERFACES
// ============================================================

export interface ResearchCaseRow {
  id?: string;                    // UUID (assigned by DB)
  case_id: string;                // BBX-CASE-YYYY-XXXX
  title?: string;
  question: string;
  normalized_question?: string;
  status: string;                 // CaseStatus
  case_version: number;
  is_demo: boolean;
  asset_universe?: Record<string, unknown>;
  strategy_config?: Record<string, unknown>;
  portfolio_config?: Record<string, unknown>;
  simulation_config?: Record<string, unknown>; // Compact summary only
  engine_config?: Record<string, unknown>;
  research_config?: Record<string, unknown>;
  manifest?: Record<string, unknown>;
  session_fingerprint?: string;
  dataset_fingerprint?: string;
  fingerprint?: string;
  dataset_start?: string;         // ISO date string
  dataset_end?: string;
  dataset_description?: string;
  observation_count?: number;
  user_id?: string;               // UUID ref to auth.users (nullable pre-auth)
  created_at?: string;
  updated_at?: string;
  sealed_at?: string;
}

export interface ResearchSessionRow {
  id?: string;
  session_id: string;
  case_id?: string;               // UUID ref to research_cases
  session_type: string;
  status: string;
  current_stage?: string;
  fingerprint?: string;
  metadata?: Record<string, unknown>;
  user_id?: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
}

export interface ResearchHypothesisRow {
  id?: string;
  session_id: string;             // UUID ref to research_sessions
  hypothesis_id: string;
  statement: string;
  category?: string;
  status?: string;                // HypothesisStatus
  confidence?: string;
  thresholds?: Record<string, unknown>;
  direct_evidence?: Record<string, unknown>;
  interpretation?: string;
  order_index: number;
  created_at?: string;
}

export interface ResearchExperimentRow {
  id?: string;
  session_id: string;
  experiment_id: string;
  tool_name: string;
  arguments: Record<string, unknown>;
  data_window?: Record<string, unknown>;
  status?: string;
  execution_order: number;
  result_summary?: Record<string, unknown>;
  fingerprint?: string;
  started_at?: string;
  completed_at?: string;
}

export interface ResearchEvidenceRow {
  id?: string;
  session_id: string;
  evidence_id: string;
  hypothesis_id?: string;
  experiment_id?: string;
  tool_name: string;
  arguments?: Record<string, unknown>;
  result?: Record<string, unknown>;  // Compact — no raw path matrices
  data_window?: Record<string, unknown>;
  direct_evidence: string;           // NEVER merged with interpretation
  interpretation: string;            // STRICTLY separate from direct_evidence
  execution_order: number;
  fingerprint: string;
  created_at?: string;
}

export interface ResearchEvidenceEdgeRow {
  id?: string;
  session_id: string;
  source_id: string;
  target_id: string;
  edge_type: string;     // EdgeType: SUPPORTS|CONTRADICTS|DERIVED_FROM|TESTS|REFINES|DEPENDS_ON
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface ResearchClaimRow {
  id?: string;
  session_id: string;
  claim_id: string;
  claim_text: string;
  claim_type: string;    // ClaimType: DIRECT_OBSERVATION|INTERPRETATION|COMPARISON
  metric?: string;
  value?: string;
  unit?: string;
  evidence_ids?: string[];
  metric_refs?: Record<string, unknown>;
  confidence?: string;
  created_at?: string;
}

export interface ResearchMemoRow {
  id?: string;
  session_id: string;
  memo_id: string;
  memo: Record<string, unknown>;  // Full structured ResearchMemo.sections
  markdown?: string;
  limitations?: string;
  disclaimer?: string;
  created_at?: string;
}

export interface ResearchAuditEventRow {
  id?: string;
  session_id?: string;
  case_id?: string;
  event_id: string;
  event_type: string;
  actor?: string;
  event_order: number;
  timestamp: string;              // ISO timestamp
  payload?: Record<string, unknown>;
  event_hash?: string;
  previous_event_hash?: string;
  entity_id?: string;
  fingerprint?: string;
  created_at?: string;
}

export interface ResearchReplayVerificationRow {
  id?: string;
  case_id: string;               // UUID ref to research_cases
  session_id?: string;
  verification_id: string;
  verification_status: string;   // MATCHED|MISMATCHED|INCOMPATIBLE|FAILED
  comparison_class?: string;     // EXACT|CANONICAL_EXACT|NUMERICAL_TOLERANCE
  overall_match_pct?: number;
  gate_results?: Record<string, unknown>;
  mismatch_type?: string;
  mismatch_details?: Record<string, unknown>;
  fingerprint?: string;
  verified_at?: string;
}

export interface ResearchTrailEventRow {
  id?: string;
  session_id?: string;
  trail_id: string;
  observation?: string;
  hypothesis?: string;
  evidence?: string;
  impact?: string;
  next_test?: string;
  user_id?: string;
  timestamp?: string;
  created_at?: string;
}

// ============================================================
// SAVE OPERATION RESULT
// ============================================================

export interface PersistenceResult {
  success: boolean;
  caseId?: string;
  dbId?: string;
  error?: string;
  offline?: boolean; // true when operating in offline/local-only mode
}

export interface PersistenceStatus {
  status: 'ONLINE' | 'OFFLINE' | 'UNCONFIGURED';
  message: string;
}

// ============================================================
// COMPACT MONTE CARLO SUMMARY (never store full path matrices)
// ============================================================

export interface CompactMonteCarloSummary {
  method: string;
  pathCount: number;
  horizonDays: number;
  seed: number;
  percentiles: {
    p05: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
  varOneYear95: number;
  cvarOneYear99: number;
  ruinProbability: number;
  medianFinalReturn: number;
  // raw path arrays intentionally EXCLUDED
}
