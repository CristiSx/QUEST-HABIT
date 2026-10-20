# Quest Realm — Habit Tracker API & Pixel RPG UI

A full-stack rebuild of the gamified habit tracker specification, featuring a **Fastify + TypeScript + PostgreSQL** API on port `3001` and a **16-bit Pixel RPG Next.js UI** on port `3000`.

---

## How to Install and Run

### Option A: With Docker (Recommended)
From the `code/` (```bash cd code ```) directory, run:

```bash
docker compose up --build
```

This starts:
- **PostgreSQL (`db`)** on port `5432` (with persistent Docker volume `pgdata`)
- **Fastify API (`api`)** on `http://localhost:3001`
- **Next.js UI (`ui`)** on `http://localhost:3000`

### Option B: Local Run (Without Docker for API/UI)
Ensure a PostgreSQL instance is running on `localhost:5432` (e.g. `docker compose up -d db`), then from `code/`:

```bash
npm install
npm run start:api   
npm run dev        
```

### Running the Automated Recording Replay & Edge-Case Tests
With PostgreSQL running (`docker compose up -d db`), execute:

```bash
npm run test:replay
```

This replays all **68 requests** from `../reference_recording.jsonl` against the Fastify server and verifies exact status codes and JSON payloads, followed by custom edge-case tests.

---


