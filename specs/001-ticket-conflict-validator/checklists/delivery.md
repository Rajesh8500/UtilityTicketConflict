# Frontend & Delivery Requirements Quality Checklist: Utility Ticket Conflict & Service Area Validator

**Purpose**: Review completeness and testability of UI, security, testing, setup, and optional-map requirements
**Created**: 2026-10-27
**Feature**: [spec.md](../spec.md)

**Review Ownership**: This checklist is reviewer-owned. Mark an item `[x]` only when the requirement-quality criterion is satisfied.
**Marker Semantics**: `[x]` means the wording is adequate; it does not mean implementation work is complete.

## Frontend Requirements

- [ ] CHK022 - Are bbox, station-code, utility-type, and radius inputs plus the search action explicitly required, with bbox order and radius default traceable to the API contract? [Completeness, Spec §FR-001, FR-005, FR-012]
- [ ] CHK023 - Does the spec require a real API-backed result source and explicitly exclude hardcoded demo results? [Completeness, Spec §FR-012]
- [ ] CHK024 - Are all required ticket table columns named consistently with the API response, including longitude/latitude, service-area status, nearest-emergency fields, and risk? [Consistency, Spec §FR-010, FR-013]
- [ ] CHK025 - Are loading, error, and empty states defined as distinct outcomes, including zero totals and no stale prior results? [Coverage, Spec §FR-014, User Stories 1 and 3]
- [ ] CHK026 - Are summary-card requirements traceable to every summary field, including outside-service-area and utility-type counts? [Completeness, Spec §FR-011, FR-014]
- [ ] CHK027 - Are keyboard operation, accessible labels, and text-identifiable risk requirements explicit and consistent? [Coverage, Spec §FR-013–FR-014, NFR-003]
- [ ] CHK028 - Does the optional-map scope clearly specify risk-identifiable markers and map-bounds-to-bbox behavior while keeping the map behind core dashboard verification? [Scope, Spec §FR-017, User Story 4]

## Security, Quality, and Delivery Requirements

- [ ] CHK029 - Are environment-based configuration, safe example values, parameterized data access, and client-safe error constraints stated without requiring real credentials in tracked files? [Completeness, Spec §FR-016, NFR-001]
- [ ] CHK030 - Are backend unit/integration and frontend component-test responsibilities mapped to the validation, risk, summary, request-state, and response-field requirements? [Traceability, Spec §FR-015]
- [ ] CHK031 - Are local prerequisites, database script order, UTC setup, API examples, test commands, and troubleshooting all required in setup documentation? [Completeness, Spec §FR-016, Plan §Configuration and Local Startup]
- [ ] CHK032 - Is the 19-of-20 searches within two seconds target scoped to the supplied ten-ticket local dataset and measurable from the user's submission to displayed results? [Measurability, Spec §NFR-004, SC-005]
- [ ] CHK033 - Are the expected demo counts identical across the requirements and plan: 9 total, HIGH 3, MEDIUM 4, LOW 2, outsideServiceArea 2, and utility totals WATER 4, GAS 2, SANITARY 1, TELECOM 2? [Consistency, Spec §FR-011, SC-001–SC-002]
- [ ] CHK034 - Are `byUtilityType` key rules for empty results and filters (empty object versus zero-valued known utilities) defined consistently in the user-facing spec and API contract? [Ambiguity, Spec §FR-011; Plan §Architecture and Dependencies]

## Notes

- This is a requirements/design-quality checklist, not an implementation test plan. It asks whether requirements and plan decisions are sufficiently complete and consistent; it does not mark code or tests as passing.
- Optional mapping remains deferred until the core dashboard and API meet their stated criteria.
- Keep all items unchecked until a reviewer evaluates requirement quality; no implementation status is implied.
