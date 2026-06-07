# PathLevel - Key Decisions

This document records important product and technical decisions made during the development of PathLevel.

The goal is to preserve context and reasoning behind major decisions.

---

# DECISION-001

Title:
Web First, Mobile Later

Status:
Accepted

Decision:

PathLevel V1 will be developed as a web application only.

Reason:

* Faster development
* Lower complexity
* Easier learning process
* Faster iteration

Future Plan:

Mobile planning starts in V2.5.

Mobile development starts in V3 using React Native.

---

# DECISION-002

Title:
API-First Architecture

Status:
Accepted

Decision:

All frontend communication must go through backend APIs.

Reason:

* Future mobile compatibility
* Better separation of concerns
* Easier maintenance

Future Impact:

Web and mobile applications can share the same backend.

---

# DECISION-003

Title:
Single User Focus for V1

Status:
Accepted

Decision:

V1 prioritizes personal usage instead of multi-user collaboration.

Reason:

* Personal problem comes first
* Faster development
* Reduced scope

Future Impact:

Architecture should remain expandable for public users.

---

# DECISION-004

Title:
Global XP System for V1

Status:
Accepted

Decision:

XP is tracked globally across the entire application.

Reason:

* Simpler implementation
* Easier UI design
* Faster MVP delivery

Future Plan:

Focus Area XP will be introduced in V2.

---

# DECISION-005

Title:
Roadmap System Delayed to V1.5

Status:
Accepted

Decision:

Roadmap Graph and Learning Paths are not included in V1.

Reason:

* Reduce MVP scope
* Prioritize daily usability
* Avoid over-engineering

Future Plan:

Roadmap functionality begins in V1.5.

---

# DECISION-006

Title:
Feature-Based Frontend Structure

Status:
Accepted

Decision:

Frontend follows a feature-based architecture.

Reason:

* Better scalability
* Easier maintenance
* Cleaner organization

Example:

features/

├── habits
├── tasks
├── learning
└── resources

---

# DECISION-007

Title:
Docker for Development Environment

Status:
Accepted

Decision:

PostgreSQL runs inside Docker containers.

Reason:

* Consistent environment
* Easier setup
* Better portability

---

# DECISION-008

Title:
Documentation Before Development

Status:
Accepted

Decision:

Core project documentation is created before feature development begins.

Reason:

* Clear direction
* Reduced confusion
* Better project management

Documents:

* DEDICATION.md
* PRD.md
* TRD.md
* ROADMAP.md
* PROJECT-STATUS.md
* DECISIONS.md

---

Last Updated:

Sprint 1
Foundation Documentation Phase
