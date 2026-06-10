# PathLevel - Product Roadmap

## Vision

Build a personal growth platform that combines:

* Habit Tracking
* Learning Management
* Resource Management
* Progress Analytics
* Gamification

into a single ecosystem.

---

# Development Philosophy

Build progressively.

Each version must be usable before moving to the next version.

Avoid over-engineering.

Focus on delivering working features first.

---

# V1 - Personal Growth Foundation

Status:
Completed

Goal:

Create a fully usable personal growth dashboard for daily usage.

Core Features:

* ✅ Authentication
* ✅ Dashboard
* ✅ Habit Tracking
* ✅ Task Management
* ✅ Learning Sessions
* ✅ Resource Library
* ✅ Global XP System
* ✅ Achievement System
* ✅ Statistics & Analytics

Success Criteria:

* ✅ Daily usage is possible
* ✅ XP system works correctly
* ✅ Habits can be tracked consistently
* ✅ Tasks can be managed efficiently
* ✅ Learning sessions are recorded
* ✅ Resources can be organized
* ✅ Dashboard provides useful insights
* ✅ Achievements provide additional motivation

---

# V1.5 - Structured Learning

Status:
Future

Goal:

Introduce guided learning journeys.

Features:

* Focus Areas
* Learning Roadmaps
* Roadmap Nodes
* Roadmap Progress Tracking
* Roadmap Completion Tracking

Examples:

* Frontend Developer Path
* Backend Developer Path
* JavaScript Mastery
* React Learning Path
* Data Structures Path

Success Criteria:

* Users can follow structured learning paths
* Progress is visualized clearly
* Learning journey becomes more organized

---

# V2 - Growth Engine

Status:
Future

Goal:

Expand progression and gamification systems.

Features:

* Focus Area XP
* Focus Area Levels
* Achievement Badges
* Advanced Analytics
* Growth Visualization

Success Criteria:

* Motivation systems increase engagement
* Progress can be measured per Focus Area
* Achievements provide additional incentives

---

# V2.5 - Mobile Planning

Status:
Future

Goal:

Prepare mobile application development.

Deliverables:

* Mobile PRD
* Mobile UX Design
* Mobile Wireframes
* API Review
* React Native Architecture Planning

No development yet.

---

# V3 - Mobile Application

Status:
Future

Goal:

Bring PathLevel to mobile devices.

Technology:

React Native

Platforms:

* Android
* iOS

Features:

* Habit Tracking
* Tasks
* Learning Sessions
* Roadmap Progress
* XP System
* Dashboard

Uses existing backend APIs.

---

# Future Vision

Potential Features:

* AI Assistant
* Smart Recommendations
* Public Profiles
* Community Features
* Team Learning Spaces
* Knowledge Base
* Social Accountability System

These features are intentionally postponed until the foundation is stable.

---

# Sprint Roadmap

## Sprint 0

Developer Foundation

Deliverables:

* GitHub Setup
* Git Setup
* WSL2 Setup
* Ubuntu Setup
* Node.js Setup
* Docker Setup
* VS Code Setup

Status:
Completed

---

## Sprint 1

Foundation & Core Modules

Deliverables:

* Frontend Initialization (React, Vite, Tailwind, TypeScript)
* Backend Initialization (Express, Prisma, PostgreSQL)
* Dashboard API + UI
* Habit Module (CRUD + complete)
* Task Module (CRUD + toggle)
* Learning Session Module (CRUD)
* Resource Module (CRUD + toggle)
* Global XP System + Level System
* Input Validation (Zod)
* XP Integrity (atomic transactions, unique constraints)
* Database Seed Script

Status:
Completed

---

## Sprint 2

Authentication

Deliverables:

* Register / Login (bcrypt + JWT)
* Auth Middleware + Protected Routes
* Auth Context + Session Persistence
* Login Page + Register Page

Status:
Completed

---

## Sprint 3

Achievement System

Deliverables:

* Achievement definitions and triggers
* Achievement tracking backend
* Achievement UI and notifications
* Milestone badges

Status:
Completed

---

## Sprint 4

Dashboard Enhancement

Deliverables:

* Weekly XP metric on dashboard
* Weekly completed tasks metric
* Top streak display
* Top 3 habit streaks
* Achievement progress tracking
* Hardcoded consistency metric removed

Status:
Completed

---

## Sprint 5

Production Hardening

Deliverables:

* Environment variable validation at startup
* helmet security headers middleware
* Rate limiting on auth endpoints
* Database health check in /api/health
* 404 catch-all handler
* Root .gitignore with .env protection
* .env.example template
* prisma and tsx promoted to production dependencies
* postinstall script for prisma generate
* ts-node replaced with tsx

Status:
Completed

---

## Sprint 6

Deployment Infrastructure

Deliverables:

* Multi-stage backend Dockerfile (Node 22 Alpine, build + runtime)
* Frontend Dockerfile (Vite build + nginx:stable-alpine)
* Nginx config with SPA routing, API proxy, security headers
* production docker-compose.yml (postgres + backend + frontend + nginx)
* .dockerignore files for both frontend and backend
* Health checks on all services
* Environment variable validation (?:error pattern)

Status:
Completed

---

# V1 Complete

PathLevel V1 has been fully implemented.

All core features are complete and ready for production deployment.

To deploy:
  1. Set required environment variables
  2. Run: docker compose -f docker-compose.prod.yml up -d

---

# Post V1 Roadmap

## Sprint 6

Focus Areas

## Sprint 7

Learning Roadmaps

## Sprint 8

Roadmap Nodes

## Sprint 9

Roadmap Progress

These sprints belong to V1.5 and are intentionally postponed until V1 is stable.

---

Version:
V1.1

Status:
Approved
