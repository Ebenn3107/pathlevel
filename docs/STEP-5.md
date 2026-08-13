# STEP 5 — Implementation & Migration Plan

## Purpose

Translate the approved Steps 1–4 into an ordered, testable implementation plan for the existing PathLevel project.

Step 5 answers:

> **How do we safely turn the approved architecture into the new product?**

This step should produce implementation order, migration strategy, testing gates, and deployment/rollback rules.

---

# Step 5A — Implementation Strategy

Do not rewrite the entire application at once.

Use incremental implementation and preferably **vertical slices**:

```text
Domain / Database
        ↓
Backend / API
        ↓
Frontend
        ↓
Tests
        ↓
Validation
```

Each slice should produce a working capability before moving to the next one.

Avoid large periods where the project is partially broken.

---

# Step 5B — Establish Baseline

Before major changes:

```text
Current project
    ↓
Run existing tests
    ↓
Verify application starts
    ↓
Verify database connection
    ↓
Verify current authentication
    ↓
Verify current deployment/build
```

Record the current baseline.

The existing application must have a known-good state that can be compared against after each major migration.

---

# Step 5C — Implementation Order

Recommended high-level order:

```text
1. Domain/database foundation
2. Core Resource + Library model
3. Capture + Inbox
4. Review + relationships
5. Learning Goal / Unit
6. Learning Sessions + Summaries
7. Search
8. Home / Dashboard redesign
9. Tasks / Habits / Gamification adaptation
10. AI enrichment / suggestions
11. Advanced resurfacing
12. Cleanup / optimization
```

This order can be adjusted after auditing the actual codebase.

The principle is:

> Implement foundational dependencies before dependent UI features.

---

# Step 5D — Database Migration

Create migrations from the current schema to the approved domain model.

For each migration:

```text
Current schema
      ↓
Migration
      ↓
Data transformation
      ↓
Validation
      ↓
Target schema
```

Requirements:

- preserve existing user data where possible
- avoid destructive migrations without verified backups
- validate row counts and relationships
- test migrations against a copy of realistic data
- document irreversible operations

Do not remove old structures until the new model is verified.

---

# Step 5E — Resource & Library Slice

Implement the new knowledge foundation first.

Scope:

```text
Resource
Note
Library
Inbox
Archive
```

Core capabilities:

```text
Create Resource
Edit Resource
View Resource
Archive Resource
Restore Resource
Search/browse Resource
Create Note
Edit Note
Archive/restore Note
```

Acceptance:

```text
Resource can exist independently.
Resource can be saved with incomplete metadata.
Resource remains available after Learning relationships are removed.
```

---

# Step 5F — Capture Slice

Implement the primary capture workflow:

```text
+ Capture
    ↓
URL / file / text
    ↓
Save
    ↓
Inbox
```

Requirements:

- minimal input
- no forced organization
- no forced AI
- no forced summary
- no forced Learning relationship
- user remains in the previous context after global capture

Metadata enrichment should happen after or alongside save without blocking the core operation.

---

# Step 5G — Review & Relationship Slice

Implement:

```text
Inbox
    ↓
Review
    ├── Keep Saved
    ├── Archive
    └── Add to Learning
```

Support:

```text
Quick review
Full review
Edit metadata
```

Implement Resource ↔ Learning relationships without duplicating Resources.

Support:

```text
Resource → multiple Learning contexts
Goal → Unassigned Resources
```

---

# Step 5H — Learning Goal / Unit Slice

Implement Goal-first and Knowledge-first flows.

Core capabilities:

```text
Create Goal
Edit Goal
Archive Goal
Create Unit
Edit Unit
Complete Unit
Reopen Unit
Add Resource to Goal
Add Resource to Unit
Remove Resource relationship
```

A Goal must be valid without Units or Resources.

A Unit must be able to exist with no Resources.

Unassigned Resources must be supported.

---

# Step 5I — Learning Session Slice

Implement:

```text
Start Session
Log Retrospective Session
Finish Session
```

Sessions may reference multiple Resources.

Session data should include the minimum information required by the approved domain model.

Do not make sessions mandatory for consuming Resources.

---

# Step 5J — Learning Summary Slice

After a Session:

```text
Finish Session
      ↓
Optional Summary
      ↓
Save or Skip
```

Requirements:

- summary is optional
- no minimum length requirement
- session remains valid if summary is skipped
- summaries remain associated with the appropriate Learning context/session

---

# Step 5K — Progress & Completion

Implement the approved separation:

```text
Resource Progress
Learning Unit Progress
Learning Goal Progress
Provider Progress
Session Activity
Habit Streak
XP
Achievement
```

Define and test the source of truth for each.

Important rules:

```text
Provider progress ≠ PathLevel Learning progress
Habit streak ≠ Learning progress
Activity ≠ Mastery
```

Completion must be user-driven where specified.

Reopening a Unit must not destroy historical Sessions/Summaries.

---

# Step 5L — Search Slice

V1 Search should work without AI.

Implement:

```text
Global Search
    ↓
Keyword / Full-text Search
    ↓
Resources
Notes
Learning
Summaries
```

Search results should preserve relevant context and relationships.

Do not introduce semantic search, embeddings, or a vector database before there is a concrete requirement.

---

# Step 5M — Home / Dashboard Slice

After the underlying capabilities exist, redesign Home around context.

Recommended hierarchy:

```text
1. Continue Learning / Current Focus
2. Relevant Knowledge / Resurfacing
3. Recent Activity
4. Tasks / Habits
5. Achievements / XP
```

Home should not become another feature inventory.

Validate that the dashboard remains useful for:

```text
User with Learning
User without Learning
User who mainly uses Library
New user
Returning user
```

---

# Step 5N — Existing Tasks / Habits / Gamification

