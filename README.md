# Counselling practice web app

This project is a secure, production-minded full-stack TypeScript application for a UK-based counselling practice. The first phase establishes the foundation for a modular monolith with a public marketing site, a protected admin dashboard, a PostgreSQL database and a TypeScript backend.

## Project structure

- `apps/web`: React + TypeScript + Vite marketing site and admin client.
- `apps/server`: Express + TypeScript REST API.
- `packages/shared`: shared validation and domain types.

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop or Docker Engine for local PostgreSQL
- Optional: Prisma Studio for database inspection

## Local setup

1. Copy `.env.example` to `.env` and update secrets and local values.
2. Start PostgreSQL with Docker Compose:
   - `docker compose up -d postgres`
3. Install dependencies:
   - `npm install`
4. Generate Prisma client and run migrations:
   - `npm run db:generate`
   - `npm run db:migrate`

## Run the app locally

- Frontend and backend together:
  - `npm run dev`
- Frontend only:
  - `npm run dev -w apps/web`
- Backend only:
  - `npm run dev -w apps/server`

## Common commands

- Build the project: `npm run build`
- Lint: `npm run lint`
- Type-check: `npm run typecheck`
- Open Prisma Studio: `npm run db:studio`

## Environment variables

The project expects a `.env` file at the repository root. The included example documents the main variables for the database, JWT/session secrets and transactional email delivery.

## Security and privacy notes

- Keep all secrets out of source control.
- Do not use real production credentials in local development.
- The admin area is intentionally separate from the public marketing site.
- Logging and notifications should avoid sensitive counselling details.
- The app is designed to support UK privacy obligations, but legal compliance still depends on Mike’s policies, retention decisions and operational practices.

## Production guidance

- Configure a secure production Postgres instance and scheduled backups.
- Use HTTPS and server-managed cookies only.
- Set up email domain authentication for the chosen provider.
- Provision the initial administrator securely and rotate secrets before launch.

## Current status

This repository is in the initial scaffolding phase. The next phase will add the Prisma schema, database migrations and backend security configuration.
