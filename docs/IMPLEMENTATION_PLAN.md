# PathLevel Implementation Plan

## 1. Purpose

This document translates the approved PathLevel product decisions and baseline audits into an implementation plan.

It is the primary implementation reference for coding work.

This document does not replace:

- `DECISIONS.md` — project and architectural decisions
- `PRD.md` — product requirements
- `ROADMAP.md` — product roadmap
- `PROJECT-STATUS.md` — current project status
- `STEP-1.md` through `STEP-5.md` — approved product/domain decisions

The implementation plan exists to define how the approved target will be implemented incrementally and safely.

---

# 2. Implementation Strategy

PathLevel will be extended incrementally.

A full rewrite is NOT planned.

The existing architecture should be preserved and extended:

- Express backend architecture
- Prisma + PostgreSQL
- authentication and ownership scoping
- `{ success, data }` API response pattern
- TanStack Query
- feature-folder frontend architecture
- existing shared UI primitives
- Tasks
- Habits
- XP
- Achievements

The implementation must preserve a working application after each slice.

Each implementation slice should be:

1. Focused
2. Independently testable
3. Small enough to review
4. Reversible where practical
5. Free from unrelated refactoring

---

# 3. Target Product Architecture

## Knowledge / Library

```text
Library
├── All
├── Resources
├── Notes
├── Inbox
├── Archived
└── Search
```

Resources are independent knowledge objects.

A Resource must not be duplicated when connected to Learning.

## Learning

```text
Learning Goal
└── Learning Unit
    ├── Resources
    ├── Learning Sessions
    └── Learning Summaries
```

Learning progress is based on the Learning domain.

Activity is not mastery.

## Supporting Layer

```text
Tasks
Habits
XP
Achievements
```

These remain part of PathLevel but should not dominate the product's primary information architecture.

---

# 4. Core Domain Rules

These rules must remain consistent throughout implementation.

### Resource Independence

A Resource exists independently from Learning.

Adding or removing a Learning relationship must not duplicate, move, or delete the Resource.

### Resource Status vs Progress

These are separate concepts.

```text
Library Status:
INBOX
SAVED
ARCHIVED

Resource Progress:
NOT_STARTED
IN_PROGRESS
COMPLETED
```

The existing `resources.completed` field must not simply be renamed.

### Existing Resource Migration

Existing Resources:

```text
completed = true
→ SAVED + COMPLETED

completed = false
→ SAVED + NOT_STARTED
```

Existing Resources must remain `SAVED`.

### Learning Summary Migration

Existing:

```text
learning_sessions.notes
```

must be preserved and migrated into Learning Summary records.

The existing Learning Sessions themselves must remain.

### Learning Progress

Do not equate:

```text
Session Activity = Mastery
Resource Progress = Learning Progress
Habit Streak = Learning Progress
Provider Progress = PathLevel Progress
```

These are separate concepts.

---

# 5. Approved Product Flows

## Capture Flow

```text
Capture
↓
Resource
↓
Inbox
↓
Review
├── Saved
├── Archived
└── Add to Learning
```

Capture should allow incomplete information.

At minimum, a Resource should be capturable from a title or URL without requiring complete metadata.

## Knowledge-First Learning Flow

```text
Resource
↓
Add to Learning
↓
Goal
↓
Unit
```

This is the primary quick path.

## Learning-First Flow

```text
Goal
↓
Unit
↓
Add Resource
↓
Library
```

Both directions must be supported.

## Learning Session Flow

```text
Learning Unit
↓
Learning Session
↓
Finish Session
↓
Optional Summary
```

A Summary is optional.

---

# 6. Implementation Slices

## Slice 0 — Foundation / Safety

### Objective

Make the existing backend safe and testable before domain expansion.

### Scope

- Repair backend test setup
- Ensure tests import real services
- Repair test runner
- Reconcile Achievement definition source
- Synchronize Achievement definitions at startup
- Deduplicate XP level calculation
- Make task/session XP handling transactional

