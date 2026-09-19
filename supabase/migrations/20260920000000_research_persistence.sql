-- BLACKBOX X — Supabase Persistence Migration
-- Research Artifact Storage Layer
-- Version: 1.0.0 — Phase 5.0
--
-- ARCHITECTURE BOUNDARY:
--   This schema stores ONLY research artifacts and metadata.
--   NO quantitative calculations occur inside the database.
--   Monte Carlo path matrices are NOT stored — only compact summaries.
--   All quantitative results originate from deterministic local engines.
--
-- SECURITY:
--   Row Level Security (RLS) is ENABLED on all tables.
--   user_id is nullable for forward-compatible future auth expansion.
--   Server-side service-role key is required for writes.

-- ============================================================
-- EXTENSION: UUID generation
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE 1: research_cases
-- Immutable sealed research case artifacts.
-- BBX-CASE-YYYY-XXXX reference IDs are preserved alongside UUIDs.
-- Once sealed: use copy-on-write if a case is forked.
-- ============================================================

CREATE TABLE IF NOT EXISTS research_cases (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id             TEXT UNIQUE NOT NULL,           -- BBX-CASE-YYYY-XXXX format
  title               TEXT,
  question            TEXT NOT NULL,
  normalized_question TEXT,
  status              TEXT NOT NULL DEFAULT 'SEALED', -- CaseStatus enum
  case_version        INTEGER NOT NULL DEFAULT 1,
  is_demo             BOOLEAN NOT NULL DEFAULT FALSE,  -- TRY DEMO isolation tag

  -- Configuration JSONBs (compact, no raw path matrices)
  asset_universe      JSONB,   -- ManifestDataSection
  strategy_config     JSONB,   -- ManifestStrategySection
  portfolio_config    JSONB,   -- ManifestPortfolioSection
  simulation_config   JSONB,   -- ManifestSimulationSection (summary only)
  engine_config       JSONB,   -- ManifestEngineSection
  research_config     JSONB,   -- ManifestResearchSection

  -- Provenance & integrity
  manifest            JSONB,   -- Full ResearchManifest (compact serialized)
  session_fingerprint TEXT,
  dataset_fingerprint TEXT,
  fingerprint         TEXT,    -- Canonical reproducibility fingerprint

  -- Data window
  dataset_start       DATE,
  dataset_end         DATE,
  dataset_description TEXT,
  observation_count   INTEGER,

  -- Ownership (nullable for current pre-auth phase)
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sealed_at           TIMESTAMPTZ
);

COMMENT ON TABLE research_cases IS
  'Immutable sealed BLACKBOX X research case artifacts. Quantitative results are computed locally; this stores the research artifact only.';
COMMENT ON COLUMN research_cases.is_demo IS
  'Isolates TRY DEMO cases from real user research. Demo cases cannot overwrite user cases.';
COMMENT ON COLUMN research_cases.simulation_config IS
  'Compact simulation summary only — raw Monte Carlo path matrices are NEVER stored.';

-- ============================================================
-- TABLE 2: research_sessions
-- Research execution session lifecycle records.
-- Maps to ResearchSession domain object.
-- ============================================================

CREATE TABLE IF NOT EXISTS research_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      TEXT UNIQUE NOT NULL,
  case_id         UUID REFERENCES research_cases(id) ON DELETE CASCADE,
  session_type    TEXT NOT NULL DEFAULT 'STANDARD',  -- 'STANDARD' | 'DEMO' | 'REPLAY'
  status          TEXT NOT NULL DEFAULT 'DRAFT',
  -- ResearchSessionStatus: DRAFT|PLANNING|RUNNING|ANALYZING|CONTRADICTION_CHECK|
  --   SECONDARY_TEST|SYNTHESIZING|COMPLETE|FAILED
  current_stage   TEXT,
  fingerprint     TEXT,
  metadata        JSONB,  -- provenance, engine versions, duration, etc.
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE research_sessions IS
  'Research session lifecycle records — maps to ResearchSession domain object.';

-- ============================================================
-- TABLE 3: research_hypotheses
-- Individual falsifiable hypotheses per session.
-- Preserves HypothesisStatus vocabulary exactly.
-- ============================================================

CREATE TABLE IF NOT EXISTS research_hypotheses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  hypothesis_id   TEXT NOT NULL,
  statement       TEXT NOT NULL,
  category        TEXT,  -- HypothesisCategory enum
  status          TEXT,  -- SUPPORTED | PARTIALLY_SUPPORTED | CONTRADICTED | INCONCLUSIVE
  confidence      TEXT,  -- HIGH_EVIDENCE | MODERATE_EVIDENCE | LIMITED_EVIDENCE | INCONCLUSIVE
  thresholds      JSONB, -- rejection thresholds and expected evidence
  direct_evidence JSONB, -- priorEvidence[], expectedEvidence[], contradictingEvidence[]
  interpretation  TEXT,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, hypothesis_id)
);

