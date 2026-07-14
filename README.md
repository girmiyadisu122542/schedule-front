# Schedule — Frontend (Vue 3)

A **starter kit** frontend for a class & exam schedule system, derived from the
Schedule ERP frontend. It keeps the auth + user/role/permission management UI,
the app shell (layout, data-driven sidebar, dynamic values / lookups), and the
shared component library — and drops everything ERP-specific (entities,
parties, descendants, module system, inventory, sales, tax, currency, icons,
landing pages).

RBAC is **flat**: assigning a role to a user is just picking a role; a
permission override is just a permission + allow/deny.

## Stack

- Vue 3.5 (`<script setup>`, Composition API) + TypeScript
- Vite 7, Pinia (+ persisted state), Vue Router 5
- Tailwind CSS 4, Zod, Axios
- Server-driven i18n (English / Amharic)

## What's included

- **Auth flows:** login, forgot/reset password, OTP, two-step verification.
- **Access management:** Users, Roles, Permissions screens (list, create,
  edit, assign role, permission overrides, role-permission matrix).
- **User profile:** basic info, change password, security / 2FA, devices.
- **Dynamic values:** the generic lookup editor.
- **App shell:** `MainLayout`, data-driven sidebar (from `/user/allowed-routes`),
  route guard that gates by permission, `allowedRoutesStore` + `authStore`.
- **~70 shared components** in `src/components/common`.

## Setup

```bash
npm install
cp .env.example .env    # optional; set VITE_API_URL if the backend is elsewhere
npm run dev             # http://localhost:5173
```

The API base URL defaults to `http://127.0.0.1:8000/api` (the Schedule
backend) and is overridable via `VITE_API_URL` (see `src/constants/index.ts`).

Run the backend first (`schedule-main`), then log in with a seeded account,
e.g. `admin@schedule.com` / `schedulePwd`.

## Scripts

```bash
npm run dev          # dev server
npm run build        # type-check + production build
npm run type-check   # vue-tsc only
```

## Layout

```
src/
├── api/axiosInstance.ts        single axios client (token + lang header + 401 handling)
├── stores/                     allowedRoutesStore (RBAC + sidebar), languageStore
├── layout/                     MainLayout, AppHeader, AppSidebar, UserMenu
├── components/common/          shared UI library
├── composables/                sidebar, lookups, dropdowns, common data
├── modules/user/               auth + access-management (users/roles/permissions) + profile
│   ├── store/authStore.ts      login / MFA / current user
│   ├── views/ components/ composables/ schemas/ types/
├── router/                     app routes + permission guard
└── config/appConfig.ts         constants
```

> Note: a small number of pre-existing type warnings unrelated to the starter
> extraction remain (TipTap editor generics, a couple of `possibly undefined`
> in `DataTable.vue`, a `BadgeSeverity` index). They do not affect the build.
