"""Backend business logic, split into eight subsystems (bounded contexts).

Each subpackage owns its models, schemas, services and HTTP routes. The
subsystems are:

1. ingestion   — IoT device management and telemetry intake (MQTT).
2. validation  — identity, permissions, units, timestamps, duplicates and
                 physical plausibility checks plus normalization.
3. persistence — history, current state and traceability (PostgreSQL).
4. rules       — alerts, anomalies, hydraulic risk and operational policies.
5. commands    — authorization, scheduling and verification of actuator orders.
6. community   — roles, tasks, shifts, voting and maintenance.
7. realtime    — fan-out of updates, alarms and state changes (WebSockets).
8. audit       — decisions, errors, latencies, orders and confirmations.

Cross-cutting infrastructure (config, Redis, DB session) lives in
``app.core`` and ``app.db``.
"""
