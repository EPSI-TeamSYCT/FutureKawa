# IoT Simulator Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a country-agnostic Python worker that publishes simulated
temperature/humidity measurements to MQTT, configured entirely by environment
variables and deployable once per country.

**Architecture:** Flat modules in `src/` (config, models, generator, publisher,
worker, main), each with one responsibility. `pydantic-settings` validates the env;
a per-warehouse random-walk generator feeds a thin MQTT publisher; a worker loop
ties them together. Docker Compose runs Mosquitto + three country services.

**Tech Stack:** Python 3.12, `uv`, `paho-mqtt`, `pydantic-settings`, `pytest`.

**Prerequisites:** Python 3.12+ and `uv` installed. Design spec:
`docs/superpowers/specs/2026-07-07-iot-simulator-worker-design.md`.

**Working directory for all commands:** `apps/country/iot/simulator/`.

---

### Task 1: Scaffold the uv project

**Files:**
- Delete: `apps/country/iot/simulator/simulator.py`, `apps/country/iot/simulator/requirements.txt` (old throwaway)
- Create: `apps/country/iot/simulator/pyproject.toml`
- Create: `apps/country/iot/simulator/src/__init__.py` (empty), `apps/country/iot/simulator/tests/__init__.py` (empty)
- Create: `apps/country/iot/simulator/tests/test_smoke.py`

- [ ] **Step 1: Remove the old throwaway files**

```bash
cd apps/country/iot/simulator
rm -f simulator.py requirements.txt
```

- [ ] **Step 2: Create `pyproject.toml`**

```toml
[project]
name = "iot-simulator"
version = "0.1.0"
description = "FutureKawa IoT MQTT simulator worker"
requires-python = ">=3.10"
dependencies = [
    "paho-mqtt>=2.0",
    "pydantic-settings>=2.0",
]

[dependency-groups]
dev = ["pytest>=8.0"]

[tool.uv]
package = false

[tool.pytest.ini_options]
pythonpath = ["src"]
testpaths = ["tests"]
```

- [ ] **Step 3: Create empty package markers and a smoke test**

`src/__init__.py` and `tests/__init__.py` are empty files.

`tests/test_smoke.py`:

```python
def test_smoke():
    assert True
```

- [ ] **Step 4: Sync deps and run the smoke test**

Run: `uv sync && uv run pytest -q`
Expected: `1 passed`.

- [ ] **Step 5: Commit**

```bash
git add apps/country/iot/simulator
git commit -m "chore(iot): scaffold uv project for the simulator worker"
```

---

### Task 2: Measurement model

**Files:**
- Create: `apps/country/iot/simulator/src/models.py`
- Test: `apps/country/iot/simulator/tests/test_models.py`

- [ ] **Step 1: Write the failing test**

`tests/test_models.py`:

```python
import json

from models import Measurement, now_epoch


def test_to_json_matches_contract():
    m = Measurement("wh-01", "brazil", 27.4, 58.0, 1751808000)
    assert json.loads(m.to_json()) == {
        "warehouse_id": "wh-01",
        "country": "brazil",
        "temperature": 27.4,
        "humidity": 58.0,
        "timestamp": 1751808000,
    }


def test_now_epoch_is_int():
    assert isinstance(now_epoch(), int)
```

- [ ] **Step 2: Run to verify it fails**

Run: `uv run pytest tests/test_models.py -q`
Expected: FAIL (`ModuleNotFoundError: models`).

- [ ] **Step 3: Implement `src/models.py`**

```python
import json
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class Measurement:
    warehouse_id: str
    country: str
    temperature: float
    humidity: float
    timestamp: int

    def to_json(self) -> str:
        return json.dumps(
            {
                "warehouse_id": self.warehouse_id,
                "country": self.country,
                "temperature": self.temperature,
                "humidity": self.humidity,
                "timestamp": self.timestamp,
            }
        )


def now_epoch() -> int:
    return int(datetime.now(timezone.utc).timestamp())
```

- [ ] **Step 4: Run to verify it passes**

Run: `uv run pytest tests/test_models.py -q`
Expected: `2 passed`.

- [ ] **Step 5: Commit**

