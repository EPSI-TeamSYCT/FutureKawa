import json
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class Measurement:
    warehouse_id: str
    country: str
    temperature: float
    humidity: float
    timestamp: int

    def to_json(self) -> str:
        return json.dumps(
            {
                "warehouse_id": self.warehouse_id,
                "country": self.country,
                "temperature": self.temperature,
                "humidity": self.humidity,
                "timestamp": self.timestamp,
            }
        )


def now_epoch() -> int:
    return int(datetime.now(timezone.utc).timestamp())
