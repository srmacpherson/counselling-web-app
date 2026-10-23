# Counselling practice web app

A production-minded full-stack TypeScript application for a counselling practice. The current implementation includes a public marketing landing page, a secure admin login flow, protected admin routes, a PostgreSQL-backed data model, and a modular monolith structure ready for the next business feature set.

## Overview

This project is structured as a TypeScript monorepo:

- `apps/web`: React + Vite frontend for the public site and admin interface
- `apps/server`: Express + Prisma + PostgreSQL backend
- `packages/shared`: shared validation and domain logic

The application is designed for a UK-based counselling service with a clear separation between public content and authenticated admin operations.

## Tech stack

- React 18 + TypeScript + Vite
- Express + TypeScript
- PostgreSQL via Prisma ORM
- Argon2 password hashing
- HTTP-only session cookies for admin authentication
- Docker Compose for local database provisioning

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop or Docker Engine

## Local development setup

1. Install dependencies:
   - `npm install`
2. Ensure the root `.env` file exists. This repo includes a root-level `.env` with the local database and admin credentials for development.
3. Start PostgreSQL:
   - `docker compose up -d postgres`
4. Generate the Prisma client and apply migrations:
   - `npm run db:generate`
   - `npm run db:migrate`
5. Seed the initial admin user:
   - `npm run db:seed`

## Run the app

Start both frontend and backend together:

- `npm run dev`

Run them individually:

- Frontend: `npm run dev -w apps/web`
- Backend: `npm run dev -w apps/server`

## Important configuration notes

- The database is configured to run on port `5433` to avoid conflicts with any local PostgreSQL instance already running on `5432`.
- The project expects a root-level `.env` file with values such as:
  - `DATABASE_URL`
  - `CORS_ORIGIN`
  - `SESSION_SECRET`
  - `COOKIE_NAME`
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`

## Admin authentication

The application includes a secure admin login flow:

- login endpoint: `POST /api/auth/login`
- logout endpoint: `POST /api/auth/logout`
- authenticated session check: `GET /api/admin/me`

The frontend includes:

- public landing page at `/`
- admin login page at `/admin/login`
- protected admin dashboard at `/admin`

By default, the local seed admin is created as:

- Email: `admin@example.com`
- Password: `ChangeMeStronglyBeforeUse123!`

> Change this before any shared or production environment is used.

## Database and Prisma

Use Prisma commands from the repo root:

- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:studio`

## Common maintenance commands

- Build the project: `npm run build`
- Lint: `npm run lint`
- Type-check: `npm run typecheck`

## Security and privacy notes

- Keep secrets out of source control.
- Use HTTP-only cookies for authenticated admin sessions.
- Prefer Argon2 hashing for password storage.
- Do not use real production credentials in local development.
- Separate public content from staff-only administrative functionality.
- Be careful with all counselling-related data and avoid storing unnecessary sensitive details.

## Current project status

The foundation is in place and the project is moving from setup into business feature implementation. The current milestone includes:

- modular monorepo structure
- PostgreSQL and Prisma setup
- database migration and seed workflow
- working admin authentication and protected dashboard shell

The next phase will focus on operational admin functionality such as enquiries, clients, bookings and internal workflow management.
