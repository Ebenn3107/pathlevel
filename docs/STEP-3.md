# STEP 3 — Domain & Data Model

## Purpose

Translate the decisions from **Step 1 — Product Foundation** and **Step 2 — Product UX & Core Flows** into a clean domain model before implementation.

This step is intentionally focused on **what the system needs to represent and how those objects relate**.

It should not yet prescribe exact database tables or implementation details.

---

# Step 3A — Identify Core Entities

Review the current project and determine which entities are genuinely required.

Candidate entities:

```text
User
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

For each entity, answer:

- Why does it exist?
- What problem does it represent?
- What data does it own?
- Is it independent or derived from another entity?
- Can it be removed/merged without breaking the product?

Important:

> Do not create an entity simply because the UI has a screen or component for it.

Avoid speculative entities that are not required by the current product model.

---

# Step 3B — Define Relationships

Determine how entities relate.

Important relationships already implied by Step 2 include:

```text
Learning Goal
    │
    ├── Learning Units
    │       ├── Resources
    │       ├── Notes
    │       └── Sessions
    │
    └── Unassigned Resources
```

Also consider:

```text
Resource ↔ Learning Unit
Resource ↔ Learning Goal
Resource ↔ Note
Session ↔ Resource
Session ↔ Learning Unit
```

Some relationships may be many-to-many.

Example:

```text
Resource
   ├── Learning Unit A
   └── Learning Unit B
```

Do not duplicate resources merely because they belong to multiple Learning contexts.

For every relationship, determine:

- cardinality
- ownership
- optionality
- whether the relationship needs its own metadata

---

# Step 3C — State & Lifecycle

Define valid states and transitions.

Examples from Step 2:

```text
Resource
Inbox → Saved → Archived
```

```text
Learning Unit
Not Started → In Progress → Completed
                         ↓
                      Reopened
```

Questions to answer:

- What states exist?
- Which transitions are user-triggered?
- Which transitions are system-triggered?
- Can an item move backward?
- What happens when it is archived?
- What happens when it is restored?
- What happens when a relationship is removed?

Do not create state machines where a simple boolean/status field is sufficient.

---

# Step 3D — Progress Rules

Keep these concepts separate:

```text
Resource Progress
Learning Unit Progress
Learning Goal Progress
Learning Session Activity
Habit Streak
XP
Achievement
```

Define the source of truth for each.

Important principles already established:

```text
Provider/source progress
≠
PathLevel Learning progress
```

```text
Habit streak
≠
Learning progress
```

```text
Session activity
≠
Learning mastery
```

The system must not claim mastery based only on activity counts.

Determine:

- What is directly stored?
- What is calculated?
- What events change progress?
- Can progress decrease?
- What happens after reopening a completed Unit?

---

# Step 3E — Data Ownership & Deletion Rules

For every important relationship, define what happens when the parent or related object is deleted.

Examples:

```text
Delete Resource
    ↓
Delete its Learning relationships
    ↓
Learning Goal / Unit remains
```

```text
Delete Learning Unit
    ↓
Resources remain in Library
```

But the lifecycle of:

- Sessions
- Summaries
- Notes
- Relationships

must be explicitly decided.

Distinguish between:

```text
Delete
Archive
Detach relationship
Restore
```

Do not assume these operations are equivalent.

---

# Step 3F — Derived vs Stored Data

For each field/value, decide whether it should be:

### Stored

Example:

```text
Resource.title
LearningUnit.status
Session.startedAt
```

### Derived

Example:

```text
Goal completion percentage
Number of completed Units
Search result count
```

Avoid storing values that can reliably be calculated from authoritative data.

This reduces synchronization problems.

---

# Step 3G — AI / Search Data Boundary

AI should not become a dependency of the core domain model.

Potential AI-related data may include:

```text
Extracted metadata
Suggested topics
Suggested Learning relationship
Generated summary
Embedding
```

But distinguish:

```text
User-owned / authoritative data
        ≠
AI-generated suggestion
```

AI output should be replaceable, editable, and safe to regenerate.

Search should work without AI in V1.

Semantic search / embeddings / RAG remain future capabilities unless explicitly promoted into the current scope.

---

# Step 3H — Current Project vs New Model

Because PathLevel already exists, compare the proposed domain model against the current implementation.

Create a migration assessment:

```text
CURRENT ENTITY / FEATURE
        ↓
NEW DOMAIN MODEL
        ↓
KEEP / MODIFY / MIGRATE / REMOVE / ADD
```

For each existing model, determine:

- Does it still represent a valid domain concept?
- Can existing data be migrated?
- Does its current structure conflict with the new model?
- Is backward compatibility required?
- Can the change be incremental?

Do not redesign the entire existing database blindly.

---

# Step 3I — Domain Model Review

Before database implementation, produce a concise domain map.

Example:

```text
User
 │
 ├── Resources
 ├── Notes
 ├── Learning Goals
 │      ├── Learning Units
 │      │      ├── Resources
 │      │      ├── Notes
 │      │      └── Sessions
 │      └── Unassigned Resources
 │
 ├── Tasks
 ├── Habits
 └── Achievements / XP Events
```

Then review:

1. Is every entity necessary?
2. Is every relationship necessary?
3. Are any relationships duplicated?
4. Is any entity doing too many jobs?
5. Is any entity only a UI abstraction?
6. Can anything be simplified?
7. Does the model support the Step 2 flows?
8. Does the model preserve existing user data?

---

# Step 3 — Output

The final result of Step 3 should be:

```text
1. Entity list
2. Entity responsibilities
3. Relationship map
4. State/lifecycle rules
5. Progress rules
6. Delete/archive/detach rules
7. Stored vs derived data
8. AI/search data boundaries
9. Current → new model migration assessment
10. Final domain model
```

Only after this is agreed should the project move to:

> **Step 4 — Technical Architecture & Database Design**

Step 3 should answer:

> **What does PathLevel need to represent?**

Step 4 will answer:

> **How should we implement it?**
