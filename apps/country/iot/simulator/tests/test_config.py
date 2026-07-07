import pytest
from pydantic import ValidationError

from config import Settings


def _required(monkeypatch):
    monkeypatch.setenv("COUNTRY", "brazil")
    monkeypatch.setenv("TEMP_THRESHOLD", "29")
    monkeypatch.setenv("HUMIDITY_THRESHOLD", "55")


def test_loads_required_and_defaults(monkeypatch):
    _required(monkeypatch)
    s = Settings(_env_file=None)
    assert s.country == "brazil"
    assert s.temp_threshold == 29.0
    assert s.humidity_threshold == 55.0
    assert s.temp_tolerance == 3.0
    assert s.publish_interval == 30.0
    # one default device
    assert len(s.devices) == 1
    assert s.devices[0].warehouse == "wh-01"
    assert s.devices[0].model == "DHT11"


def test_missing_required_raises(monkeypatch):
    monkeypatch.delenv("COUNTRY", raising=False)
    monkeypatch.delenv("TEMP_THRESHOLD", raising=False)
    monkeypatch.delenv("HUMIDITY_THRESHOLD", raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_empty_country_rejected(monkeypatch):
    _required(monkeypatch)
    monkeypatch.setenv("COUNTRY", "   ")
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_devices_parsed_from_json(monkeypatch):
    _required(monkeypatch)
    monkeypatch.setenv(
        "DEVICES",
        '[{"warehouse":"wh-01","hardware_id":"ref43320","model":"DHT22"}]',
    )
    d = Settings(_env_file=None).devices[0]
    assert (d.warehouse, d.hardware_id, d.model) == ("wh-01", "ref43320", "DHT22")


def test_multiple_devices_same_warehouse(monkeypatch):
    _required(monkeypatch)
    monkeypatch.setenv(
        "DEVICES",
        '[{"warehouse":"wh-01","hardware_id":"ref1"},{"warehouse":"wh-01","hardware_id":"ref2"}]',
    )
    s = Settings(_env_file=None)
    assert [d.hardware_id for d in s.devices] == ["ref1", "ref2"]
    assert all(d.warehouse == "wh-01" for d in s.devices)
    assert all(d.model == "DHT11" for d in s.devices)  # default model
