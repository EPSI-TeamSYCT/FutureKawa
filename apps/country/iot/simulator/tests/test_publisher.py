import pytest

from publisher import MqttPublisher


class FakeClient:
    def __init__(self):
        self.published = []
        self.loop_started = False
        self.connected_to = None
        self.disconnected = False

    def connect(self, host, port, keepalive):
        self.connected_to = (host, port)

    def loop_start(self):
        self.loop_started = True

    def loop_stop(self):
        self.loop_started = False

    def disconnect(self):
        self.disconnected = True

    def publish(self, topic, payload, qos, retain):
        self.published.append((topic, payload, qos, retain))


class FailingClient:
    def connect(self, *args, **kwargs):
        raise OSError("no broker")

    def loop_start(self):  # pragma: no cover - never reached
        pass


def test_publish_uses_topic_qos_and_no_retain():
    fake = FakeClient()
    pub = MqttPublisher("localhost", 1883, qos=1, client_id="t", client=fake)
    pub.publish("futurekawa/brazil/wh-01/measurements", "{}")
    assert fake.published == [("futurekawa/brazil/wh-01/measurements", "{}", 1, False)]


def test_connect_starts_loop():
    fake = FakeClient()
    pub = MqttPublisher("localhost", 1883, qos=1, client_id="t", client=fake)
    pub.connect()
    assert fake.loop_started is True
    assert fake.connected_to == ("localhost", 1883)


def test_connect_raises_after_retries():
    pub = MqttPublisher("localhost", 1883, qos=1, client_id="t", client=FailingClient())
    with pytest.raises(ConnectionError):
        pub.connect(retries=2, delay=0)


def test_disconnect_stops_loop_and_disconnects():
    fake = FakeClient()
    pub = MqttPublisher("localhost", 1883, qos=1, client_id="t", client=fake)
    pub.connect()
    pub.disconnect()
    assert fake.loop_started is False
    assert fake.disconnected is True
