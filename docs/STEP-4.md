# STEP 4 — Technical Architecture & Database Design

## Purpose

Translate the approved **Step 1 — Product Foundation**, **Step 2 — Product UX & Core Flows**, and **Step 3 — Domain & Data Model** into a practical technical architecture for the existing PathLevel project.

This step is about **how the approved product/domain model should be implemented**.

It is not yet the implementation phase.

---

# Step 4A — Audit Current Architecture

Before changing anything, inspect the current project.

Review:

```text
Frontend
Backend
Database
API
Authentication
Validation
Middleware
State management
File/storage handling
Deployment
Docker
Environment configuration
Testing
```

For each major area determine:

```text
KEEP
MODIFY
REPLACE
ADD
REMOVE
```

Do not redesign components that already satisfy the approved model.

The goal is to evolve the existing project rather than rebuild everything unnecessarily.

---

# Step 4B — Database / Schema Design

Translate the approved domain entities and relationships into the current database technology.

Define:

- tables/models
- primary keys
- foreign keys
- junction tables
- nullable vs required fields
- unique constraints
- indexes
- timestamps
- soft-delete/archive strategy where required

The schema must support:

```text
Resource
Note
Learning Goal
Learning Unit
Learning Session
Learning Summary
Task
Habit
Achievement
XP Event
```

Only include entities that survive the Step 3 domain review.

---

# Step 4C — Relationship Implementation

Implement the relationships established in Step 3.

Important cases:

```text
Learning Goal
    ↓
Learning Units
```

```text
Resource ↔ Learning Unit
```

```text
Resource ↔ Learning Goal
```

```text
Session ↔ Resource
```

The design must support multiple relationships without duplicating the underlying Resource.

Example:

```text
Resource A
 ├── Learning Unit A
 └── Learning Unit B
```

Do not create duplicate Resource records simply to represent different Learning contexts.

---

# Step 4D — State & Lifecycle Implementation

Translate domain states into database/API behavior.

Examples:

```text
Resource:
Inbox → Saved → Archived
```

```text
Learning Unit:
Not Started → In Progress → Completed
                         ↓
                      Reopened
```

Define:

- allowed transitions
- validation rules
- archive/restore behavior
- detach behavior
- delete behavior
- cascading rules

Avoid accidental destructive cascades.

Example:

```text
Delete Resource
→ remove Learning relationships
→ keep Learning Goal
→ keep Learning Unit
```

The exact lifecycle of Sessions, Summaries, Notes, and relationships must follow the approved Step 3 decisions.

---

# Step 4E — Progress Architecture

Define the source of truth for each progress concept.

Keep separate:

```text
Resource Progress
Learning Unit Progress
Learning Goal Progress
Learning Session Activity
Habit Streak
XP
Achievement
Provider Progress
```

Determine which values are:

```text
Stored
```

and which are:

```text
Derived
```

Avoid duplicate sources of truth.

Example:

```text
Goal Progress
= derived from Unit state
```

if that remains consistent with the approved domain rules.

Provider progress must remain separate from PathLevel Learning progress.

---

# Step 4F — API Architecture

Review existing API conventions and extend them consistently.

Define endpoint/resource boundaries for:

```text
Resources
Notes
Learning Goals
Learning Units
Learning Sessions
Learning Summaries
Search
Tasks
Habits
Achievements
XP
```

For each major operation define:

```text
GET
POST
PATCH
DELETE / ARCHIVE
```

where appropriate.

API design should reflect domain ownership rather than UI pages.

Example:

```text
POST /learning-goals
POST /learning-goals/:id/units
POST /resources/:id/learning-links
POST /learning-units/:id/sessions
```

Exact endpoint naming should be decided after auditing the current API conventions.

---

# Step 4G — Search Architecture

V1 Search must work without AI.

Recommended baseline:

```text
Database Full-Text / Keyword Search
```

Search should cover the textual knowledge model.

Potential searchable data:

```text
Resource title
Resource description/content
Note title/content
Topics
Learning Goal
Learning Unit
Learning Summary
```

Search results should preserve context.

Future architecture may add:

```text
Embeddings
Semantic Search
Vector Store
RAG
```

but these should remain decoupled from the V1 core search path.

Do not introduce a vector database simply because AI is planned for the future.

---

# Step 4H — AI Integration Boundary

AI must remain an assistive service, not a dependency of the core application.

Potential AI jobs:

```text
Metadata enrichment
Topic suggestions
Learning relationship suggestions
Learning structure suggestions
Semantic retrieval
RAG
```

Separate:

