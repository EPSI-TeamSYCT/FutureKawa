import json

from models import Measurement, now_epoch


def test_to_json_matches_contract():
    m = Measurement("wh-01", "brazil", "DHT11", "ref43320", 27.4, 58.0, 1751808000)
    assert json.loads(m.to_json()) == {
        "warehouse_id": "wh-01",
        "country": "brazil",
        "model": "DHT11",
        "hardware_id": "ref43320",
        "temperature": 27.4,
        "humidity": 58.0,
        "timestamp": 1751808000,
    }


def test_now_epoch_is_int():
    assert isinstance(now_epoch(), int)
