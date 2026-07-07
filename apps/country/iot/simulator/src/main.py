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
    devices = [f"{d.warehouse}/{d.hardware_id}" for d in settings.devices]
    print(
        f"IoT simulator | {settings.country} | devices={devices} "
        f"| broker={settings.mqtt_host}:{settings.mqtt_port} "
        f"| every {settings.publish_interval}s"
    )
    Worker(settings, generators, publisher).run()


if __name__ == "__main__":
    main()