COMMENT ON TABLE research_hypotheses IS
  'Falsifiable hypotheses per research session. HypothesisStatus vocabulary: SUPPORTED | PARTIALLY_SUPPORTED | CONTRADICTED | INCONCLUSIVE.';

-- ============================================================
-- TABLE 4: research_experiments
-- Structured experiment node records.
-- Arguments are structured JSON — no executable code stored.
-- ============================================================

CREATE TABLE IF NOT EXISTS research_experiments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id       UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  experiment_id    TEXT NOT NULL,
  tool_name        TEXT NOT NULL,    -- Registered analytical tool name only
  arguments        JSONB NOT NULL,   -- Structured parameters only — NO executable code
  data_window      JSONB,            -- { startDate, endDate, observationCount }
  status           TEXT,             -- ExperimentNodeStatus: PENDING|RUNNING|SUCCESS|FAILED|SKIPPED
  execution_order  INTEGER NOT NULL DEFAULT 0,
  result_summary   JSONB,            -- Compact summary only — no raw path matrices
  fingerprint      TEXT,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  UNIQUE (session_id, experiment_id)
);

COMMENT ON TABLE research_experiments IS
  'Structured experiment node records. Arguments are validated JSON — no executable code is persisted.';

-- ============================================================
-- TABLE 5: research_evidence
-- Evidence records with STRICT separation of direct evidence vs interpretation.
-- Mirrors EvidenceRecord domain type exactly.
-- ============================================================

CREATE TABLE IF NOT EXISTS research_evidence (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id       UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  evidence_id      TEXT NOT NULL,
  hypothesis_id    TEXT,
  experiment_id    TEXT,
  tool_name        TEXT NOT NULL,
  arguments        JSONB,
  result           JSONB,          -- Compact result — no raw path matrices
  data_window      JSONB,
  direct_evidence  TEXT NOT NULL,  -- DIRECT observed fact (NEVER mix with interpretation)
  interpretation   TEXT NOT NULL,  -- Analytical interpretation (separated from direct evidence)
  execution_order  INTEGER NOT NULL DEFAULT 0,
  fingerprint      TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, evidence_id)
);

COMMENT ON TABLE research_evidence IS
  'Evidence records. CRITICAL: direct_evidence (observed fact) is STRICTLY separated from interpretation (analytical conclusion). Do not merge these fields.';

-- ============================================================
-- TABLE 6: research_evidence_edges
-- Evidence DAG lineage edges — non-causal lineage semantics.
-- Maps to GraphEdge domain type.
-- ============================================================

CREATE TABLE IF NOT EXISTS research_evidence_edges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  source_id   TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  edge_type   TEXT NOT NULL,  -- SUPPORTS|CONTRADICTS|DERIVED_FROM|TESTS|REFINES|DEPENDS_ON
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE research_evidence_edges IS
  'DAG lineage edges. Non-causal: edge_type reflects epistemic relationships (SUPPORTS, DERIVED_FROM, etc.), not causal determination.';

-- ============================================================
-- TABLE 7: research_claims
-- Structured research claims with evidence binding.
-- Every numerical claim retains its evidence references.
-- ============================================================

CREATE TABLE IF NOT EXISTS research_claims (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  claim_id     TEXT NOT NULL,
  claim_text   TEXT NOT NULL,
  claim_type   TEXT NOT NULL,  -- DIRECT_OBSERVATION | INTERPRETATION | COMPARISON
  metric       TEXT,
  value        TEXT,           -- Stored as text to preserve string/numeric polymorphism
  unit         TEXT,
  evidence_ids JSONB,          -- Array of evidenceId strings
  metric_refs  JSONB,          -- Metric reference bindings
  confidence   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, claim_id)
);

COMMENT ON TABLE research_claims IS
  'Structured research claims. Every numerical claim retains evidence_ids binding to the EvidenceRecord that grounds it.';

-- ============================================================
-- TABLE 8: research_memos
-- Structured institutional research memos.
-- Structured JSON + markdown — not just unstructured prose.
-- ============================================================

CREATE TABLE IF NOT EXISTS research_memos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  memo_id      TEXT NOT NULL,
  memo         JSONB NOT NULL,  -- Full structured ResearchMemo.sections object
  markdown     TEXT,            -- rawMarkdown for export
  limitations  TEXT,            -- Joined limitations string
  disclaimer   TEXT,            -- Mandatory epistemic disclaimer
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, memo_id)
);

