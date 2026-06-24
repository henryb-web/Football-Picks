# Football Picks

A weekly pick'em web app for **NFL**, **College (FBS / CFP)**, and **Texas UIL 6A high school**
football. One global leaderboard. NFL & college games are picked against the spread (with live
odds shown); high school games are straight-up winner picks. A single-elimination bracket mode
runs for the postseason.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS 4**
- **PostgreSQL 16** (via Docker) + **Prisma 7** (with the `pg` driver adapter)
- Auth, data ingestion, and scoring are added in later milestones.

## Prerequisites

- **Node.js** (v20+; developed on v26)
- **Docker Desktop** (must be running — the database runs in a container)

## First-time setup

```bash
# 1. Install JS dependencies
npm install

# 2. Create your local .env (idempotent — won't overwrite an existing one)
bash scripts/setup-env.sh

# 3. Start the Postgres database (runs in the background)
docker compose up -d

# 4. Generate the Prisma client and apply migrations
npx prisma generate
npx prisma migrate dev
```

## Day-to-day workflow

```bash
docker compose up -d     # start the database (once per session; it stays running)
npm run dev              # start the app at http://localhost:3000
```

Then open <http://localhost:3000>. Check <http://localhost:3000/api/health> to confirm the
app can reach the database — it should return `{"status":"ok","database":"connected"}`.

When you're done for the day:

```bash
docker compose stop      # stop the database (data is preserved)
```

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run the app in development with hot reload |
| `npm run build` / `npm start` | Production build / serve |
| `docker compose up -d` | Start the Postgres container |
| `docker compose stop` | Stop it (keeps data) |
| `docker compose down -v` | Stop **and delete all data** (full reset) |
| `npx prisma migrate dev` | Apply schema changes / create a migration |
| `npx prisma studio` | Browse the database in a web UI |

## Project layout

```
prisma/
  schema.prisma        # data model (User, Team, Game, Line, Pick)
  migrations/          # migration history
prisma.config.ts       # Prisma 7 config (DB url for the CLI)
src/
  app/                 # Next.js routes (App Router)
    api/health/        # DB connectivity check
  lib/db.ts            # Prisma client singleton (pg adapter)
  generated/prisma/    # generated Prisma client (gitignored)
docker-compose.yml     # local Postgres
scripts/setup-env.sh   # creates .env / .env.example
```