```bash
git add apps/country/iot/simulator/src/models.py apps/country/iot/simulator/tests/test_models.py
git commit -m "feat(iot): add measurement model matching the mqtt contract"
```

---

### Task 3: Settings (env config)

**Files:**
- Create: `apps/country/iot/simulator/src/config.py`
- Test: `apps/country/iot/simulator/tests/test_config.py`

- [ ] **Step 1: Write the failing test**

`tests/test_config.py`:

```python
import pytest
from pydantic import ValidationError

from config import Settings


def _required(monkeypatch):
    monkeypatch.setenv("COUNTRY", "brazil")
    monkeypatch.setenv("TEMP_THRESHOLD", "29")
    monkeypatch.setenv("HUMIDITY_THRESHOLD", "55")


def test_loads_required_and_defaults(monkeypatch):
    _required(monkeypatch)
    s = Settings(_env_file=None)
    assert s.country == "brazil"
    assert s.temp_threshold == 29.0
    assert s.humidity_threshold == 55.0
    assert s.temp_tolerance == 3.0
    assert s.publish_interval == 30.0
    assert s.warehouse_ids == ["wh-01"]


def test_missing_required_raises(monkeypatch):
    monkeypatch.delenv("COUNTRY", raising=False)
    monkeypatch.delenv("TEMP_THRESHOLD", raising=False)
    monkeypatch.delenv("HUMIDITY_THRESHOLD", raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_warehouses_csv_parsing(monkeypatch):
    _required(monkeypatch)
    monkeypatch.setenv("WAREHOUSES", "wh-01, wh-02 ,wh-03")
    s = Settings(_env_file=None)
    assert s.warehouse_ids == ["wh-01", "wh-02", "wh-03"]


def test_empty_country_rejected(monkeypatch):
    _required(monkeypatch)
    monkeypatch.setenv("COUNTRY", "   ")
    with pytest.raises(ValidationError):
        Settings(_env_file=None)
```

- [ ] **Step 2: Run to verify it fails**

Run: `uv run pytest tests/test_config.py -q`
Expected: FAIL (`ModuleNotFoundError: config`).

- [ ] **Step 3: Implement `src/config.py`**

```python
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    mqtt_host: str = "localhost"
    mqtt_port: int = 1883
    mqtt_qos: int = 1

    country: str
    warehouses: str = "wh-01"  # comma-separated ids
    temp_threshold: float
    humidity_threshold: float
    temp_tolerance: float = 3.0
    humidity_tolerance: float = 2.0

    publish_interval: float = 30.0
    anomaly_probability: float = 0.1
    random_seed: int | None = None

    @field_validator("country")
    @classmethod
    def _country_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("COUNTRY must be a non-empty string")
        return v.strip()

    @property
    def warehouse_ids(self) -> list[str]:
        return [w.strip() for w in self.warehouses.split(",") if w.strip()]
```

- [ ] **Step 4: Run to verify it passes**

Run: `uv run pytest tests/test_config.py -q`
Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
git add apps/country/iot/simulator/src/config.py apps/country/iot/simulator/tests/test_config.py
git commit -m "feat(iot): add env-driven settings with validation"
```

---

### Task 4: Reading generator

**Files:**
- Create: `apps/country/iot/simulator/src/generator.py`
- Test: `apps/country/iot/simulator/tests/test_generator.py`

- [ ] **Step 1: Write the failing test**

`tests/test_generator.py`:

```python
import random

from generator import ReadingGenerator


def _gen(anomaly=0.0, seed=42):
    return ReadingGenerator(
        temp_threshold=29.0,
        humidity_threshold=55.0,
        temp_tolerance=3.0,
        humidity_tolerance=2.0,
        anomaly_probability=anomaly,
        rng=random.Random(seed),
    )


def test_deterministic_with_seed():
    a = [_gen().next() for _ in range(5)]
    b = [_gen().next() for _ in range(5)]
    assert a == b


def test_normal_reading_within_tolerance():
    g = _gen(anomaly=0.0)
    for _ in range(100):
        t, h = g.next()
        assert 29.0 - 3.0 - 0.1 <= t <= 29.0 + 3.0 + 0.1
        assert 55.0 - 2.0 - 0.1 <= h <= 55.0 + 2.0 + 0.1


