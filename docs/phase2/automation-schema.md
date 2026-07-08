# Automation Schema

Principle schema for **phase 2** — future warehouse automation. Today FutureKawa
only **observes** storage conditions (sensors → alerts → human action). Phase 2
closes the loop: the same measurements drive **actuators** (heating,
humidification, ventilation) to keep each warehouse inside its ideal band without
manual intervention.

This document describes the principle only. It is a design input for the next
client interview (see [interview-questionnaire.md](interview-questionnaire.md)),
not a committed implementation.

## Control loop — sensors → decision → actuators

```
                        ┌───────────────────────────────────────┐
                        │           WAREHOUSE (per site)          │
                        │                                         │
   ┌──────────┐  meas.  │  ┌───────────────┐        ┌──────────┐  │
   │  DHT11    ├────────►│  │  CONTROLLER    │ cmd    │ ACTUATORS│  │
   │ sensor(s) │  MQTT   │  │ (decision unit)├───────►│ heat/hum/│  │
   └──────────┘         │  │                │        │  vent    │  │
        ▲               │  │ setpoint =     │        └────┬─────┘  │
        │               │  │  ideal band ±  │             │        │
        │  physical     │  │  tolerance     │◄────────────┘        │
        └───────────────┼──┤ state/faults    │  effect on air      │
          air condition │  └───────┬────────┘                      │
                        │          │ status/telemetry              │
                        └──────────┼───────────────────────────────┘
                                   │ MQTT
                                   ▼
              ┌───────────────────────────────────────────┐
              │   Country API  ──►  HQ API  ──►  Web app    │
              │   (alerts, history, supervision, override)  │
              └───────────────────────────────────────────┘
```

- **Sensors** — the existing ESP8266 + DHT11 nodes publish temperature/humidity
  every 30 s over MQTT (unchanged from phase 1).
- **Controller (decision unit)** — per warehouse, compares each reading to the
  **country setpoint** (ideal value ± tolerance) and decides which actuator to
  drive.
- **Actuators** — heating, humidification and ventilation elements that act on the
  air, closing the loop back to the sensors.
- **Supervision** — the country/HQ APIs and the web app keep their observability
  role and gain a **manual override** channel.

## Decision logic (per warehouse, per country band)

Each country has an ideal value and a tolerance (BR 29 °C/55 %, EC 31 °C/60 %,
CO 26 °C/80 %, ± 3 °C / ± 2 %). A **deadband** around the setpoint avoids rapid
on/off cycling.

```
temperature < ideal − tol   → HEAT on,  VENT off
temperature > ideal + tol   → HEAT off, VENT on (cool/exchange air)
humidity    < ideal − tol   → HUMIDIFY on
humidity    > ideal + tol   → HUMIDIFY off, VENT on (dry air out)
inside band (± deadband)    → hold — all actuators idle
```

Temperature and humidity are coupled (ventilation affects both), so the controller
resolves conflicts with a fixed priority: **safety first, then temperature, then
humidity**.

## Nominal vs degraded cases

| Case | Condition | Behaviour |
|---|---|---|
| **Nominal** | Sensor data fresh, actuators healthy | Closed-loop control keeps the site in band; web app shows "auto". |
| **Stale data** | No measurement for N cycles | Controller holds last safe state, stops actuators after a timeout, raises an alert. |
| **Actuator fault** | Command sent, no expected effect | Disable the faulty actuator, alert, fall back to manual. |
| **Broker/API down** | MQTT link lost | Controller runs autonomously on its local setpoint; supervision catches up on reconnect. |
| **Out of range persists** | In-band unreachable (e.g. heatwave) | Keep correcting toward the band, escalate the alert; never exceed hard limits. |

## Safety mechanisms

- **Setpoints and hard limits** — soft setpoint = ideal ± tolerance; **hard
  limits** beyond which an actuator is force-stopped regardless of the loop.
- **Logical emergency stop** — a single command (local button and/or supervision)
  that idles all actuators into a safe state.
- **Manual / auto modes** — every warehouse runs in **auto** (closed loop),
  **manual** (operator drives actuators), or **off**. Manual and the emergency stop
  always win over auto.
- **Watchdog & timeouts** — stale sensor data or a stuck actuator trips a timeout
  that returns the site to a safe state and alerts.
- **Anti-cycling** — deadband + minimum on/off durations protect the equipment.
- **Audit trail** — every automatic command and mode change is logged for review.

## Integration with the existing IoT/MQTT solution

Phase 2 reuses the phase-1 transport and adds two topic families alongside the
existing measurements topic
(`futurekawa/<country>/<warehouse_id>/measurements`, QoS 1):

```
futurekawa/<country>/<warehouse_id>/measurements   (existing)  sensors → controller/API
futurekawa/<country>/<warehouse_id>/commands        (new)       supervision/controller → actuators
futurekawa/<country>/<warehouse_id>/actuator_state  (new)       actuators → controller/API
```

- The **decision unit** can live on-site (an edge controller next to the ESP8266)
  or in the country service; either way it consumes the same measurements stream.
- The **country API** stays the single source of truth for alerts and history, and
  becomes the integration point for the manual-override commands issued from the
  web app.
- No change to the sensor firmware is required for the observation path; new
  contracts for `commands` and `actuator_state` would be added under
  `packages/contracts/mqtt/`.

## Open points for the client

The tolerances, hard limits, available actuators, on-site vs central control, and
responsibility for a running warehouse are **not decided**. They are the subject of
the [interview questionnaire](interview-questionnaire.md).
