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