def test_anomaly_goes_out_of_range():
    g = _gen(anomaly=1.0)
    for _ in range(20):
        t, h = g.next()
        assert abs(t - 29.0) > 3.0 or abs(h - 55.0) > 2.0
```

- [ ] **Step 2: Run to verify it fails**

Run: `uv run pytest tests/test_generator.py -q`
Expected: FAIL (`ModuleNotFoundError: generator`).

- [ ] **Step 3: Implement `src/generator.py`**

```python
def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


class ReadingGenerator:
    """Smooth random walk around a threshold, with occasional anomalies.

    A random.Random instance is injected so runs are reproducible and testable.
    """

    def __init__(
        self,
        temp_threshold: float,
        humidity_threshold: float,
        temp_tolerance: float,
        humidity_tolerance: float,
        anomaly_probability: float,
        rng,
    ):
        self.temp_threshold = temp_threshold
        self.humidity_threshold = humidity_threshold
        self.temp_tolerance = temp_tolerance
        self.humidity_tolerance = humidity_tolerance
        self.anomaly_probability = anomaly_probability
        self.rng = rng
        self._temp = temp_threshold
        self._hum = humidity_threshold

    def next(self) -> tuple[float, float]:
        # Random walk with gentle mean reversion toward the threshold.
        self._temp += self.rng.uniform(-0.4, 0.4) + (self.temp_threshold - self._temp) * 0.05
        self._hum += self.rng.uniform(-0.6, 0.6) + (self.humidity_threshold - self._hum) * 0.05

        if self.rng.random() < self.anomaly_probability:
            temp = self.temp_threshold + self.rng.choice([-1, 1]) * (
                self.temp_tolerance + self.rng.uniform(1.0, 4.0)
            )
            hum = self.humidity_threshold + self.rng.choice([-1, 1]) * (
                self.humidity_tolerance + self.rng.uniform(1.0, 5.0)
            )
        else:
            temp = _clamp(
                self._temp,
                self.temp_threshold - self.temp_tolerance,
                self.temp_threshold + self.temp_tolerance,
            )
            hum = _clamp(
                self._hum,
                self.humidity_threshold - self.humidity_tolerance,
                self.humidity_threshold + self.humidity_tolerance,
            )

        hum = _clamp(hum, 0.0, 100.0)
        return round(temp, 1), round(hum, 1)
```

- [ ] **Step 4: Run to verify it passes**

Run: `uv run pytest tests/test_generator.py -q`
Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add apps/country/iot/simulator/src/generator.py apps/country/iot/simulator/tests/test_generator.py
git commit -m "feat(iot): add reading generator with random walk and anomalies"
```

---

### Task 5: MQTT publisher

**Files:**
- Create: `apps/country/iot/simulator/src/publisher.py`
- Test: `apps/country/iot/simulator/tests/test_publisher.py`

- [ ] **Step 1: Write the failing test**

`tests/test_publisher.py`:

```python
from publisher import MqttPublisher


class FakeClient:
    def __init__(self):
        self.published = []
        self.loop_started = False
        self.connected_to = None

    def connect(self, host, port, keepalive):
        self.connected_to = (host, port)

    def loop_start(self):
        self.loop_started = True

    def loop_stop(self):
        self.loop_started = False

    def disconnect(self):
        pass

    def publish(self, topic, payload, qos, retain):
        self.published.append((topic, payload, qos, retain))


def test_publish_uses_topic_qos_and_no_retain():
    fake = FakeClient()
    pub = MqttPublisher("localhost", 1883, qos=1, client_id="t", client=fake)
    pub.publish("futurekawa/brazil/wh-01/measurements", "{}")
    assert fake.published == [
        ("futurekawa/brazil/wh-01/measurements", "{}", 1, False)
    ]


def test_connect_starts_loop():
    fake = FakeClient()
    pub = MqttPublisher("localhost", 1883, qos=1, client_id="t", client=fake)
    pub.connect()
    assert fake.loop_started is True
    assert fake.connected_to == ("localhost", 1883)
```