Do not delete these systems merely because they are no longer the product center.

Adapt their position and relationships.

Tasks:

```text
Supporting productivity layer
```

Habits:

```text
Behavioral consistency layer
```

XP:

```text
Reward layer
```

Achievements:

```text
Milestone layer
```

Revalidate XP anti-abuse rules during this phase.

Do not award XP simply for opening the application or repeatedly triggering meaningless events.

---

# Step 5O — AI Enrichment

AI should be implemented only after the non-AI flow works.

Potential first AI capabilities:

```text
Metadata enrichment
Topic suggestions
Learning relationship suggestions
Learning structure suggestions
```

Flow:

```text
User Data
   ↓
Deterministic Extraction
   ↓
AI only when useful
   ↓
Suggestion
   ↓
User Confirmation
```

AI output must remain editable and non-authoritative.

Core application behavior must work when AI is unavailable.

---

# Step 5P — Advanced Resurfacing / Semantic Features

Treat these as later capabilities:

```text
Semantic Search
Embeddings
RAG
AI Knowledge Assistant
Semantic Resurfacing
```

Only implement after:

```text
Library
Search
Learning relationships
Content quality
```

are stable.

Do not build RAG merely because it is technically interesting.

It should solve a demonstrated retrieval problem in the user's knowledge base.

---

# Step 5Q — Frontend Implementation Rules

Frontend changes should follow the approved UX rather than forcing the existing UI structure to remain intact.

Priorities:

```text
Capture
Library
Learning
Search
Home
```

Avoid recreating the old dashboard as a collection of widgets.

Use shared components where they genuinely reduce duplication, but avoid premature generic abstractions.

---

# Step 5R — Backend/API Implementation Rules

Backend should enforce domain rules rather than relying only on frontend validation.

Examples:

```text
Resource relationship constraints
Valid Unit state transitions
Ownership
Archive/delete rules
Completion rules
XP event validation
```

Frontend should provide good UX, but the backend remains the authority for data integrity.

---

# Step 5S — Testing Gates

Every major implementation slice should pass a gate before the next dependent slice begins.

Minimum levels:

```text
Unit / domain tests
API integration tests
Database/migration tests
Frontend tests where valuable
Manual end-to-end validation
```

Important scenarios:

```text
Capture with incomplete metadata
Resource linked to multiple Units
Goal with Unassigned Resources
Resource detached from Learning
Completed Unit reopened
Session with multiple Resources
Session without Summary
Retrospective Session
Search without AI
AI failure
Migration of existing data
```

---

# Step 5T — Migration & Rollback Strategy

Before destructive changes:

```text
Backup
↓
Migration
↓
Validation
↓
Application verification
```

For high-risk migrations:

```text
Old data
   ↓
New structure
   ↓
Compare
   ↓
Approve
   ↓
Switch application behavior
```

Maintain a rollback path where practical.

Do not combine unrelated high-risk migrations into one deployment if they can be separated.

---

# Step 5U — Deployment Strategy

Recommended sequence:

```text
Local Development
    ↓
Automated Tests
    ↓
Staging / Preview
    ↓
Migration Validation
    ↓
Production
    ↓
Smoke Test
```

After deployment verify at minimum:

```text
Application starts
Database connects
Authentication works
Capture works
Library works
Learning works
Search works
Existing critical features still work
```

---

# Step 5V — Definition of Done

A feature is not complete merely because the UI exists.

A vertical slice is done when:

```text
Database
✓

Backend/domain logic
✓

API
✓

Frontend
✓

Validation
✓

Tests
✓

Migration impact reviewed
✓

Manual flow verified
✓
```

For migrated functionality:

```text
Existing data preserved
✓

Existing critical functionality verified
✓

Rollback path considered
✓
```

---

# Step 5W — Implementation Tracking

Track implementation as:

```text
NOT STARTED
IN PROGRESS
BLOCKED
READY FOR TEST
DONE
DEFERRED
```

For each task record:

```text
Feature
Files/modules affected
Database migration
API changes
Frontend changes
Tests
Dependencies
Risk
Status
```

Do not start implementation tasks whose domain requirements are still undecided.

---

# Step 5X — Recommended Implementation Phases

A practical high-level sequence:

## Phase 1 — Foundation

```text
Current architecture audit
Database migration foundation
Resource / Note model
Library
```

## Phase 2 — Capture

```text
Capture
Inbox
Metadata enrichment baseline
Review
Archive
```

## Phase 3 — Learning

```text
Learning Goals
Learning Units
Relationships
Unassigned Resources
Sessions
Summaries
Completion
Progress
```

## Phase 4 — Discovery

```text
Global Search
Contextual resurfacing baseline
Home redesign
```

## Phase 5 — Supporting Systems

```text
Tasks
Habits
XP
Achievements
```

## Phase 6 — AI

```text
AI metadata enrichment
AI topic suggestions
AI Learning suggestions
AI structure suggestions
```

## Phase 7 — Future Intelligence

```text
Semantic Search
Embeddings
RAG
AI Knowledge Assistant
Advanced Resurfacing
```

The exact order may change after the current codebase audit.

---

# Step 5Y — Final Output

Before implementation begins, Step 5 should produce:

```text
1. Ordered implementation phases
2. Database migration sequence
3. Backend/API task sequence
4. Frontend task sequence
5. Testing gates
6. Deployment sequence
7. Rollback strategy
8. Existing-feature adaptation plan
9. AI deferral/integration plan
10. Definition of Done
11. Task-level implementation checklist
```

---

# Step 5 Boundary

Step 5 defines:

> **What should be built, in what order, how it should be migrated, and how we verify it.**

It does not mean the implementation has already happened.

After Step 5 is approved, the project can move into actual implementation.

The implementation should then follow the approved plan rather than continuously redesigning the product during coding.
