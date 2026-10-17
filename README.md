# Hydropix

Real-time sensor monitoring platform. Sensors are wired to microcontrollers that
publish JSON readings over MQTT; the backend ingests them, analyzes risks and
conditions against per-sensor thresholds, persists to PostgreSQL, fans out through
Redis pub/sub, and streams to the browser over WebSockets. The Vue client renders a
live map and reading charts.

The backend is a single FastAPI project organized **Django-style**: the business logic
lives in eight self-contained apps under `apps/`, each with its own models, schemas,
views, URLs and services, wired together by the `config/` project package.

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
Sensors ──▶ microcontrollers ──MQTT──▶ mosquitto ──▶ apps.ingestion (aiomqtt intake)
                                                         │  apps.validation   (normalize/validate)
                                                         │  apps.rules        (classify risk/condition)
                                                         │  apps.persistence  (save reading)
                                                         ▼
                                                      PostgreSQL
                                                         │  publish "readings"
                                                         ▼
                                                       Redis ──▶ apps.realtime ──WebSocket──▶ Vue client (map + chart)
```

The ingest pipeline runs inside the process: `apps.ingestion.mqtt` feeds
`apps.ingestion.services.process_reading`, which chains validation → identity lookup →
rules → persistence → Redis fan-out. `apps.realtime` bridges the Redis channel to every
connected browser over `/ws/readings`.

## Backend apps

One Django-style app per bounded context, all under `apps/`:

| # | App         | Responsibility                                                      | Status      |
| - | ----------- | ------------------------------------------------------------------- | ----------- |
| 1 | ingestion   | Device management; MQTT intake of telemetry, actuator states, events | Implemented |
| 2 | validation  | Identity, permissions, units, timestamps, duplicates, plausibility   | Partial     |
| 3 | persistence | History, current state, traceability (PostgreSQL)                    | Implemented |
| 4 | rules       | Alerts, anomalies, hydraulic risk, operational policies              | Partial     |
| 5 | commands    | Authorize, schedule, verify actuator orders                          | Stub        |
| 6 | community   | Roles, tasks, shifts, voting, maintenance                            | Stub        |
| 7 | realtime    | Fan-out of updates/alarms/state changes to authorized clients        | Implemented |
| 8 | audit       | Decisions, errors, latencies, orders, confirmations                  | Stub        |

Apps import each other's models and services directly (like Django apps do); there is
no network hop between subsystems.

## Project layout

```
Hydropix/
├── backend/
│   ├── config/                  # the project package (≈ Django project)
│   │   ├── main.py              # FastAPI app + lifespan (starts MQTT + WS bridge)
│   │   ├── settings.py          # env-driven settings (pydantic-settings)
│   │   ├── urls.py              # project URLconf: includes each app's urls
│   │   ├── db.py                # engine, session, Base
│   │   └── redis.py             # Redis client
│   ├── apps/                    # one app per subsystem (≈ Django apps/)
│   │   ├── ingestion/           # 1. models, schemas, repository, services, views, urls, mqtt
│   │   ├── validation/          # 2. services (normalize + validate)
│   │   ├── persistence/         # 3. models, schemas, repository, views, urls
│   │   ├── rules/               # 4. classifier, services (classify + stubs)
│   │   ├── commands/            # 5. services, views, urls (stub)
│   │   ├── community/           # 6. services, views, urls (stub)
│   │   ├── realtime/            # 7. manager, bridge, views, urls (WebSocket)
│   │   └── audit/               # 8. services, views, urls (stub)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/          # MapView, ReadingChart, shadcn ui/
│   │   ├── composables/         # useSensors, useReadings (WebSocket), useReadingsHistory
│   │   ├── lib/                 # API client
│   │   ├── types/               # shared TS types
│   │   └── views/               # landing, dashboard, histórico, permisos, perfil, foro, reservorio
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
uvicorn config.main:app --reload
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

- `GET  /api/health` (config)
- `GET  /api/sensors`, `POST /api/sensors`, `GET /api/sensors/{id}` (ingestion)
- `GET  /api/readings?sensor_id=...&limit=...`, `POST /api/readings` (persistence)

Stubbed (return `501 Not Implemented`):

- `GET /api/commands` (commands)
- `GET /api/community` (community)
- `GET /api/audit` (audit)

A sensor payload looks like:

```json
{
  "name": "Boiler temperature",
  "type": "temperature",
  "unit": "°C",
  "latitude": 12.128772951717632,
  "longitude": -86.18159277757499,
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
- Django-style app split: `views.py` holds the FastAPI handlers, `urls.py` holds the
  routing (`APIRouter.add_api_route`), `services.py` holds business logic — so the
  layout is recognizable to anyone coming from Django.

## Next steps

- Per-user tailored exposure (auth + user-specific risk views).
- Replace the naive threshold classifier with the real risk model.
- Alembic migrations (tables are created on startup via `create_all`).
