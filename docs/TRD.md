# PathLevel - Technical Requirement Document (TRD)

## Project Information

### Project Name

PathLevel

### Version

V1.0

### Status

Planning

---

# Architecture Overview

PathLevel follows an API-First Architecture.

Frontend and future mobile applications will communicate through a shared backend API.

Architecture:

User
↓
React Frontend
↓
REST API
↓
Express Backend
↓
Prisma ORM
↓
PostgreSQL Database

---

# Technology Stack

## Frontend

* React
* TypeScript
* Vite
* React Router
* TanStack Query
* Axios
* TailwindCSS

---

## Backend

* Node.js
* Express.js
* TypeScript
* Prisma ORM
* JWT Authentication
* bcrypt

---

## Database

* PostgreSQL

---

## Development Tools

* Git
* GitHub
* Docker Desktop
* WSL2
* Ubuntu 24.04
* VS Code
* Bruno (API Testing)
* DBeaver (Database Management)

---

# Frontend Architecture

Structure:

frontend/src

├── app
├── routes
├── layouts
├── components
├── features
├── services
├── hooks
├── types
├── utils
└── pages

---

## Feature-Based Organization

Each feature is self-contained.

Example:

features/

└── habits

```
├── api
├── components
├── hooks
├── pages
├── types
└── utils
```

---

# Backend Architecture

Structure:

backend/src

├── config
├── controllers
├── services
├── repositories
├── middleware
├── routes
├── validators
├── utils
└── types

---

# Database Design

Primary Entities:

* User
* UserStats
* Habit
* HabitProgress
* LearningRoadmap
* RoadmapNode
* Resource

---

# Authentication

Method:

JWT Authentication

Endpoints:

POST /api/auth/register

POST /api/auth/login

GET /api/auth/me

---

# API Design Principles

Rules:

* RESTful API
* JSON response format
* Consistent error structure
* Authentication required for protected routes

Example Response:

{
"success": true,
"data": {}
}

Example Error:

{
"success": false,
"message": "Unauthorized"
}

---

# XP System (V1)

Global XP System

XP Sources:

Habit Completion
+10 XP

Roadmap Node Completion
+20 XP

Learning Session
+1 XP per 10 minutes

---

# Level Formula

Level = floor(totalXp / 100) + 1

Examples:

0 XP → Level 1

100 XP → Level 2

250 XP → Level 3

---

# Git Workflow

Branch Strategy:

main

Development Approach:

Solo Development

Commit Convention:

feat: new feature

fix: bug fix

docs: documentation

refactor: code refactor

style: UI/styling changes

chore: project maintenance

---

# Naming Convention

Components:

PascalCase

Examples:

HabitCard.tsx

SidebarMenu.tsx

---

Hooks:

camelCase

Examples:

useHabits.ts

useAuth.ts

---

Folders:

kebab-case

Examples:

focus-areas

learning-sessions

---

# Future Compatibility

The architecture must support:

* Mobile Application (React Native)
* Focus Area XP
* Achievement System
* Advanced Roadmaps
* Graph-Based Learning System

without requiring major architectural changes.

---

Version:
V1.0

Status:
Draft
