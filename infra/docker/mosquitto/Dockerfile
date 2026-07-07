FROM eclipse-mosquitto:2

# Identifiants de test — à faire correspondre à MQTT_USER / MQTT_PASSWORD du worker
ARG MQTT_USER=futurekawa
ARG MQTT_PASSWORD=secret

COPY config/mosquitto.conf /mosquitto/config/mosquitto.conf

# Génère le fichier de mots de passe (hashé) au build
RUN mosquitto_passwd -b -c /mosquitto/config/passwd "$MQTT_USER" "$MQTT_PASSWORD" \
    && chown mosquitto:mosquitto /mosquitto/config/passwd \
    && chmod 0700 /mosquitto/config/passwd

EXPOSE 1883
