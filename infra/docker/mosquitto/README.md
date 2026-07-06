# Mosquitto broker (local dev)

Local MQTT broker for FutureKawa, used by the IoT modules and the country backend.

## Run

```bash
cd infra/docker/mosquitto
docker compose up -d
```

The broker listens on **port 1883** (anonymous access — dev only).

## Watch the messages

Subscribe to everything to confirm the IoT module publishes:

```bash
docker exec -it futurekawa-mosquitto \
  mosquitto_sub -t "futurekawa/#" -v
```

You can also publish a test message by hand:

```bash
docker exec -it futurekawa-mosquitto \
  mosquitto_pub -t "futurekawa/brazil/wh-01/measurements" \
  -m '{"warehouse_id":"wh-01","country":"brazil","temperature":27.4,"humidity":58,"timestamp":1751808000}'
```

A GUI alternative is [MQTT Explorer](https://mqtt-explorer.com/) pointed at
`localhost:1883`.

## Stop

```bash
docker compose down          # keep data
docker compose down -v       # also remove the persisted volume
```

## Notes

- Anonymous access and no TLS are **development-only** choices. Production requires
  authentication (password file / ACL) and TLS on port 8883.
- The `mosquitto-data` volume persists retained messages and subscriptions.
