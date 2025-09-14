# Semantic Layer Audit (Pre–Re-hosting)

Date: 2025-09-13
Reviewer: Codex CLI
Scope: Catalog sources → queries → business terms (+ metadata); no unified API facade changes.

## Executive Summary

- Coverage: foundational pieces exist (sources, terms, rules, lineage, UI, OPA policy, semantic-debt scaffolding).
- Gaps: missing explicit capabilities, identity/crosswalks, time/currency semantics, output contracts, equivalence tests, governance changelogs, and interop manifest.
- Top 5 fixes (high ROI):
  1) Add source capabilities + latency/freshness metadata and owners.
  2) Formalize term schema (namespaced IDs, definitions, synonyms, grain, default window).
  3) Define output contracts per term (JSON Schema) and lock shapes.
  4) Add equivalence + constraint tests with golden samples across sources.
  5) Introduce manifest.json export and basic governance (changelogs, CODEOWNERS).

---

## 1) Source inventory & capabilities

Evidence:
- `config/data/sources.json:1` contains three sources with minimal metadata; missing owner, auth, refresh cadence, timezone, fiscal calendar, capabilities (joins, filters, pagination, limits), and cost/latency hints beyond ad-hoc fields.

Findings:
- Partial inventory only; capabilities and SLAs not modeled. No schema snapshots per refresh.

Actions:
- Extend source spec to include: owner, auth method, `capabilities` (joins, serverFilters, pagination, maxLimit), `sla` (rpo, rto), `timezone`, `fiscalCalendar`, `latencyHints`, `costHints`.
- Persist discovery snapshots (objects/fields) per refresh for drift comparison.

## 2) Business terminology registry

Evidence:
- `config/data/terms.json:1` shows `id` like `t_active_customer` (not namespaced), minimal definitions, no synonyms/aliases, no grain/default window/caveats, and no review cadence/deprecation.
- Core supports governance in `packages/core/src/types.ts:18` but is unused in data.

Findings:
- IDs and metadata insufficient for AI tooling semantics.

Actions:
- Adopt namespaced IDs (e.g., `customer.active`). Add `businessDefinition`, `grain`, `defaultWindow`, `units`, `synonyms`, `domain`, `caveats`, and `governance.reviewCycle`.

## 3) Term ↔ query mapping specs

Evidence:
- `config/data/rules.json:1` maps term→source with `expression` and `fieldMappings`; parameters, assumptions, preferred/fallback source are missing.
- `config/data/queries.json:1` captures ad-hoc queries; no per-term candidate set.

Findings:
- Hidden filters live in rules; not declared at the term-level.

Actions:
- For each term, enumerate candidate queries per source with `parameters` (types/defaults), `assumptions`, and mark `preferred` vs `fallbacks` with rationale.

## 4) Identity & entity resolution (lightweight)

Evidence:
- No canonical keys or crosswalk definitions present. Connectors expose object fields but no entity model.

Findings:
- Risk of mismatched joins and duplicate entities.

Actions:
- Define canonical keys (`customer_id`, `account_id`) and crosswalks (e.g., SFDC `Account.Id` ↔ DB `customers.customer_id`), plus join rules and dedupe strategy. Maintain a synonymy/homonymy mapping.

## 5) Time & currency semantics

Evidence:
- Contract allows `constraints.timezone` in `packages/core/src/types.ts:35`, but config doesn’t set org timezone/fiscal calendar. Terms lack default windows and currency handling.

Findings:
- Ambiguity around windows, fiscal vs calendar, and FX.

Actions:
- Set org `timezone` and `fiscalCalendar`. Add per-term `defaultWindow` and currency semantics (source currency, conversion date, fx table).

## 6) Output contracts (pre-API)

Evidence:
- No JSON Schemas for term outputs; `queries.json` selects fields ad hoc.

Findings:
- Response shapes can drift; no required/optional markers; no per-field lineage pointer.

