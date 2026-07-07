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
