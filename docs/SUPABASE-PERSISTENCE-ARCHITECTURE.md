# BLACKBOX X — Supabase Persistence Architecture

> **Authoritative reference** for the persistence layer introduced in Phase 5.
> All future maintainers must read this document before touching any file under
> `src/core/persistence/` or `src/lib/supabase/`.

---

## 1. Philosophy & Design Invariants

| # | Invariant | Rationale |
|---|-----------|-----------|
| 1 | **Quantitative results are NEVER re-derived from Supabase.** | Supabase holds *metadata*. Source of truth is always: Local Engines → Research Artifact → Persistence. |
| 2 | **`SUPABASE_SERVICE_ROLE_KEY` never reaches the browser.** | Server-only security boundary enforced by `src/lib/supabase/server.ts`. Vite's `envPrefix` config whitelists only `VITE_` vars. |
| 3 | **Raw Monte Carlo path matrices are never persisted.** | 10 000 × 252 floats ≈ 20 MB per case. Only summary statistics (percentiles, VaR, seed) are stored. The seed alone is sufficient to reproduce paths. |
| 4 | **`directEvidence` is strictly separate from `interpretation`.** | `direct_evidence` column = verbatim observed facts. `interpretation` column = analyst inference. Never merge. |
| 5 | **Offline-first: the app must work with no Supabase connection.** | `saveResearchCase` and `listResearchCases` catch network errors and degrade gracefully with `source: 'LOCAL'`. |
| 6 | **Sealed cases are immutable.** | `evolveCaseStatus` guards status transitions. Once `SEALED`, direct mutation is rejected. |
| 7 | **Demo cases are tagged `is_demo = true`.** | Enables RLS policy "Allow public read of demo cases". Keeps demo data isolated from user research. |
| 8 | **Audit hash chain fields are always preserved verbatim.** | `event_hash` and `previous_event_hash` must never be stripped, recomputed, or null-coerced. |

---

## 2. Layer Architecture

```
Browser (React)
│
├── src/lib/supabase/client.ts          ← ANON KEY only; safe for browser
│       isSupabaseConfigured()
│       supabase client (public RLS)
│
├── src/core/persistence/
│   ├── persistenceTypes.ts             ← DB row interfaces
│   ├── compactSerializers.ts           ← domain → compact payload
│   ├── supabaseMappers.ts              ← compact payload → DB row
│   └── researchPersistenceService.ts   ← orchestrates save/list/load
│
└── src/components/workspace/.../
    └── ResearchCaseView.tsx            ← "Save Case" trigger + status badge

Server / Edge Functions (never in browser)
│
└── src/lib/supabase/server.ts          ← SERVICE ROLE KEY; Node.js only
        createSupabaseServerClient()
```

---

## 3. Security Boundary

### 3.1 Client (`src/lib/supabase/client.ts`)

- Uses **`VITE_SUPABASE_ANON_KEY`** — intentionally public.
- All queries run under Row Level Security (RLS) policies.
- `isSupabaseConfigured()` is the runtime guard: if either env var is absent, the persistence layer silently operates offline.

### 3.2 Server (`src/lib/supabase/server.ts`)

- Uses **`SUPABASE_SERVICE_ROLE_KEY`** — bypasses RLS; must NEVER be imported from any browser bundle.
- TypeScript enforces this via `typeof window !== 'undefined'` guard that throws on browser import.
- Only callable from Vite API plugin (`/api/*` routes) or edge functions.

### 3.3 Secret Stripping (`stripSecrets`)

Any object saved to Supabase first passes through `stripSecrets()` in `compactSerializers.ts`:

```typescript
// Keys matching these patterns are replaced with '[REDACTED_BY_PERSISTENCE_POLICY]':
// 1. Exact: secret, token, password, passwd, bearer, credential, cert, private
// 2. Ends-with 'key' (length > 3): apikey, servicekey, anonkey — NOT 'keys'
// 3. Contains: apikey, secretkey, servicetoken, authtoken, accesstoken
```

**Important:** `auth` is intentionally NOT a secret pattern — it commonly refers to an auth config object whose *contents* may include secrets. Those inner fields are caught by the recursive pass.

---

## 4. Database Schema (11 Tables)

Migration file: `supabase/migrations/20260920000000_research_persistence.sql`

| Table | Purpose |
|---|---|
| `research_sessions` | One row per ResearchSession (BBX-SESS-…) |
| `research_cases` | One row per sealed ResearchCase (BBX-CASE-…) |
| `research_hypotheses` | One row per hypothesis, `order_index` preserved |
| `research_experiments` | One row per experiment node |
| `research_evidence` | One row per EvidenceRecord; strict `direct_evidence`/`interpretation` split |
| `research_claims` | One row per ResearchClaim; `evidence_ids` is a JSONB array |
| `research_memos` | One row per ResearchMemo; `memo` is structured JSONB (not prose) |
| `research_audit_events` | One row per AuditEvent; `event_hash` + `previous_event_hash` form the tamper-evident chain |
| `research_replay_verifications` | One row per ReplayVerificationRecord; uses `CANONICAL_EXACT` vocabulary |
| `research_contradictions` | One row per ContradictionRecord |
| `research_secondary_tests` | One row per SecondaryTestRecord |

### Key Column Constraints

```sql
-- Cases
case_id         TEXT PRIMARY KEY    -- format: BBX-CASE-YYYY-NNNN
is_demo         BOOLEAN NOT NULL DEFAULT FALSE
fingerprint     TEXT                -- canonicalOutputFingerprint from reproducibilityMetadata

-- Evidence (strict separation enforced at INSERT)
direct_evidence TEXT NOT NULL
interpretation  TEXT

-- Audit events (tamper-evident chain)
event_hash          TEXT
previous_event_hash TEXT

-- Replay verifications (correct vocabulary)
comparison_class TEXT  -- EXACT | CANONICAL_EXACT | NUMERICAL_TOLERANCE
                       -- NOT 'BIT-IDENTICAL'
```

