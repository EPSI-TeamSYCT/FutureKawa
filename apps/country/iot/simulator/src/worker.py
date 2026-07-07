import signal
import time

from generator import ReadingGenerator
from models import Measurement, now_epoch


def build_generators(settings, rng_factory):
    """One generator per device (each device is its own reading stream)."""
    return [
        (
            device,
            ReadingGenerator(
                settings.temp_threshold,
                settings.humidity_threshold,
                settings.temp_tolerance,
                settings.humidity_tolerance,
                settings.anomaly_probability,
                rng_factory(),
            ),
        )
        for device in settings.devices
    ]


def publish_round(settings, device_generators, publisher, now=now_epoch):
    for device, gen in device_generators:
        temp, hum = gen.next()
        measurement = Measurement(
            device.warehouse,
            settings.country,
            device.model,
            device.hardware_id,
            temp,
            hum,
            now(),
        )
        topic = f"futurekawa/{settings.country}/{device.warehouse}/measurements"
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