- [ ] **Step 2: Run to verify it fails**

Run: `uv run pytest tests/test_publisher.py -q`
Expected: FAIL (`ModuleNotFoundError: publisher`).

- [ ] **Step 3: Implement `src/publisher.py`**

```python
import time

import paho.mqtt.client as mqtt


class MqttPublisher:
    def __init__(self, host, port, qos, client_id, client=None):
        self.host = host
        self.port = port
        self.qos = qos
        self._client = client or mqtt.Client(
            mqtt.CallbackAPIVersion.VERSION2, client_id=client_id
        )

    def connect(self, retries: int = 10, delay: float = 2.0) -> None:
        last_exc = None
        for _ in range(retries):
            try:
                self._client.connect(self.host, self.port, keepalive=60)
                self._client.loop_start()
                return
            except OSError as exc:
                last_exc = exc
                time.sleep(delay)
        raise ConnectionError(
            f"Could not reach broker at {self.host}:{self.port}: {last_exc}"
        )

    def publish(self, topic: str, payload: str) -> None:
        self._client.publish(topic, payload, qos=self.qos, retain=False)

    def disconnect(self) -> None:
        self._client.loop_stop()
        self._client.disconnect()
```

- [ ] **Step 4: Run to verify it passes**

Run: `uv run pytest tests/test_publisher.py -q`
Expected: `2 passed`.

- [ ] **Step 5: Commit**

```bash
git add apps/country/iot/simulator/src/publisher.py apps/country/iot/simulator/tests/test_publisher.py
git commit -m "feat(iot): add mqtt publisher wrapper with reconnect"
```

---

### Task 6: Worker orchestration

**Files:**
- Create: `apps/country/iot/simulator/src/worker.py`
- Test: `apps/country/iot/simulator/tests/test_worker.py`

- [ ] **Step 1: Write the failing test**

`tests/test_worker.py`:

```python
import random

from config import Settings
from worker import build_generators, publish_round


class FakePublisher:
    def __init__(self):
        self.calls = []

    def publish(self, topic, payload):
        self.calls.append((topic, payload))


def _settings(monkeypatch):
    monkeypatch.setenv("COUNTRY", "brazil")
    monkeypatch.setenv("TEMP_THRESHOLD", "29")
    monkeypatch.setenv("HUMIDITY_THRESHOLD", "55")
    monkeypatch.setenv("WAREHOUSES", "wh-01,wh-02")
    return Settings(_env_file=None)


def test_publish_round_one_message_per_warehouse(monkeypatch):
    s = _settings(monkeypatch)
    gens = build_generators(s, lambda: random.Random(1))
    pub = FakePublisher()
    publish_round(s, gens, pub, now=lambda: 1751808000)
    topics = [t for t, _ in pub.calls]
    assert topics == [
        "futurekawa/brazil/wh-01/measurements",
        "futurekawa/brazil/wh-02/measurements",
    ]
```

- [ ] **Step 2: Run to verify it fails**

Run: `uv run pytest tests/test_worker.py -q`
Expected: FAIL (`ModuleNotFoundError: worker`).

- [ ] **Step 3: Implement `src/worker.py`**

```python
import signal
import time

from models import Measurement, now_epoch


def build_generators(settings, rng_factory):
    from generator import ReadingGenerator

    generators = {}
    for wh in settings.warehouse_ids:
        generators[wh] = ReadingGenerator(
            settings.temp_threshold,
            settings.humidity_threshold,
            settings.temp_tolerance,
            settings.humidity_tolerance,
            settings.anomaly_probability,
            rng_factory(),
        )
    return generators


def publish_round(settings, generators, publisher, now=now_epoch):
    for wh, gen in generators.items():
        temp, hum = gen.next()
        measurement = Measurement(wh, settings.country, temp, hum, now())
        topic = f"futurekawa/{settings.country}/{wh}/measurements"
        publisher.publish(topic, measurement.to_json())


class Worker:
    def __init__(self, settings, generators, publisher):
        self.settings = settings
        self.generators = generators
        self.publisher = publisher
        self._running = False

    def run(self) -> None:
        self._running = True
        signal.signal(signal.SIGINT, self._stop)
        signal.signal(signal.SIGTERM, self._stop)
        self.publisher.connect()
        try:
            while self._running:
                publish_round(self.settings, self.generators, self.publisher)
                self._sleep(self.settings.publish_interval)
        finally:
            self.publisher.disconnect()

    def _stop(self, *_):
        self._running = False

    def _sleep(self, seconds: float) -> None:
        slept = 0.0
        while self._running and slept < seconds:
            time.sleep(0.2)
            slept += 0.2
```

