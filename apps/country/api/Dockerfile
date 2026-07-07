# FutureKawa country API — Symfony / API Platform on FrankenPHP.
# The SAME image runs the REST API (default) and the MQTT ingest worker
# (override the command with: php bin/console app:mqtt:subscribe).
FROM dunglas/frankenphp:1-php8.4-alpine

# PHP extensions needed by Doctrine/Postgres + Symfony.
RUN install-php-extensions pdo_pgsql intl opcache zip

# Composer from the official image.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
ENV APP_ENV=prod \
    APP_DEBUG=0 \
    SERVER_NAME=:8000

# Install PHP dependencies first for better layer caching.
COPY composer.json composer.lock symfony.lock ./
RUN composer install --no-dev --no-scripts --no-progress --prefer-dist \
    --no-interaction --ignore-platform-reqs

# Application code, then finalize the autoloader.
COPY . .
RUN composer dump-autoload --no-dev --optimize --classmap-authoritative

# FrankenPHP serves public/ on :8000 (SERVER_NAME above).
EXPOSE 8000
