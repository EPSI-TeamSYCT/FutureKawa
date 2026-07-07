import json
import random

from config import Settings
from worker import build_generators, publish_round


class FakePublisher:
    def __init__(self):
        self.calls = []

    def publish(self, topic, payload):
        self.calls.append((topic, payload))


def _settings(monkeypatch, devices):
    monkeypatch.setenv("COUNTRY", "brazil")
    monkeypatch.setenv("TEMP_THRESHOLD", "29")
    monkeypatch.setenv("HUMIDITY_THRESHOLD", "55")
    monkeypatch.setenv("DEVICES", devices)
    return Settings(_env_file=None)


def test_publish_round_one_message_per_device(monkeypatch):
    s = _settings(
        monkeypatch,
        '[{"warehouse":"wh-01","hardware_id":"ref1"},'
        '{"warehouse":"wh-02","hardware_id":"ref2"}]',
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
        '[{"warehouse":"wh-01","hardware_id":"ref1"},'
        '{"warehouse":"wh-01","hardware_id":"ref2"}]',
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
