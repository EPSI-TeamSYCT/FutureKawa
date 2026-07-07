import time

import paho.mqtt.client as mqtt


class MqttPublisher:
    def __init__(self, host, port, qos, client_id, client=None):
        self.host = host
        self.port = port
        self.qos = qos
        self._client = client or mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=client_id)

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
        raise ConnectionError(f"Could not reach broker at {self.host}:{self.port}: {last_exc}")

    def publish(self, topic: str, payload: str) -> None:
        self._client.publish(topic, payload, qos=self.qos, retain=False)

    def disconnect(self) -> None:
        self._client.loop_stop()
        self._client.disconnect()
