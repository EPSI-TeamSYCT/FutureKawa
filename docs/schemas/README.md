# 🎨 Diagrams (schemas)

Renderable **diagram sources** for the FutureKawa docs. Each diagram below is a
**Mermaid** source (portable, versionable) that renders to the `*.png` filename
the docs reference. Produce the PNGs with any Mermaid renderer (Docusaurus, the
Mermaid Live Editor, `@mermaid-js/mermaid-cli`) or hand them to the design tool to
redraw in the charte.

> 💡 Excalidraw sources (`*.excalidraw`) can be added alongside once drawn; the
> Mermaid here is the source of truth for content and colours.

## Charte FutureKawa — apply these colours

| Role | Hex |
|---|---|
| Ivory background | `#f3ede3` |
| Surface / boxes | `#fcf9f3` (border `#d8cdbb`) |
| Text (espresso) | `#3b2a20` |
| Coffee accent (flows, borders) | `#6f4e37` |
| Caramel **signal** (alerts, primary) | `#c77b3b` / text-safe `#a96428` |
| Sensor fill / caramel tint | `#f3d8bc` |
| Data store tint | `#e4d2c4` |
| Success / Danger | `#2e9e5b` / `#b33a2b` |

Fonts: **Archivo** (labels), **IBM Plex Mono** (code/ids). Angular corners
(4–12 px radius). Golden rule: **one caramel accent per diagram = a signal**.

Target PNGs: `architecture-distributed.png` · `data-model-erd.png` ·
`mqtt-contract.png` · `sequence-measure-to-alert.png` · `cicd-pipeline.png` ·
`phase2-automation.png` · `iot-wiring.png`.

---

## 1. `architecture-distributed.png` — sovereign edges + HQ

```mermaid
flowchart LR
  classDef sensor fill:#f3d8bc,stroke:#a96428,color:#3b2a20
  classDef infra fill:#fcf9f3,stroke:#6f4e37,color:#3b2a20
  classDef data fill:#e4d2c4,stroke:#6f4e37,color:#3b2a20
  classDef hq fill:#fbeadb,stroke:#a96428,color:#3b2a20

  subgraph EDGE["🌎 Country edge — deployed once per country (BR · EC · CO)"]
    direction TB
    S["🌡️ DHT11 sensor / Python simulator"]:::sensor
    MQ["📡 Mosquitto broker"]:::infra
    WK["⚙️ Ingest worker"]:::infra
    API["🧩 Country API — Symfony / API Platform"]:::infra
    DB[("🗄️ PostgreSQL")]:::data
    S -->|"MQTT · QoS 1"| MQ --> WK --> API --> DB
  end

  subgraph HQSIEGE["🏛️ Headquarters (siège)"]
    direction TB
    AGG["🔗 Aggregator BFF — Express / TypeScript"]:::hq
    FE["🖥️ Frontend — React / Vite"]:::hq
    AGG --> FE
  end

  API -->|"REST · X-API-KEY"| AGG
```

> Note: **data sovereignty** — each country owns its DB; HQ never holds a
> country's raw data, it queries the three country APIs and consolidates.

---

## 2. `data-model-erd.png` — per-country domain model

```mermaid
erDiagram
  COUNTRY ||--o{ EXPLOITATION : has
  COUNTRY ||--o{ WAREHOUSE : has
  COUNTRY ||--o{ RESPONSIBLE : contacts
  EXPLOITATION ||--o{ BATCH : supplies
  WAREHOUSE ||--o{ BATCH : stores
  WAREHOUSE ||--o{ SENSOR : hosts
  WAREHOUSE ||--o{ ALERT : raises
  SENSOR ||--o{ MEASURE : emits
  BATCH ||--o{ ALERT : "may raise"

  COUNTRY { string name string isoCode float idealTemp float idealHumidity float toleranceTemp float toleranceHumidity }
  EXPLOITATION { string name }
  WAREHOUSE { string name }
  BATCH { string ref date storageDate string status }
  SENSOR { string hardwareId string model string status datetime lastCom }
  MEASURE { float temperature float humidity datetime measuredAt }
  ALERT { string type string message datetime createdAt bool emailSent }
  RESPONSIBLE { string name string email }
```

> A `Batch` has **two** parents (its `Exploitation` and its `Warehouse`). A
> `Measure` carries no country column — location is resolved
> `Measure → Sensor → Warehouse → Country`. `User` (auth) stands alone.

---

## 3. `mqtt-contract.png` — topic & payload

```mermaid
flowchart LR
  classDef t fill:#fcf9f3,stroke:#6f4e37,color:#3b2a20
  classDef sig fill:#fbeadb,stroke:#a96428,color:#3b2a20
  DEV["🌡️ Device / simulator"]:::t -->|"publish · QoS 1"| TOP["📇 futurekawa/{country}/{warehouse_id}/measurements"]:::sig
  TOP --> BRK["📡 Mosquitto"]:::t
  BRK -->|"subscribe futurekawa/{country}/+/measurements"| WK["⚙️ Ingest worker"]:::t
```