Actions:
- Author JSON Schema per term output (required/optional, units/enums). Attach lineage pointers (source/query/field) and lock contracts even if producers change.

## 7) Equivalence & validation tests

Evidence:
- Only integrity check is `scripts/check-config.js:1` (references exist). No golden samples or equivalence tests.

Findings:
- No automated guardrails on semantic equivalence, constraints, or freshness.

Actions:
- Create golden datasets and implement: cross-source equivalence tests (exact/tolerance), constraint tests (not_null, unique, enums, row bounds), and freshness checks tied to terms.

## 8) Conflict detection & precedence

Evidence:
- No explicit collision detection or precedence configuration for term/source disagreement. Drift detection exists for schema in `packages/semantic-debt/src/driftDetector.ts:1`.

Findings:
- Silent semantic drift risk; no tie-break rules.

Actions:
- Detect name/definition collisions and require domain scoping. Define precedence (preferred source, tie-break rules) and emit warnings on definition change.

## 9) Governance & change management

Evidence:
- Config-as-code present under `config/data/*`. No per-term changelog, CODEOWNERS, review checklist, or deprecation workflow.

Findings:
- Changes are not traceable at term granularity.

Actions:
- Add per-term changelogs, `CODEOWNERS`, PR review checklist, and deprecation workflow with sunset dates and replacements.

## 10) Observability (semantic)

Evidence:
- Semantic-debt scaffolding exists (`packages/semantic-debt/*`) and UI pages; usage counters in `queries.json` but no undefined-term search rate, synonym collisions, or drift count metric aggregation.

Findings:
- Metrics incomplete and not persisted over time.

Actions:
- Persist term coverage, undefined-term searches, synonym collisions, drift incidents, per-term freshness and last-validated timestamps.

## 11) Docs & discoverability

Evidence:
- README and UI screenshots; LLM context bundle in `packages/core/src/contextBundle.ts:6`. No auto-generated semantic catalog or impact view.

Findings:
- Docs not derived from specs; impact analysis manual.

Actions:
- Auto-generate a semantic catalog (terms, definitions, synonyms, parameters, lineage) and an impact view (dashboards/notebooks usage) from registry + lineage.

## 12) Interop & importers

Evidence:
- OpenAPI codegen exists. No dbt metrics/LookML importers. No manifest.

Findings:
- Hard to integrate with external tools early.

Actions:
- Define/export a minimal `manifest.json` (terms, synonyms, parameters, contracts, lineage refs). Keep IDs stable; plan for dbt/LookML import mapping.

## 13) Ready-for-next-phase breadcrumbs

Evidence:
- No materialization hints; partial latency hints in lineage but not linked to terms.

Findings:
- Lacks guidance for future API re-hosting.

Actions:
- Add per-term preferred materialization (live vs cached), attach cost/freshness hints, and sketch function/tool schemas for later exposure.

---

## Prioritized Action Plan (2–3 weeks)

Week 1 (Modeling & Contracts)
- Extend source and term schemas; backfill owners, capabilities, timezone/fiscal. Create output JSON Schemas for top 10 terms.

Week 2 (Testing & Governance)
- Add golden samples and equivalence/constraint tests. Implement change logs and CODEOWNERS. Add precedence rules and drift warnings on definition changes.

Week 3 (Interop & Observability)
- Generate `manifest.json`. Persist semantic metrics and expose in UI. Add impact view and search for undefined terms/synonyms.

---

## Concrete Next Steps in Repo

- New schemas and templates added in this PR:
  - `config/schemas/source.schema.json`
  - `config/schemas/term.schema.json`
  - `config/manifest.example.json`

- Suggested follow-ups:
  - Add `config/schemas/output-contract.schema.json` per term as you formalize outputs.
  - Introduce `CODEOWNERS` and `docs/semantic-layer/review-checklist.md`.
  - Create `tests/semantic-equivalence/` with golden datasets.