COMMENT ON TABLE research_memos IS
  'Structured research memos. memo JSONB contains the full ResearchMemo.sections object — not just prose.';

-- ============================================================
-- TABLE 9: research_audit_events
-- Tamper-evident append-only audit ledger.
-- Preserves hash chain: event_hash chained to previous_event_hash.
-- ============================================================

CREATE TABLE IF NOT EXISTS research_audit_events (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id          UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
  case_id             TEXT,          -- BBX-CASE-YYYY-XXXX reference
  event_id            TEXT NOT NULL,
  event_type          TEXT NOT NULL, -- AuditEventType enum
  actor               TEXT,          -- SYSTEM | RESEARCHER | AI_AUDITOR
  event_order         INTEGER NOT NULL DEFAULT 0,
  timestamp           TIMESTAMPTZ NOT NULL,
  payload             JSONB,         -- Sanitized details (secrets stripped)
  event_hash          TEXT,          -- Hash of this event
  previous_event_hash TEXT,          -- Hash of the preceding event (tamper-evident chain)
  entity_id           TEXT,
  fingerprint         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE research_audit_events IS
  'Append-only tamper-evident audit ledger. event_hash + previous_event_hash maintain the canonical audit chain. Secrets are stripped before persistence.';

-- ============================================================
-- TABLE 10: research_replay_verifications
-- Replay verification audit records.
-- Preserves ComparisonClass vocabulary: EXACT | CANONICAL_EXACT | NUMERICAL_TOLERANCE.
-- ============================================================

CREATE TABLE IF NOT EXISTS research_replay_verifications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id             UUID NOT NULL REFERENCES research_cases(id) ON DELETE CASCADE,
  session_id          UUID REFERENCES research_sessions(id) ON DELETE SET NULL,
  verification_id     TEXT NOT NULL,
  verification_status TEXT NOT NULL,  -- MATCHED | MISMATCHED | INCOMPATIBLE | FAILED
  comparison_class    TEXT,           -- EXACT | CANONICAL_EXACT | NUMERICAL_TOLERANCE
  overall_match_pct   NUMERIC(5,2),
  gate_results        JSONB,          -- ReplayTierResults structured record
  mismatch_type       TEXT,           -- ReplayMismatchType enum
  mismatch_details    JSONB,
  fingerprint         TEXT,
  verified_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE research_replay_verifications IS
  'Replay verification records. comparison_class uses EXACT | CANONICAL_EXACT | NUMERICAL_TOLERANCE (NOT "BIT-IDENTICAL" as universal guarantee).';

-- ============================================================
-- TABLE 11: research_trail_events
-- Research trail / observation log entries.
-- Maps to ResearchEntry domain object from researchStore.ts.
-- ============================================================

CREATE TABLE IF NOT EXISTS research_trail_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
  trail_id     TEXT NOT NULL,
  observation  TEXT,
  hypothesis   TEXT,
  evidence     TEXT,
  impact       TEXT,
  next_test    TEXT,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE research_trail_events IS
  'Research trail observation log. Maps to ResearchEntry in researchStore.ts.';

-- ============================================================
-- INDEXES
-- ============================================================

-- research_cases
CREATE INDEX IF NOT EXISTS idx_research_cases_case_id ON research_cases(case_id);
CREATE INDEX IF NOT EXISTS idx_research_cases_status ON research_cases(status);
CREATE INDEX IF NOT EXISTS idx_research_cases_is_demo ON research_cases(is_demo);
CREATE INDEX IF NOT EXISTS idx_research_cases_fingerprint ON research_cases(fingerprint);
CREATE INDEX IF NOT EXISTS idx_research_cases_created_at ON research_cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_cases_user_id ON research_cases(user_id) WHERE user_id IS NOT NULL;

-- research_sessions
CREATE INDEX IF NOT EXISTS idx_research_sessions_session_id ON research_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_case_id ON research_sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_status ON research_sessions(status);
CREATE INDEX IF NOT EXISTS idx_research_sessions_created_at ON research_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_sessions_user_id ON research_sessions(user_id) WHERE user_id IS NOT NULL;

-- research_hypotheses
CREATE INDEX IF NOT EXISTS idx_research_hypotheses_session_id ON research_hypotheses(session_id);
CREATE INDEX IF NOT EXISTS idx_research_hypotheses_status ON research_hypotheses(status);

-- research_experiments
CREATE INDEX IF NOT EXISTS idx_research_experiments_session_id ON research_experiments(session_id);
CREATE INDEX IF NOT EXISTS idx_research_experiments_status ON research_experiments(status);

-- research_evidence
CREATE INDEX IF NOT EXISTS idx_research_evidence_session_id ON research_evidence(session_id);
CREATE INDEX IF NOT EXISTS idx_research_evidence_fingerprint ON research_evidence(fingerprint);

-- research_evidence_edges
CREATE INDEX IF NOT EXISTS idx_evidence_edges_session_id ON research_evidence_edges(session_id);
CREATE INDEX IF NOT EXISTS idx_evidence_edges_source ON research_evidence_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_evidence_edges_target ON research_evidence_edges(target_id);

-- research_claims
CREATE INDEX IF NOT EXISTS idx_research_claims_session_id ON research_claims(session_id);

-- research_audit_events
CREATE INDEX IF NOT EXISTS idx_audit_events_session_id ON research_audit_events(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_case_id ON research_audit_events(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_event_order ON research_audit_events(session_id, event_order);

-- research_replay_verifications
CREATE INDEX IF NOT EXISTS idx_replay_verifications_case_id ON research_replay_verifications(case_id);
CREATE INDEX IF NOT EXISTS idx_replay_verifications_status ON research_replay_verifications(verification_status);

-- research_trail_events
CREATE INDEX IF NOT EXISTS idx_trail_events_session_id ON research_trail_events(session_id);
CREATE INDEX IF NOT EXISTS idx_trail_events_user_id ON research_trail_events(user_id) WHERE user_id IS NOT NULL;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enabled on all tables.
-- For current pre-auth phase: server-side writes via service role key bypass RLS.
-- For client reads: only demo cases and public summary data are accessible.
-- future: Add user-scoped policies once auth.users is configured.
-- ============================================================

ALTER TABLE research_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_hypotheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_evidence_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_replay_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_trail_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- Phase 1 (pre-auth): Demo cases are publicly readable.
-- All writes require service-role key (server-side only).
-- User-scoped policies are documented for future auth phase.
-- ============================================================

-- research_cases: Allow public read of demo cases only
CREATE POLICY "Allow public read of demo cases"
  ON research_cases FOR SELECT
  USING (is_demo = TRUE);

-- research_cases: Authenticated users can read their own cases
CREATE POLICY "Users can read their own cases"
  ON research_cases FOR SELECT
  USING (auth.uid() = user_id);

-- research_sessions: Authenticated users can read their own sessions
CREATE POLICY "Users can read their own sessions"
  ON research_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- research_hypotheses: Accessible via session ownership
CREATE POLICY "Users can read hypotheses for their sessions"
  ON research_hypotheses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM research_sessions s
      WHERE s.id = research_hypotheses.session_id
      AND s.user_id = auth.uid()
    )
  );

-- research_experiments: Accessible via session ownership
CREATE POLICY "Users can read experiments for their sessions"
  ON research_experiments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM research_sessions s
      WHERE s.id = research_experiments.session_id
      AND s.user_id = auth.uid()
    )
  );

