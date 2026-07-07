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
    assert s.warehouse_ids == ["wh-01"]


def test_missing_required_raises(monkeypatch):
    monkeypatch.delenv("COUNTRY", raising=False)
    monkeypatch.delenv("TEMP_THRESHOLD", raising=False)
    monkeypatch.delenv("HUMIDITY_THRESHOLD", raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_warehouses_csv_parsing(monkeypatch):
    _required(monkeypatch)
    monkeypatch.setenv("WAREHOUSES", "wh-01, wh-02 ,wh-03")
    s = Settings(_env_file=None)
    assert s.warehouse_ids == ["wh-01", "wh-02", "wh-03"]


def test_empty_country_rejected(monkeypatch):
    _required(monkeypatch)
    monkeypatch.setenv("COUNTRY", "   ")
    with pytest.raises(ValidationError):
        Settings(_env_file=None)
