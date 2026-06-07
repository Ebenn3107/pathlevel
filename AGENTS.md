# AGENTS.md

# PathLevel AI Agent Instructions

Follow these rules before making any changes.

---

## PROJECT

Name: PathLevel

Tagline: Track Your Journey. Level Your Growth.

Type:

Personal Growth Dashboard

Current Version:

V1

---

## STACK

Frontend

* React
* TypeScript
* Vite
* TailwindCSS
* React Router
* TanStack Query

Backend

* Node.js
* Express
* TypeScript
* Prisma ORM

Database

* PostgreSQL

Infrastructure

* Docker
* GitHub
* WSL2

---

## ARCHITECTURE

Rules

* API First
* Feature Based Frontend
* REST API
* Single User V1
* Global XP V1

Frontend must never access database directly.

All data access goes through backend APIs.

---

## V1 FEATURES

Allowed

* Authentication
* Dashboard
* Habits
* Tasks
* Learning Sessions
* Resources
* Global XP
* Analytics

Not Allowed

* Focus Areas
* Roadmaps
* Roadmap Nodes
* Focus Area XP
* Achievements
* Social Features
* Team Features
* Public Profiles

These belong to future versions.

---

## FRONTEND STRUCTURE

Use Feature-Based Architecture.

Example:

src/

app/
components/
layouts/
routes/
services/
hooks/
types/
utils/

features/

auth/
habits/
tasks/
learning/
resources/

Rules

* Keep features isolated
* Avoid business logic inside UI components
* Prefer reusable components

---

## BACKEND STRUCTURE

src/

config/
routes/
controllers/
services/
repositories/
middleware/
validators/
utils/
types/

Rules

* Controllers handle HTTP
* Services contain business logic
* Repositories handle database access

Do not place business logic in controllers.

---

## DATABASE

Current Core Entities

* User
* UserStats
* Habit
* HabitProgress
* Task
* TaskProgress
* LearningSession
* Resource
* XPHistory

Do not create future-version entities.

---

## API RULES

Use REST.

Success Response

{
"success": true,
"data": {}
}

Error Response

{
"success": false,
"message": "Error"
}

Rules

* Use proper HTTP status codes
* Validate inputs
* Keep response format consistent

---

## UI RULES

Theme

* Dark First

Style

* Clean
* Minimal
* Productivity Focused

Layout

* Sidebar
* Main Content

Avoid

* RPG clutter
* Complex animations
* Fantasy visuals

---

## XP SYSTEM

Habit Completion

+10 XP

Task Completion

+20 XP

Learning Session

+1 XP per 10 minutes

Level Formula

level = floor(totalXp / 100) + 1

Examples

0 XP -> Level 1

100 XP -> Level 2

250 XP -> Level 3

---

## CODE STYLE

TypeScript

* Prefer explicit types
* Avoid any
* Keep code simple

Naming

Components

PascalCase

Example

HabitCard.tsx

Hooks

camelCase

Example

useHabits.ts

Folders

kebab-case

Example

learning-session

---

## DEPENDENCY RULES

Before adding a package ask:

1. Can React solve it?
2. Can Tailwind solve it?
3. Can current dependencies solve it?

Avoid dependency bloat.

---

## IMPLEMENTATION RULES

Build incrementally.

Preferred Order

1. Layout
2. Authentication
3. Habits
4. Tasks
5. Learning Sessions
6. Resources
7. XP System
8. Dashboard
9. Analytics

Never generate the entire application at once.

Implement one feature at a time.

---

## RESPONSE RULES

Default Mode

* Concise
* Direct
* Minimal Tokens

Do Not

* Explain code unless asked
* Generate tutorials unless asked
* Repeat AGENTS.md
* Produce long summaries
* Add unnecessary comments

When coding

Return:

* Files changed
* Code
* Required commands

Nothing more unless requested.

---

## DOCUMENT PRIORITY

If conflicts occur:

1. docs/DECISIONS.md
2. docs/PRD.md
3. docs/TRD.md
4. docs/ROADMAP.md
5. docs/PROJECT-STATUS.md

Higher priority overrides lower priority.

---

## REFERENCE DOCUMENTS

Consult when necessary:

docs/DECISIONS.md
docs/PRD.md
docs/TRD.md
docs/ROADMAP.md
docs/PROJECT-STATUS.md

Do not violate these documents.

---

End of Instructions
