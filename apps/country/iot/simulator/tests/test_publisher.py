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