### RLS Policies

```sql
-- Users can only read/write their own cases
"Users can read their own cases"        → user_id = auth.uid()
"Users can insert their own cases"      → user_id = auth.uid()

-- Demo cases are publicly readable (no auth required)
"Allow public read of demo cases"       → is_demo = TRUE
```

---

## 5. Serialization Pipeline

```
ResearchCase (domain type)
        │
        ▼ compactSerializers.ts
        │
        ├── compactMonteCarloResult()    ← strips paths/allPaths/pathMatrix
        ├── serializeEvidenceRecord()    ← preserves direct_evidence ≠ interpretation
        ├── serializeResearchClaim()     ← value serialized as string (polymorphism-safe)
        ├── serializeResearchMemo()      ← sections as JSONB object, not prose
        ├── serializeAuditEvent()        ← strips secrets from payload; preserves hash chain
        └── serializeReplayVerification() ← uses rec as any for extended fields
        │
        ▼ supabaseMappers.ts
        │
        ├── mapCaseToCaseRow()           ← fingerprint = canonicalOutputFingerprint
        ├── mapHypothesisToRow()         ← order_index from caller
        ├── mapEvidenceToRow()           ← session_id must be DB UUID (not BBX string ID)
        ├── mapClaimToRow()
        ├── mapAuditEventToRow()         ← event_order overrides serialized value (placed after spread)
        └── mapReplayVerificationToRow() ← overall_match_pct from fingerprintMatchPct
        │
        ▼ researchPersistenceService.ts
        │
        └── saveResearchCase()           ← Upserts all 11 tables in one transaction
            listResearchCases()          ← Falls back to LOCAL on network error
            loadResearchCase()           ← Fetches from Supabase or local store
```

---

## 6. Offline-First Fallback

`researchPersistenceService.ts` follows this priority order for every operation:

```
1. Attempt Supabase operation
2. On network error / misconfiguration → catch, log "[LOCAL ONLY mode]"
3. Fall back to globalResearchCaseStore (in-memory + localStorage)
4. Return result with source: 'LOCAL' | 'SUPABASE'
5. Never throw to the caller — offline must not crash the app
```

The `PersistenceStatusBadge` component reflects this:

- 🟢 **Synced** — last save was to Supabase
- 🟡 **Local only** — Supabase not configured or unreachable
- 🔴 **Error** — last save failed (error message shown inline)
- ⏳ **Saving…** — in-flight

---

## 7. Type Casting Conventions

Two domain types have stricter interfaces than what the DB rows require. Forward-compatible fields use `as any` casts with clear comments:

| Location | Field | Reason |
|---|---|---|
| `compactSerializers.ts` | `(event as any).order` | `AuditEvent` type doesn't include `order`; it's an optional extension added by `AuditTimelineLedger` |
| `compactSerializers.ts` | `(event as any).eventHash` | Same — hash chain fields added at runtime |
| `compactSerializers.ts` | `rec.comparisonClass` | `ReplayVerificationRecord` interface doesn't include `comparisonClass`; it's added by `verifyReplayExecution` |
| `compactSerializers.ts` | `rec.fingerprintMatchPct` | Same origin as above |

These are intentional and documented. Do NOT widen the domain types unless the audit architecture is updated accordingly.

---

## 8. Test Coverage

File: `tests/supabasePersistence.test.ts` — **85 assertions, 0 failures**

| Area | What is tested |
|---|---|
| 1. Secret Stripping | Top-level, nested, array secrets; primitives and null |
| 2. MC Path Exclusion | paths/allPaths/pathMatrix absent; statistics present |
| 3. Evidence Separation | direct_evidence ≠ interpretation; no cross-contamination |
| 4. Serialization | Claim value as string; memo as object; disclaimer verbatim |
| 5. Case Mapper | case_id, status, is_demo, dataset bounds, fingerprint |
| 6. Hypothesis Order | order_index preserved; session DB UUID bound |
| 7. Evidence DB UUID | session_id is DB UUID (not BBX string ID) |
| 8. Offline Fallback | No throw on ECONNREFUSED; source='LOCAL' returned |
| 9. Audit Chain | event_hash + previous_event_hash preserved; chain fields in row |
| 10. Replay Vocab | comparison_class = CANONICAL_EXACT, not BIT-IDENTICAL |
| 11. Claim Binding | All evidenceIds preserved in row |
| 12. Demo Isolation | is_demo=true/false/default; isSupabaseConfigured safe |

Run individually: `npm run test:persistence`
Run as part of full suite: `npm test`

---

## 9. Setup Checklist (New Developer)

1. **Copy `.env.example` to `.env.local`** and fill in:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...   ← never prefix with VITE_
   ```

2. **Run the migration:**
   ```bash
   supabase db push
   # or
   psql $DATABASE_URL < supabase/migrations/20260920000000_research_persistence.sql
   ```

3. **Verify offline mode still works** (remove `.env.local` and confirm app loads without errors).

4. **Run the test suite:** `npm test`

---

## 10. Adding New Persisted Fields

When the domain types gain new fields that need persistence:

1. Add a column to the relevant table in a new migration file.
2. Add the field to the corresponding `*Row` interface in `persistenceTypes.ts`.
3. Add serialization in `compactSerializers.ts` (include in the corresponding `serialize*` function).
4. Add the field to the mapper in `supabaseMappers.ts`.
5. Add a test assertion in `tests/supabasePersistence.test.ts`.
6. Update this document.

> [!WARNING]
> Never remove or rename an existing column in a migration. Always add new columns and deprecate old ones with a migration comment.
