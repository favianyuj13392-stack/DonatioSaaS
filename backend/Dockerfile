FROM dunglas/frankenphp:php8.3-alpine

# Instalar Composer binario oficial directamente
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Instalar solo extensiones requeridas para base de datos y redis
RUN install-php-extensions pdo_pgsql pgsql redis bcmath

WORKDIR /app