- [ ] **Step 4: Run to verify it passes**

Run: `uv run pytest tests/test_worker.py -q`
Expected: `1 passed`.

- [ ] **Step 5: Commit**

```bash
git add apps/country/iot/simulator/src/worker.py apps/country/iot/simulator/tests/test_worker.py
git commit -m "feat(iot): add worker loop and publish round"
```

---

### Task 7: Entry point

**Files:**
- Create: `apps/country/iot/simulator/src/main.py`

- [ ] **Step 1: Implement `src/main.py`**

```python
import random

from config import Settings
from publisher import MqttPublisher
from worker import Worker, build_generators


def main() -> None:
    settings = Settings()

    seed = settings.random_seed
    counter = {"n": 0}

    def rng_factory():
        counter["n"] += 1
        return random.Random(None if seed is None else seed + counter["n"])

    generators = build_generators(settings, rng_factory)
    publisher = MqttPublisher(
        settings.mqtt_host,
        settings.mqtt_port,
        settings.mqtt_qos,
        client_id=f"iot-sim-{settings.country}",
    )
    print(
        f"IoT simulator | {settings.country} | warehouses={settings.warehouse_ids} "
        f"| broker={settings.mqtt_host}:{settings.mqtt_port} "
        f"| every {settings.publish_interval}s"
    )
    Worker(settings, generators, publisher).run()


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run the full test suite (all modules still green)**

Run: `uv run pytest -q`
Expected: all tests pass (models, config, generator, publisher, worker, smoke).

- [ ] **Step 3: Commit**

```bash
git add apps/country/iot/simulator/src/main.py
git commit -m "feat(iot): add simulator entry point"
```

---

### Task 8: Deployment files

**Files:**
- Create: `apps/country/iot/simulator/.env.example`
- Create: `apps/country/iot/simulator/Dockerfile`
- Create: `apps/country/iot/simulator/docker-compose.yml`
- Create: `apps/country/iot/simulator/.dockerignore`

- [ ] **Step 1: Create `.env.example`**

```dotenv
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_QOS=1

COUNTRY=brazil
WAREHOUSES=wh-01,wh-02
TEMP_THRESHOLD=29
HUMIDITY_THRESHOLD=55
TEMP_TOLERANCE=3
HUMIDITY_TOLERANCE=2

PUBLISH_INTERVAL=30
ANOMALY_PROBABILITY=0.1
# RANDOM_SEED=42
```

- [ ] **Step 2: Create `.dockerignore`**

```
.venv
__pycache__
*.pyc
.env
tests
```

- [ ] **Step 3: Create `Dockerfile`**

```dockerfile
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
WORKDIR /app
COPY pyproject.toml ./
COPY src ./src
RUN uv sync --no-dev
CMD ["uv", "run", "--no-dev", "python", "src/main.py"]
```

- [ ] **Step 4: Create `docker-compose.yml`**

```yaml
services:
  mosquitto:
    image: eclipse-mosquitto:2
    container_name: futurekawa-mosquitto
    ports:
      - "1883:1883"
    volumes:
      - ../../../../infra/docker/mosquitto/mosquitto.conf:/mosquitto/config/mosquitto.conf:ro

  brazil:
    build: .
    environment:
      MQTT_HOST: mosquitto
      COUNTRY: brazil
      WAREHOUSES: wh-01,wh-02
      TEMP_THRESHOLD: "29"
      HUMIDITY_THRESHOLD: "55"
    depends_on: [mosquitto]

  ecuador:
    build: .
    environment:
      MQTT_HOST: mosquitto
      COUNTRY: ecuador
      WAREHOUSES: wh-01
      TEMP_THRESHOLD: "31"
      HUMIDITY_THRESHOLD: "60"
    depends_on: [mosquitto]

  colombia:
    build: .
    environment:
      MQTT_HOST: mosquitto
      COUNTRY: colombia
      WAREHOUSES: wh-01
      TEMP_THRESHOLD: "26"
      HUMIDITY_THRESHOLD: "80"
    depends_on: [mosquitto]
