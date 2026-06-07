# Frontend Architecture Plan — Foundation

## Context

PathLevel needs a frontend foundation: folder structure, shared UI primitives, a layout shell, and basic routing. Auth, data fetching, CRUD pages, and business logic come later. This plan covers only what's needed to have a navigable UI shell.

---

## 1. Folder Structure

```
frontend/src/
├── app/
│   └── App.tsx                   # Router + global providers
├── components/
│   └── ui/                       # Primitive shared components (dumb, no logic)
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Spinner.tsx
│       └── index.ts
├── features/                     # Feature directories — empty placeholders for now
│   ├── habits/
│   │   └── pages/
│   │       └── HabitsPage.tsx    # Placeholder
│   ├── tasks/
│   │   └── pages/
│   │       └── TasksPage.tsx     # Placeholder
│   ├── learning/
│   │   └── pages/
│   │       └── LearningPage.tsx  # Placeholder
│   ├── resources/
│   │   └── pages/
│   │       └── ResourcesPage.tsx # Placeholder
│   └── dashboard/
│       └── pages/
│           └── DashboardPage.tsx # Placeholder
├── layouts/
│   ├── AppLayout.tsx             # Sidebar + <Outlet />
│   └── Sidebar.tsx               # Nav links
├── routes/
│   └── index.tsx                 # Route definitions (flat, no guards)
├── main.tsx                      # Entry point
└── index.css                     # Tailwind import + dark base theme
```

What's **excluded** from this foundation (will be added per-feature later):
- `auth/` feature — no auth until login/register is implemented
- `api/` directories inside features — no API calls yet
- `hooks/` directories inside features — no business logic yet
- `types/` directories inside features — no domain types until needed
- `query-keys.ts` / TanStack Query usage — data fetching comes later
- `services/api.ts` — Axios client comes with auth
- `utils/` — no shared utilities yet
- Route guards, auth context, protected routes

---

## 2. Routing Structure

Uses React Router.

### Routes

| Path          | Component          | Layout     |
|---------------|--------------------|------------|
| `/`           | Redirect to `/dashboard` | —      |
| `/dashboard`  | DashboardPage      | AppLayout  |
| `/habits`     | HabitsPage         | AppLayout  |
| `/tasks`      | TasksPage          | AppLayout  |
| `/learning`   | LearningPage       | AppLayout  |
| `/resources`  | ResourcesPage      | AppLayout  |

No auth guards, no CRUD sub-routes, no param routes. Flat and simple.

### Route file

```tsx
// routes/index.tsx
<Routes>
  <Route element={<AppLayout />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/habits" element={<HabitsPage />} />
    <Route path="/tasks" element={<TasksPage />} />
    <Route path="/learning" element={<LearningPage />} />
    <Route path="/resources" element={<ResourcesPage />} />
  </Route>
  <Route path="/" element={<Navigate to="/dashboard" replace />} />
  <Route path="*" element={<Navigate to="/dashboard" replace />} />
</Routes>
```

---

## 3. Layout Structure

### AppLayout

```
┌────────┬─────────────────────┐
│        │                     │
│ SIDE   │   MAIN CONTENT      │
│ BAR    │   <Outlet />        │
│        │                     │
│        │                     │
└────────┴─────────────────────┘
```

- Full viewport height (`h-screen`), flexbox row.
- Sidebar: fixed width (`w-64`), dark background (`bg-gray-900`), column flex.
  - App logo / name at top.
  - Nav links: Dashboard, Habits, Tasks, Learning, Resources.
  - Active link highlighted based on current path (`useLocation`).
  - Bottom section for XP/level (static placeholder for now).
- Main area: `flex-1`, scrollable, padded.
  - Renders the matched child route via `<Outlet />`.

### Sidebar

- Simple nav list with `<NavLink>` components.
- Each link has an icon (can be inline SVG or simple text label).
- Active state via `NavLink`'s `className` callback.

---

## 4. Shared UI Components

Minimal set of dumb, reusable primitives:

| Component   | Props                                         |
|-------------|-----------------------------------------------|
| `Button`    | `variant?: 'primary' \| 'secondary' \| 'ghost'`, `size?: 'sm' \| 'md' \| 'lg'`, `disabled`, `children`, `onClick` |
| `Card`      | `className?`, `children` — styled container |
| `Input`     | `label?`, `error?`, standard input attrs     |
| `Spinner`   | `size?: 'sm' \| 'md' \| 'lg'` — loading indicator |

No form logic, no state management — pure presentational.

---

## 5. Theme Base

Dark-first, already using Tailwind via `@import "tailwindcss"`.

- Body: `bg-gray-950 text-gray-100`
- Sidebar: `bg-gray-900 border-r border-gray-800`
- Cards: `bg-gray-900 border border-gray-800 rounded-lg`
- Buttons: primary uses `bg-indigo-600`, secondary uses `bg-gray-800`
- Inputs: `bg-gray-800 border-gray-700`

No CSS variables or custom theme config needed yet — Tailwind classes are sufficient for V1.

---

## 6. Implementation Order

1. **Install react-router-dom** (`npm install react-router-dom`)
2. **Scaffold folder structure** — create empty directories and placeholder page files
3. **Create shared UI components** — Button, Card, Input, Spinner
4. **Create layouts** — AppLayout with Sidebar (nav links to all 5 sections)
5. **Create routes** — `routes/index.tsx` with the route table above
6. **Wire up App.tsx** — render `<BrowserRouter>` and route tree
7. **Clean up** — remove existing habits api/hooks/query-keys/types (business logic, not foundation), remove services/api.ts, remove unused types/api.ts

---

## 7. Files to Create

```
frontend/src/
├── app/App.tsx                          # BrowserRouter + Routes
├── components/ui/Button.tsx
├── components/ui/Card.tsx
├── components/ui/Input.tsx
├── components/ui/Spinner.tsx
├── components/ui/index.ts
├── features/dashboard/pages/DashboardPage.tsx   # Placeholder
├── features/habits/pages/HabitsPage.tsx         # Placeholder
├── features/tasks/pages/TasksPage.tsx           # Placeholder
├── features/learning/pages/LearningPage.tsx     # Placeholder
├── features/resources/pages/ResourcesPage.tsx   # Placeholder
├── layouts/AppLayout.tsx
├── layouts/Sidebar.tsx
└── routes/index.tsx
```

## 8. Files to Delete

```
frontend/src/
├── services/api.ts                    # Business logic — comes with auth later
├── types/api.ts                       # Business logic — comes with data fetching later
├── types/index.ts                     # Re-export of the above
├── features/habits/api/habits.ts      # Business logic — API calls
├── features/habits/hooks/useHabits.ts # Business logic — data fetching
├── features/habits/hooks/useHabitMutations.ts
├── features/habits/hooks/index.ts
├── features/habits/query-keys.ts
├── features/habits/types/index.ts     # Domain types — comes later
├── App.css                            # Vite boilerplate unused
```

---

## 9. Verification

1. `npm run dev` — app loads, shows sidebar with nav links.
2. Click each nav link — page content area shows the matching placeholder heading.
3. Active nav link is visually highlighted.
4. `/` redirects to `/dashboard`.
5. Unknown paths redirect to `/dashboard`.
6. `npm run build` — production build succeeds with zero errors.
