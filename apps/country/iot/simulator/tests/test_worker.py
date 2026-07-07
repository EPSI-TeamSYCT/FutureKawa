import json
import random

from config import Settings
from worker import Worker, build_generators, publish_round

_ONE = '[{"warehouse":"wh-01","hardware_id":"ref1"}]'


class FakePublisher:
    def __init__(self):
        self.calls = []
        self.connected = False
        self.disconnected = False

    def connect(self):
        self.connected = True

    def publish(self, topic, payload):
        self.calls.append((topic, payload))

    def disconnect(self):
        self.disconnected = True


def _settings(monkeypatch, devices=_ONE):
    monkeypatch.setenv("COUNTRY", "brazil")
    monkeypatch.setenv("TEMP_THRESHOLD", "29")
    monkeypatch.setenv("HUMIDITY_THRESHOLD", "55")
    monkeypatch.setenv("DEVICES", devices)
    return Settings(_env_file=None)


def test_publish_round_one_message_per_device(monkeypatch):
    s = _settings(
        monkeypatch,
        '[{"warehouse":"wh-01","hardware_id":"ref1"},{"warehouse":"wh-02","hardware_id":"ref2"}]',
    )
    gens = build_generators(s, lambda: random.Random(1))
    pub = FakePublisher()
    publish_round(s, gens, pub, now=lambda: 1751808000)
    topics = [t for t, _ in pub.calls]
    assert topics == [
        "futurekawa/brazil/wh-01/measurements",
        "futurekawa/brazil/wh-02/measurements",
    ]


def test_multiple_devices_same_warehouse(monkeypatch):
    s = _settings(
        monkeypatch,
        '[{"warehouse":"wh-01","hardware_id":"ref1"},{"warehouse":"wh-01","hardware_id":"ref2"}]',
    )
    gens = build_generators(s, lambda: random.Random(1))
    pub = FakePublisher()
    publish_round(s, gens, pub, now=lambda: 1751808000)
    # both publish to the same warehouse topic, distinguished by hardware_id
    assert [t for t, _ in pub.calls] == [
        "futurekawa/brazil/wh-01/measurements",
        "futurekawa/brazil/wh-01/measurements",
    ]
    assert [json.loads(p)["hardware_id"] for _, p in pub.calls] == ["ref1", "ref2"]


def test_worker_runs_one_round_then_stops(monkeypatch):
    s = _settings(monkeypatch)
    gens = build_generators(s, lambda: random.Random(1))
    pub = FakePublisher()
    worker = Worker(s, gens, pub)
    # Stop after the first round by breaking out during the sleep.
    monkeypatch.setattr(worker, "_sleep", lambda seconds: setattr(worker, "_running", False))
    worker.run()
    assert pub.connected is True
    assert pub.disconnected is True
    assert len(pub.calls) == len(s.devices)


def test_stop_sets_running_false(monkeypatch):
    s = _settings(monkeypatch)
    worker = Worker(s, [], FakePublisher())
    worker._running = True
    worker._stop()
    assert worker._running is False


def test_sleep_returns_immediately_when_stopped(monkeypatch):
    s = _settings(monkeypatch)
    worker = Worker(s, [], FakePublisher())
    worker._running = False
    worker._sleep(999)  # must not block
