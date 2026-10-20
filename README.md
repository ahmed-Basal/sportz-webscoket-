# Real-Time Sports Live Stream & Commentary

A modern, full-stack real-time sports commentary application implementing the **Static Anchor vs. Fast Events** architecture with Express, WebSocket, Drizzle ORM, Neon Serverless Postgres, and Scalar API Reference.

## Architecture

Based on the **Real-Time Sports DB Schema**:

```text
+-----------------------------------+       REAL-TIME FLOW        +-----------------------------------+
|        MATCH (Static Anchor)      | --------------------------> |     COMMENTARY (Dynamic Story)    |
|-----------------------------------|                             |-----------------------------------|
| ID (PK)                           |                             | ID (PK)                           |
| HomeTeam                          |                             | MatchID (FK -> matches.id)        |
| AwayTeam                          |                             | Actor (Who)                       |
| Sport                             |                             | Message (What)                    |
| StartTime                         |                             | Minute (When)                     |
| Status (Scheduled, Live, Finished)|                             | SequenceNo (Order)                |
| HomeScore                         |                             | Details (JSON 'Anything' Bucket)  |
| AwayScore                         |                             | CreatedAt                         |
+-----------------------------------+                             +-----------------------------------+
                                                                                    |
                                                                                    v
                                                                        FRONTEND APP (Display Story)
```

## Features

- **TypeScript** codebase with `tsx` hot-reloading
- **Express 5** server
- **Scalar Interactive Documentation** (`/docs`) with OpenAPI 3.1
- **Neon Postgres** with Drizzle ORM
- **WebSocket Server (`ws`)** for instantaneous event broadcasting
- **RESTful Endpoints** for matches and dynamic commentary events
- **Interactive UI Dashboard** (`public/index.html`) with live updates and match controls

## API Documentation (Scalar)

Interactive OpenAPI documentation is live at:

```text
http://localhost:5000/docs
```

Raw OpenAPI 3.1 JSON specification:

```text
http://localhost:5000/openapi.json
```

## API Endpoints

### Matches (Static Anchor)

- `GET /api/matches` — List all matches (supports `?status=scheduled|live|finished`)
- `GET /api/matches/:id` — Get single match details with nested commentary
- `POST /api/matches` — Create a new match
- `PATCH /api/matches/:id` — Update score and status (broadcasts `SCORE_UPDATED` via WebSocket)

### Commentary (Dynamic / Fast Events)

- `GET /api/matches/:id/commentary` — Get full commentary feed ordered by sequence
- `POST /api/matches/:id/commentary` — Add commentary event (broadcasts `COMMENTARY_ADDED` via WebSocket)
- `POST /api/seed` — Seed demo match & live commentary events

## Running Locally

```bash
npm run dev
```

Open your browser to:

- **Dashboard UI**: `http://localhost:5000/`
- **Scalar API Docs**: `http://localhost:5000/docs`
