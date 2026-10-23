# Counselling web app

A full-stack TypeScript application for a counselling practice, covering both the public-facing marketing site and the internal admin workflow.

## What is included

This project currently includes:

- a public enquiry form with validation and preferred-contact handling
- an authenticated admin dashboard
- enquiry tracking and status updates
- client records and client deletion flow with confirmation
- booking creation, rescheduling, and cancellation
- audit/event history for admin actions
- PostgreSQL persistence via Prisma
- local development setup with Docker and seeded admin credentials

## Project structure

- `apps/web`: React + Vite frontend
- `apps/server`: Express + Prisma + PostgreSQL API
- `packages/shared`: shared TypeScript utilities and domain logic

## Tech stack

- React 18 + TypeScript + Vite
- Express + TypeScript
- Prisma ORM + PostgreSQL
- Docker Compose for local database provisioning
- HTTP-only session cookies for admin auth
- Argon2 password hashing

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop or Docker Engine

## Local setup

1. Install dependencies:
   - `npm install`
2. Make sure the root `.env` file exists. See `.env.example` for the expected shape.
3. Start PostgreSQL:
   - `docker compose up -d postgres`
4. Generate the Prisma client and apply migrations:
   - `npm run db:generate`
   - `npm run db:migrate`
5. Seed the database:
   - `npm run db:seed`

## Run locally

Start both frontend and backend together:

- `npm run dev`

Or run them separately:

- Frontend: `npm run dev -w apps/web`
- Backend: `npm run dev -w apps/server`

The app is typically available at:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`

## Environment configuration

The project expects a root-level `.env` file with values such as:

- `DATABASE_URL`
- `CORS_ORIGIN`
- `SESSION_SECRET`
- `COOKIE_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

The local database is configured for port `5433` to avoid conflicts with any existing local PostgreSQL instance.

## Admin access

The app includes a secure admin login flow:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/admin/me`

Default local admin credentials:

- Email: `admin@example.com`
- Password: `ChangeMeStronglyBeforeUse123!`

> Use these only for local development. Change them before any shared or production use.

## Database and Prisma commands

From the repo root:

- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:studio`

## Useful commands

- Build app: `npm run build`
- Lint: `npm run lint`
- Type-check: `npm run typecheck`

## Current feature set

The current application includes core operational flows for a counselling service:

- public enquiries with email/phone validation
- conditional preferred-contact validation
- recent enquiries inbox and status updates
- client records linked to enquiries and bookings
- appointment scheduling and booking lifecycle actions
- audit trail for admin changes
- confirmation step before deleting a client and associated data

## Notes

- This project is designed for local development and operational tooling, not yet as a production-hardening guide.
- Secrets should always remain out of source control.
- Keep client contact data protected and only store what is needed for the business process.