### Constraints

Do not introduce:

- outbox
- reconciliation infrastructure
- event bus
- microservices
- unrelated refactoring

### Completion Criteria

- Existing achievement tests run against real services
- Test runner works
- XP logic uses the established service logic
- Achievement definitions synchronize correctly
- Task/session XP handling is atomic
- Existing behavior remains intact

---

## Slice 1 — Library / Resource Foundation

### Objective

Transform Resources from a bookmark-style CRUD feature into the foundation of the Library.

### Scope

- Resource Library status
- Resource Progress
- Archive
- Restore
- `/library` hub
- Resource filtering/views
- Resource metadata
- Replace the old completed checkbox model

### Migration

```text
completed = true
→ SAVED + COMPLETED

completed = false
→ SAVED + NOT_STARTED
```

### Completion Criteria

- Existing Resources remain accessible
- Status and progress are independent
- Archive/restore works
- Existing data is preserved
- Library can display Resources by status

---

## Slice 2 — Capture / Inbox

### Objective

Implement the capture-first workflow.

### Scope

- Global Capture action
- URL/title capture
- Incomplete metadata support
- Inbox
- Review actions
- Keep / Archive

### New Resource Behavior

New captures default to:

```text
INBOX
```

Existing Resources remain:

```text
SAVED
```

### Completion Criteria

```text
Capture
→ Inbox
→ Review
→ Saved / Archived
```

works end-to-end.

---

## Slice 3 — Learning Goals / Units + Relationships

### Objective

Build the core Learning domain.

### Scope

- Learning Goals
- Learning Units
- Goal → Unit hierarchy
- Goal progress
- Unit progress
- Resource ↔ Goal
- Resource ↔ Unit
- Resource-side Add to Learning
- Learning-side Add Resource

### Rules

- Goal may exist without Units
- Goal may exist without Resources
- Unit may exist without Resources
- Resource relationships must be detach-safe
- Removing a relationship must never delete the Resource

### Completion Criteria

A user can:

```text
Create Goal
→ Create Unit
→ Attach Resource
→ Remove Resource
→ Resource remains intact
```

---

## Slice 4 — Learning Sessions / Summaries

### Objective

Complete the Learning workflow.

### Scope

- Connect Sessions to Units
- Connect Sessions to Resources
- Finish Session
- Retrospective Sessions
- Optional Learning Summary
- Existing notes migration

### Migration

```text
learning_sessions.notes
→ Learning Summary
```

Existing sessions remain intact.

### Completion Criteria

```text
Goal
→ Unit
→ Resource
→ Session
→ Finish
→ Optional Summary
```

works end-to-end.

---

## Slice 5 — Search

### Objective

Implement deterministic global search.

### Phase 1

Search Resources.

### Later

Extend search to:

- Notes
- Goals
- Units
- Summaries

### Constraints

Use:

- keyword search
- PostgreSQL full-text search where appropriate

Do NOT implement:

- embeddings
- vector database
- RAG
- semantic search

### Completion Criteria

The global search can find Resources by relevant searchable fields while respecting user ownership.

---

## Slice 6 — Home / Navigation Restructure

### Objective

Make the application knowledge-first.

### Navigation

```text
Home
Library
Learning
Tasks
Habits
Achievements
```

Library and Learning should receive primary emphasis.

Tasks, Habits, and Achievements remain supporting features.

### Home Priority

```text
1. Continue Learning / Current Focus
2. Relevant Knowledge / Resurfacing
3. Recent Learning Activity
4. Tasks / Habits
5. Achievements / XP
```

### Completion Criteria

The Home screen reflects the approved product identity rather than functioning primarily as a gamified task dashboard.

---

# 7. Database Migration Rules

Migration must be non-destructive.

## Existing Tables

Preserve:

- users
- habits
- habit_completions
- tasks
- learning_sessions
- resources
- xp_transactions
- achievements
- user_achievements