Payload (JSON, contract in `packages/contracts/mqtt/measurements.md`):

```json
{ "warehouse_id": "wh-01", "country": "brazil", "model": "DHT11",
  "hardware_id": "br-wh-01", "temperature": 24.3, "humidity": 49.9,
  "timestamp": 1783454596 }
```

---

## 4. `sequence-measure-to-alert.png` — measurement lifecycle

```mermaid
sequenceDiagram
  autonumber
  participant S as Sensor / Simulator
  participant B as Broker (MQTT)
  participant W as Ingest worker
  participant DB as PostgreSQL
  participant API as Country API
  participant M as Mailer
  participant HQ as HQ Aggregator
  S->>B: publish measurement (QoS 1)
  B->>W: deliver
  W->>DB: resolve Sensor by hardware_id, persist Measure
  W->>API: evaluate country band ± tolerance
  alt out of band, OR lot stored > 365 days
    API->>DB: create Alert
    API->>M: email the country Responsible
  end
  HQ->>API: GET stocks / measures / alerts (X-API-KEY)
  API-->>HQ: consolidated data
```

---

## 5. `cicd-pipeline.png` — CI gating + release + hybrid CD

```mermaid
flowchart TB
  classDef job fill:#fcf9f3,stroke:#6f4e37,color:#3b2a20
  classDef always fill:#fbeadb,stroke:#a96428,color:#3b2a20
  classDef rel fill:#e4d2c4,stroke:#6f4e37,color:#3b2a20

  PR["📥 Pull request"]:::job --> CH["changes<br/>(path filter)"]:::job
  CH --> Q["quality<br/>lint · format · build<br/><i>skippable</i>"]:::job
  Q --> SEC["security<br/>CVE audit<br/><b>ALWAYS runs</b>"]:::always
  SEC --> T["tests<br/>+ 80% coverage<br/><i>skippable</i>"]:::job

  MG["🔀 Merge to main"]:::rel --> REL["release.yml<br/>SemVer from branch"]:::rel
  REL --> CD["cd-&lt;service&gt;.yml<br/>build + push"]:::rel
  CD --> IMG["📦 ghcr.io/…<br/>:x.y.z · :sha · :latest"]:::rel
  IMG -.->|"Jenkins pulls the immutable image"| JEN["🚀 Jenkins CD<br/>deploy VPS + smoke test"]:::always
```

---

## 6. `phase2-automation.png` — closed-loop control (phase 2)

```mermaid
flowchart LR
  classDef s fill:#f3d8bc,stroke:#a96428,color:#3b2a20
  classDef c fill:#fcf9f3,stroke:#6f4e37,color:#3b2a20
  classDef a fill:#fbeadb,stroke:#a96428,color:#3b2a20

  SENS["🌡️ Sensors (DHT11)"]:::s -->|"measurements"| CTRL["🧠 Controller<br/>setpoint = ideal ± tolerance"]:::c
  CTRL -->|"commands"| ACT["🔧 Actuators<br/>heat · humidify · ventilate"]:::a
  ACT -.->|"physical effect on air"| SENS
  CTRL -->|"status / telemetry"| SUP["🖥️ Country API → HQ → Web<br/>supervision + manual override"]:::c
  SUP -.->|"override / mode"| CTRL
```

> Reuses the phase-1 MQTT transport; adds `…/commands` and `…/actuator_state`
> topics. Safeties: hard limits, logical e-stop, manual/auto/off, watchdog.

---

## 7. `iot-wiring.png` — ESP8266 + DHT11 node

Pins confirmed from the firmware (`apps/country/iot/firmware`). Mermaid gives the
connection logic; a breadboard-style schematic can be drawn from this table.

| From (ESP8266 / NodeMCU) | To | Signal |
|---|---|---|
| `3V3` | DHT11 `VCC` | power |
| `GND` | DHT11 `GND` | ground |
| `D2` (GPIO4) | DHT11 `DATA` | 1-wire data |
| `D1` (GPIO5) | Green LED (+220 Ω) | OK / published |
| `D5` (GPIO14) | Red LED (+220 Ω) | fault / no link |

```mermaid
flowchart LR
  classDef mc fill:#fcf9f3,stroke:#6f4e37,color:#3b2a20
  classDef sen fill:#f3d8bc,stroke:#a96428,color:#3b2a20
  classDef ok fill:#e5f1e9,stroke:#2e9e5b,color:#1e7343
  classDef ko fill:#f6ded9,stroke:#b33a2b,color:#96301f

  ESP["ESP8266 / NodeMCU"]:::mc
  DHT["DHT11 sensor"]:::sen
  GLED["🟢 Green LED — OK"]:::ok
  RLED["🔴 Red LED — fault"]:::ko
  ESP ---|"3V3 · GND"| DHT
  ESP ---|"D2 / GPIO4 → DATA"| DHT
  ESP ---|"D1 / GPIO5"| GLED
  ESP ---|"D5 / GPIO14"| RLED
```
