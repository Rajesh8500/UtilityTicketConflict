# API & Data Requirements Quality Checklist: Utility Ticket Conflict & Service Area Validator

**Purpose**: Review completeness, clarity, consistency, and testability of API and source-data requirements
**Created**: 2026-10-27
**Feature**: [spec.md](../spec.md)

**Review Ownership**: This checklist is reviewer-owned. Mark an item `[x]` only when the requirement-quality criterion is satisfied.
**Marker Semantics**: `[x]` means the wording is adequate; it does not mean implementation work is complete.

## API Contract Completeness

- [ ] CHK001 - Does the contract identify `GET /api/tickets/conflicts`, required `bbox=minLng,minLat,maxLng,maxLat`, and optional `stationCode`, `utilityType`, and `radiusMeters` consistently? [Completeness, Spec §FR-001]
- [ ] CHK002 - Are bbox coordinate count, numeric finiteness, longitude/latitude ranges, ordering, and antimeridian policy all stated without contradictory rules? [Clarity, Spec §FR-002, Edge Cases]
- [ ] CHK003 - Are the 250-meter default, positive-finite validation, and no-maximum-radius decision stated consistently? [Consistency, Spec §FR-005, Clarifications]
- [ ] CHK004 - Does the response contract enumerate every required ticket and summary field with consistent spelling and nesting? [Completeness, Spec §FR-010–FR-011]
- [ ] CHK005 - Is the shared HTTP 400 error envelope defined for missing/invalid bbox and invalid radius, including field-specific reasons? [Completeness, Spec §FR-002, FR-005]
- [ ] CHK006 - Do the requirements distinguish invalid filters from valid but unmatched station/utility values and define the latter as empty results? [Clarity, Spec §FR-004, Edge Cases]

## Source Data and Acceptance Quality

- [ ] CHK007 - Does schema preservation explicitly cover all supplied table definitions, relationships, geometry/index definitions, seed rows, and sanity-check SQL without allowing silent replacement? [Completeness, Spec §FR-006]
- [ ] CHK008 - Is `utilityType` explicitly sourced through `station_codes`, and are ticket/service-area associations consistently tied through `station_code_id`? [Consistency, Spec §FR-004, FR-007, Key Entities]
- [ ] CHK009 - Are database initialization order and the expected 4 stations, 4 service areas, and 10 tickets specified as setup acceptance criteria? [Measurability, Spec §FR-006]
- [ ] CHK010 - Are the demo bbox result and all expected summary totals consistent wherever they appear: 9 total; HIGH 3; MEDIUM 4; LOW 2; outsideServiceArea 2; WATER 4; GAS 2; SANITARY 1; TELECOM 2? [Consistency, Spec §FR-003, FR-011, SC-001–SC-002]

## Notes

- These items evaluate the written API/data requirements, not endpoint execution or implementation correctness.
- Keep all items unchecked until a reviewer evaluates requirement quality; no implementation status is implied.
