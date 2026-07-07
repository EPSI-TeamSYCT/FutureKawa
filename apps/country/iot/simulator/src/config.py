from pydantic import BaseModel, ConfigDict, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Device(BaseModel):
    """One IoT device: a sensor in a warehouse. A warehouse may have several."""

    model_config = ConfigDict(protected_namespaces=())

    warehouse: str
    hardware_id: str
    model: str = "DHT11"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    mqtt_host: str = "localhost"
    mqtt_port: int = 1883
    mqtt_qos: int = 1

    country: str
    # JSON list of devices, e.g.
    # DEVICES='[{"warehouse":"wh-01","hardware_id":"ref43320","model":"DHT11"}]'
    devices: list[Device] = [Device(warehouse="wh-01", hardware_id="wh-01")]

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
