# Rally2026

Real-time sensor monitoring platform. Sensors are wired to microcontrollers that
publish JSON readings over MQTT; the backend ingests them, analyzes risks and
conditions against per-sensor thresholds, persists to PostgreSQL, fans out through
Redis pub/sub, and streams to the browser over WebSockets. The Vue client renders a
live map and reading charts.

## Stack

| Layer      | Technology                                                              |
| ---------- | ----------------------------------------------------------------------- |
| Backend    | FastAPI, Uvicorn, SQLAlchemy 2 (async), Pydantic v2                      |
| Database   | PostgreSQL 18                                                           |
| Cache/Bus  | Redis 8                                                                 |
| Messaging  | Eclipse Mosquitto (MQTT), `aiomqtt`                                     |
| Frontend   | Vue 3, TypeScript, Vite 8, Tailwind CSS 4, shadcn-vue, Pinia, Vue Router |
| Charts     | Chart.js (`vue-chartjs`)                                                |
| Maps       | MapLibre GL (`maplibre-gl`)                                             |
| Orchestration | Docker Compose                                                       |

## Architecture

```
Sensors ──▶ microcontrollers ──MQTT──▶ mosquitto ──▶ FastAPI (aiomqtt ingest)
                                                        │  classify (risk/condition)
                                                        │  persist
                                                        ▼
                                                     PostgreSQL
                                                        │  publish "readings"
                                                        ▼
                                                      Redis ──▶ WebSocket bridge ──▶ Vue client (map + chart)
```

The ingest looks up the sensor, classifies the reading (`ok` / `warning` / `alert`)
against its configured thresholds, persists it, and re-publishes it (with `id`, `status`
and `timestamp`) to the `readings` Redis channel. The WebSocket bridge forwards it to
every connected browser.

## Backend subsystems

Business logic is divided into eight bounded contexts under `app/subsystems/`:

| # | Subsystem   | Responsibility                                                      | Status        |
| - | ----------- | ------------------------------------------------------------------- | ------------- |
| 1 | ingestion   | Device management; MQTT intake of telemetry, actuator states, events | Implemented   |
| 2 | validation  | Identity, permissions, units, timestamps, duplicates, plausibility   | Partial       |
| 3 | persistence | History, current state, traceability (PostgreSQL)                    | Implemented   |
| 4 | rules       | Alerts, anomalies, hydraulic risk, operational policies              | Partial       |
| 5 | commands    | Authorize, schedule, verify actuator orders                          | Stub          |
| 6 | community   | Roles, tasks, shifts, voting, maintenance                            | Stub          |
| 7 | realtime    | Fan-out of updates/alarms/state changes to authorized clients        | Implemented   |
| 8 | audit       | Decisions, errors, latencies, orders, confirmations                  | Stub          |

The ingest pipeline chains the subsystems in order: MQTT → validation →
identity lookup → rules → persistence → realtime fan-out.

## Project layout

```
Rally2026/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + lifespan
│   │   ├── core/                # config, redis (cross-cutting infra)
│   │   ├── db/                  # engine, session, Base
│   │   ├── subsystems/          # business logic, split into 8 contexts
│   │   │   ├── ingestion/       # 1. IoT device management + MQTT intake
│   │   │   ├── validation/      # 2. identity/plausibility checks + normalization
│   │   │   ├── persistence/     # 3. history, current state, traceability
│   │   │   ├── rules/           # 4. alerts, anomalies, hydraulic risk
│   │   │   ├── commands/        # 5. actuator command coordinator (stub)
│   │   │   ├── community/       # 6. roles, tasks, shifts, votes (stub)
│   │   │   ├── realtime/        # 7. WebSocket + Redis fan-out
│   │   │   └── audit/           # 8. observability + audit trail (stub)
│   │   └── api/                 # router aggregation + health
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/          # MapView, ReadingChart, shadcn ui/
│   │   ├── composables/         # useReadings (WebSocket)
│   │   ├── lib/                 # API client
│   │   ├── types/               # shared TS types
│   │   └── views/               # HomeView (dashboard)
│   ├── Dockerfile
│   └── nginx.conf               # serves SPA + proxies /api and /ws
├── mosquitto/config/            # broker config (anonymous, port 1883)
├── docker-compose.yml
└── .env.example
```

## Run with Docker

```bash
cp .env.example .env
docker compose up --build
```

| Service   | URL                    |
| --------- | ---------------------- |
| Frontend  | http://localhost:8080  |
| API docs  | http://localhost:8000/docs |
| WebSocket | ws://localhost:8000/ws/readings |
| Postgres  | localhost:5432         |
| Redis     | localhost:6379         |
| MQTT      | localhost:1883         |

## Run locally (development)

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev                         # http://localhost:5173 (proxies /api and /ws to :8000)
```

## Publishing readings over MQTT

A microcontroller publishes JSON to `sensors/<sensor_id>/reading`:

```bash
mosquitto_pub -h localhost -t "sensors/00000000-0000-0000-0000-000000000001/reading" \
  -m '{"sensor_id": "00000000-0000-0000-0000-000000000001", "value": 27.5}'
```

The server classifies the value against the sensor's thresholds and streams the result
to `/ws/readings`.

## REST API

- `GET  /api/health`
- `GET  /api/sensors`
- `POST /api/sensors`
- `GET  /api/sensors/{id}`
- `GET  /api/readings?sensor_id=...&limit=...`
- `POST /api/readings`

Stubbed (return `501 Not Implemented`):

- `GET /api/commands`
- `GET /api/community`
- `GET /api/audit`

A sensor payload looks like:

```json
{
  "name": "Boiler temperature",
  "type": "temperature",
  "unit": "°C",
  "latitude": -31.42,
  "longitude": -64.18,
  "low_threshold": 5,
  "high_threshold": 80
}
```

## Version notes

- PostgreSQL 19 is still in RC (GA expected Nov 2026), so this pins the latest stable
  **18**.
- **Postgres 18 changed the data directory**: the volume must mount at
  `/var/lib/postgresql` (not `/var/lib/postgresql/data`).
- `create-vue` pins TypeScript `~6.0.0` (not the native `7.x`) for `vue-tsc`
  compatibility — kept as-is.
- `shadcn-vue` uses `reka-ui` as its headless component base.

## Next steps

- Per-user tailored exposure (auth + user-specific risk views).
- Replace the naive threshold classifier with the real risk model.
- Alembic migrations (tables are created on startup via `create_all`).