```text
Authoritative user data
        ≠
AI-generated data
```

AI-generated output should be:

- editable
- replaceable
- regenerable
- safe to ignore

Core operations must still work if:

```text
AI provider unavailable
API key unavailable
AI request fails
AI output is incorrect
```

Avoid calling an LLM for deterministic tasks that can be handled by normal code or metadata extraction.

---

# Step 4I — External Resource / Provider Architecture

External resources may originate from:

```text
YouTube
Coursera
Documentation
Blogs
Other websites
Files
```

PathLevel should initially store the external resource as its own Resource representation.

Do not assume provider APIs are required.

For V1:

```text
Provider Progress
≠
PathLevel Progress
```

Provider integrations can be added later if they provide enough value to justify:

- OAuth
- provider APIs
- synchronization
- rate limits
- maintenance
- failure handling

---

# Step 4J — Capture & Enrichment Architecture

Capture should remain lightweight.

Recommended flow:

```text
Capture
   ↓
Save Resource
   ↓
Inbox
   ↓
Metadata Enrichment
   ↓
Review
```

Enrichment may use:

```text
URL metadata
OpenGraph metadata
structured page metadata
file metadata
optional AI
```

Do not block the initial save on expensive processing.

If enrichment fails:

```text
Resource still exists
```

---

# Step 4K — Authentication & Authorization

Audit the current authentication implementation.

Ensure all new domain resources respect the existing authorization model.

At minimum determine:

```text
Who owns a Resource?
Who owns a Note?
Who owns a Learning Goal?
Who can access a Session?
Who can modify relationships?
```

For the current single-user product model, authorization can remain simple, but ownership must still be explicit in the data model where appropriate.

Do not build multi-user collaboration unless it is actually required.

---

# Step 4L — File & Media Storage

Determine how the system handles:

```text
Images
PDFs
Attachments
Screenshots
Thumbnails
```

Decide:

- storage location
- ownership
- file metadata
- upload limits
- deletion behavior
- public/private access
- backup implications

The storage design must support Resources without forcing every resource type into the same content model.

---

# Step 4M — Migration Strategy

Because PathLevel already exists, migration must be incremental and reversible where practical.

Create:

```text
Current Model
      ↓
Target Model
      ↓
Migration Steps
```

For each existing feature/model:

```text
KEEP
MODIFY
MIGRATE
REMOVE
```

Determine:

- existing data compatibility
- required migrations
- data transformation
- temporary compatibility layers
- rollback strategy
- deployment order

Do not delete existing data until the migration path is verified.

---

# Step 4N — Testing Strategy

Technical changes should be backed by tests at the appropriate level.

Minimum areas:

```text
Domain rules
API endpoints
Authentication/authorization
Relationships
Lifecycle transitions
Progress calculations
Search
Capture
Learning Sessions
Migration
```

Important scenarios:

```text
Resource linked to multiple Units
Resource removed from Learning but retained in Library
Completed Unit reopened
Goal with Unassigned Resources
Session with multiple Resources
AI failure during enrichment
Search without AI
Migration of existing data
```

Do not rely only on manual UI testing for domain-critical behavior.

---

# Step 4O — Technical Risk & Simplification Review

Before implementation, explicitly identify overengineering risks.

Review whether the design is introducing:

```text
Unnecessary microservices
Vector database too early
Provider integrations too early
Complex event architecture
Overly generic abstractions
Premature AI pipelines
Unnecessary background infrastructure
Duplicate data
Excessive caching
Complex state machines
```

For every proposed infrastructure component ask:

> **What concrete current requirement requires this?**

If there is no strong answer, defer it.

---

# Step 4P — Final Architecture Decision

The final Step 4 output should define:

```text
1. Current architecture audit
2. Target architecture
3. Database/schema design
4. Relationship implementation
5. State/lifecycle implementation
6. Progress source of truth
7. API boundaries
8. Search architecture
9. AI integration boundary
10. External provider strategy
11. Capture/enrichment pipeline
12. Authentication/authorization
13. File/media storage
14. Migration strategy
15. Testing strategy
16. Technical risks and deferred work
```

The result should be a practical architecture that fits the existing PathLevel codebase.

---

# Step 4 Boundary

Step 4 should answer:

> **How should the approved PathLevel domain be implemented safely in the existing project?**

It should NOT yet execute the migration or major code changes.

After Step 4 is approved, proceed to:

> **Step 5 — Implementation & Migration Plan**

Step 5 will convert the approved architecture into ordered implementation tasks, migrations, tests, and deployment steps.