## New Entities

Add:

- notes
- learning_goals
- learning_units
- learning_summaries

Add required junction tables for:

- Resource ↔ Unit
- Resource ↔ Goal
- Session ↔ Resource
- Note ↔ Unit

## Important Rule

Deleting a relationship must not delete shared domain entities.

For example:

```text
Remove Resource from Unit
≠
Delete Resource
```

---

# 8. Testing Strategy

Every slice must include tests for its critical behavior.

## Backend

Prioritize:

- ownership
- validation
- state transitions
- Resource status/progress
- archive/restore
- relationships
- Unit completion/reopen
- Goal progress
- Session completion
- Summary creation
- XP idempotency
- Achievement unlocking

## Frontend

Prioritize critical user flows:

- Capture
- Inbox review
- Archive/restore
- Add Resource to Learning
- Create Goal
- Create Unit
- Complete/Reopen Unit
- Finish Session
- Write/Skip Summary
- Search

Do not attempt exhaustive component testing before the core flows work.

---

# 9. Global Engineering Rules

## Backend Authority

Domain rules must be enforced by the backend.

The frontend must not become the source of truth for:

- progress
- ownership
- XP
- achievement unlocking
- state transitions
- relationships

## Preserve Data

Never perform destructive migration without an explicit approved mapping.

## Small Slices

Do not implement multiple unrelated slices in one task.

## Review Gates

After each slice:

1. Run tests
2. Run relevant checks
3. Verify the application
4. Review the diff
5. Stop

Do not automatically continue to the next slice.

---

# 10. Overengineering Guardrails

Do NOT introduce during the current implementation phase:

- RAG
- vector databases
- embeddings
- semantic search
- autonomous AI organization
- AI-generated curriculum
- AI mastery scoring
- provider synchronization
- OAuth integrations
- event buses
- message queues
- outbox/reconciliation infrastructure
- microservices
- unnecessary repository abstractions
- unnecessary global state
- complex recommendation engines
- leaderboards
- social features
- roadmap graphs
- focus-area XP

AI may be introduced later as an optional additive capability after the deterministic knowledge and learning model is stable.

---

# 11. Deferred Improvements

These are intentionally deferred:

- pagination hardening
- optimistic updates
- mobile navigation redesign
- modal accessibility hardening
- shared utility deduplication
- achievement text deduplication
- removal/reassessment of cached user XP/level

Do not pull deferred work into a current slice unless a concrete dependency requires it.

---

# 12. Implementation Priority

```text
P0
Slice 0 — Foundation / Safety

P1
Slice 1 — Library / Resource Foundation
Slice 2 — Capture / Inbox
Slice 3 — Learning Goals / Units + Relationships
Slice 4 — Sessions / Summaries
Slice 6 — Home / Navigation

P2
Slice 5 — Search

P3
Deferred improvements
```

The exact implementation order may be adjusted only when a concrete technical dependency requires it.

---

# 13. Definition of Done for Each Slice

A slice is NOT complete merely because the code compiles.

A slice is complete when:

- intended functionality is implemented
- relevant backend/domain tests pass
- relevant frontend behavior is verified
- existing functionality remains intact
- no unrelated refactoring was introduced
- database migration, if applicable, is verified
- no known critical regression remains
- the implementation matches the approved domain rules
- the working tree changes are understandable and scoped

After reaching this state, STOP and request review before continuing.

---

# 14. Current Implementation State

The four-stage baseline audit is complete.

Approved:

- Stage 1 — Database & Domain Model Audit
- Stage 2 — Backend & API Audit
- Stage 3 — Frontend Audit
- Stage 4 — Executive Summary & Action Plan

Current implementation phase:

```text
Not started
```

Next implementation task:

```text
Slice 0 — Foundation / Safety
```

The first coding subtask should focus on repairing the backend test foundation before changing product behavior.
