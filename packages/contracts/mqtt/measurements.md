# MQTT contract — measurements

Telemetry published by an IoT module and consumed by the country backend.

## Topic

```
futurekawa/<country>/<warehouse_id>/measurements
```

- `<country>` — one of `brazil`, `ecuador`, `colombia`
- `<warehouse_id>` — e.g. `wh-01`

Example: `futurekawa/brazil/wh-01/measurements`

## Direction

IoT module (**publisher**) → broker → country backend (**subscriber**).

## Publish parameters

| Parameter | Value |
|---|---|
| QoS | 1 (at least once) |
| Retain | false |
| Frequency | one message every 30 s |
| Broker port | 1883 |

## Payload

JSON object, validated by [`measurement.schema.json`](measurement.schema.json).

```json
{
  "warehouse_id": "wh-01",
  "country": "brazil",
  "temperature": 27.4,
  "humidity": 58.0,
  "timestamp": 1751808000
}
```

| Field | Type | Unit / notes |
|---|---|---|
| `warehouse_id` | string | Warehouse identifier |
| `country` | string | `brazil` \| `ecuador` \| `colombia` |
| `temperature` | number | °C |
| `humidity` | number | % relative humidity |
| `timestamp` | integer | UNIX epoch seconds, UTC (device clock via NTP; the backend may re-stamp on receipt) |

## Notes

- The device is **publish-only** in this iteration; it does not subscribe to any
  topic. Alert evaluation (threshold ± tolerance, batch age) lives in the backend.
- A future `futurekawa/<country>/<warehouse_id>/commands` topic (backend → device)
  is reserved for Phase 2 actuator control; it is intentionally out of scope here.