```

- [ ] **Step 5: Verify compose config parses**

Run: `docker compose config -q`
Expected: no output, exit 0.

- [ ] **Step 6: Commit**

```bash
git add apps/country/iot/simulator/.env.example apps/country/iot/simulator/.dockerignore apps/country/iot/simulator/Dockerfile apps/country/iot/simulator/docker-compose.yml
git commit -m "build(iot): add dockerfile and compose for the simulator fleet"
```

---

### Task 9: Simulator README

**Files:**
- Create: `apps/country/iot/simulator/README.md`

- [ ] **Step 1: Write `README.md`**

````markdown
# IoT Simulator 🛰️

Country-agnostic worker that publishes simulated temperature/humidity to MQTT,
exactly like the real ESP8266 firmware. One instance = one country, configured by
environment variables. See the design:
[`docs/superpowers/specs/2026-07-07-iot-simulator-worker-design.md`](../../../../docs/superpowers/specs/2026-07-07-iot-simulator-worker-design.md).

## Prerequisites

- **Python 3.12+** and **[uv](https://docs.astral.sh/uv/)**.
- The **Mosquitto broker** — [`infra/docker/mosquitto`](../../../../infra/docker/mosquitto/README.md)
  (or use the compose file here, which starts its own).

## Run locally (one country)

```bash
cd apps/country/iot/simulator
uv sync
cp .env.example .env        # then edit COUNTRY / thresholds / MQTT_HOST
uv run python src/main.py
```

## Run the full fleet (broker + 3 countries)

```bash
docker compose up --build
```

Watch the messages:

```bash
docker exec -it futurekawa-mosquitto mosquitto_sub -t "futurekawa/#" -v
```

## Configuration (all env-driven)

| Variable | Default | Meaning |
|---|---|---|
| `MQTT_HOST` / `MQTT_PORT` | `localhost` / `1883` | Broker |
| `MQTT_QOS` | `1` | Publish QoS |
| `COUNTRY` | *(required)* | Country label |
| `WAREHOUSES` | `wh-01` | Comma-separated ids |
| `TEMP_THRESHOLD` / `HUMIDITY_THRESHOLD` | *(required)* | Country thresholds |
| `TEMP_TOLERANCE` / `HUMIDITY_TOLERANCE` | `3.0` / `2.0` | ± tolerances |
| `PUBLISH_INTERVAL` | `30` | Seconds between rounds |
| `ANOMALY_PROBABILITY` | `0.1` | Chance of an out-of-range reading |
| `RANDOM_SEED` | *(optional)* | Reproducible readings |

**Add a country** = add a service block in `docker-compose.yml` with its env. No code change.

## Tests

```bash
uv run pytest
```
````

- [ ] **Step 2: Commit**

```bash
git add apps/country/iot/simulator/README.md
git commit -m "docs(iot): document the simulator worker"
```

---

### Task 10: Final verification

- [ ] **Step 1: Full suite green**

Run: `uv run pytest -q`
Expected: all tests pass.

- [ ] **Step 2: End-to-end smoke (optional, needs Docker)**

Run: `docker compose up --build -d && sleep 15 && docker exec futurekawa-mosquitto mosquitto_sub -t "futurekawa/#" -v -W 5`
Expected: JSON measurement lines for `brazil`, `ecuador`, `colombia`.
Then: `docker compose down`.

- [ ] **Step 3: Confirm the local worker prints and publishes**

Run (with broker up): `uv run python src/main.py` with `COUNTRY=brazil TEMP_THRESHOLD=29 HUMIDITY_THRESHOLD=55 PUBLISH_INTERVAL=2` set in the environment.
Expected: a startup line, then `futurekawa/brazil/wh-01/measurements` messages every 2 s. Stop with Ctrl+C.
