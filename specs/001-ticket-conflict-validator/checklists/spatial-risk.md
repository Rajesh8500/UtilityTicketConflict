# Spatial & Risk Requirements Quality Checklist: Utility Ticket Conflict & Service Area Validator

**Purpose**: Review clarity and edge-case coverage of spatial and risk requirements
**Created**: 2026-10-27
**Feature**: [spec.md](../spec.md)

**Review Ownership**: This checklist is reviewer-owned. Mark an item `[x]` only when the requirement-quality criterion is satisfied.
**Marker Semantics**: `[x]` means the wording is adequate; it does not mean implementation work is complete.

## Spatial Requirement Clarity

- [ ] CHK011 - Does the spec distinguish tickets returned by bbox/optional filters from emergency candidates, which are drawn from all database tickets? [Clarity, Spec §FR-003, FR-008, Assumptions]
- [ ] CHK012 - Are longitude-first coordinate order, SRID 4326, valid coordinate ranges, and inclusive bbox intersection stated consistently? [Consistency, Spec §FR-002–FR-003, Key Entities]
- [ ] CHK013 - Does service-area membership specify association through `station_code_id` and define coverage by any matching polygon as inside? [Completeness, Spec §FR-007, Edge Cases]
- [ ] CHK014 - Are polygon boundary points explicitly inside, and are tickets with no station assignment or no matching polygon explicitly outside? [Edge Case, Spec §FR-007, Edge Cases]
- [ ] CHK015 - Is nearest-emergency selection defined as the nearest qualifying other `EMERGENCY` ticket within the positive radius, independently of response filters? [Clarity, Spec §FR-008]
- [ ] CHK016 - Does the contract require both nearest-emergency fields to be null when no candidate qualifies and prevent a ticket from selecting itself? [Completeness, Spec §FR-008, Edge Cases]
- [ ] CHK017 - Is the required meter unit tied explicitly to geography-based distance/proximity, rather than ambiguous planar geometry units? [Clarity, Spec §FR-008, NFR-001]

## Risk and Time Semantics

- [ ] CHK018 - Are the HIGH, MEDIUM, and LOW rules complete, mutually understandable, and explicitly ordered so HIGH takes precedence? [Consistency, Spec §FR-009]
- [ ] CHK019 - Does overdue MEDIUM risk require `PRE_COMPLETED`, exclude null `due_at`, and avoid treating overdue status alone as sufficient? [Edge Case, Spec §FR-009, Edge Cases]
- [ ] CHK020 - Does the UTC convention cover the timezone-naive `due_at TIMESTAMP` for writes/imports and comparisons without changing the source column type? [Clarity, Spec §FR-009, Clarifications]
- [ ] CHK021 - Are time-boundary semantics for “past” clear enough to distinguish a due time equal to the current UTC time from one earlier than it? [Ambiguity, Spec §FR-009]

## Notes

- These items evaluate spatial/risk requirement wording and its testability, not the correctness of a spatial query or classifier implementation.
- Keep all items unchecked until a reviewer evaluates requirement quality; no implementation status is implied.
