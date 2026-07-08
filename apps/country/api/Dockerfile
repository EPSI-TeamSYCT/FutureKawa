# syntax=docker/dockerfile:1
#
# FutureKawa — Country API (Symfony / API Platform) + MQTT ingestion worker.
#
# ONE image, TWO roles:
#   - country-api    : serves HTTP on :8000 (default command, FrankenPHP)
#   - ingest-worker  : runs `php bin/console app:mqtt:subscribe` (command override)
#
# TLS is terminated by Traefik in front, so FrankenPHP serves plain HTTP here.

FROM dunglas/frankenphp:1-php8.4

# PHP extensions:
#   pdo_pgsql : PostgreSQL driver (Doctrine)
#   intl      : required by Symfony
#   opcache   : bytecode cache (prod perf)
#   pcntl     : POSIX signals — the worker uses them for graceful shutdown
#   zip       : composer dist installs
RUN install-php-extensions pdo_pgsql intl opcache pcntl zip

# Composer (copied from the official image)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Production runtime by default.
# SERVER_NAME=:8000 makes FrankenPHP serve plain HTTP on 8000 with NO auto-TLS
# (Traefik handles HTTPS). Document root defaults to /app/public.
ENV APP_ENV=prod \
    APP_DEBUG=0 \
    SERVER_NAME=:8000

# 1) Dependencies first — cached as long as composer.{json,lock} don't change.
COPY composer.json composer.lock symfony.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# 2) Application source.
COPY . .

# 3) Finalise: authoritative autoloader + Symfony auto-scripts (cache warmup, assets),
#    then make the writable dirs owned by the web user.
RUN composer dump-autoload --no-dev --optimize --classmap-authoritative \
 && composer run-script auto-scripts --no-interaction \
 && mkdir -p var/cache var/log var/share \
 && chown -R www-data:www-data var

EXPOSE 8000

# Default command (inherited from the base image) starts FrankenPHP and serves
# the API. The worker service overrides this with `php bin/console app:mqtt:subscribe`.