-- research_evidence: Accessible via session ownership
CREATE POLICY "Users can read evidence for their sessions"
  ON research_evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM research_sessions s
      WHERE s.id = research_evidence.session_id
      AND s.user_id = auth.uid()
    )
  );

-- research_evidence_edges: Accessible via session ownership
CREATE POLICY "Users can read evidence edges for their sessions"
  ON research_evidence_edges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM research_sessions s
      WHERE s.id = research_evidence_edges.session_id
      AND s.user_id = auth.uid()
    )
  );

-- research_claims: Accessible via session ownership
CREATE POLICY "Users can read claims for their sessions"
  ON research_claims FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM research_sessions s
      WHERE s.id = research_claims.session_id
      AND s.user_id = auth.uid()
    )
  );

-- research_memos: Accessible via session ownership
CREATE POLICY "Users can read memos for their sessions"
  ON research_memos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM research_sessions s
      WHERE s.id = research_memos.session_id
      AND s.user_id = auth.uid()
    )
  );

-- research_audit_events: Accessible via session ownership
CREATE POLICY "Users can read audit events for their sessions"
  ON research_audit_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM research_sessions s
      WHERE s.id = research_audit_events.session_id
      AND s.user_id = auth.uid()
    )
  );

-- research_replay_verifications: Accessible via case ownership
CREATE POLICY "Users can read replay verifications for their cases"
  ON research_replay_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM research_cases c
      WHERE c.id = research_replay_verifications.case_id
      AND c.user_id = auth.uid()
    )
  );

-- research_trail_events: Users own their trail entries
CREATE POLICY "Users can read their own trail events"
  ON research_trail_events FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-update updated_at on research_cases
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_research_cases_updated_at
  BEFORE UPDATE ON research_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
