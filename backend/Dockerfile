FROM dunglas/frankenphp:php8.3-alpine

# Instalar Composer binario oficial
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Instalar extensiones PHP necesarias para Laravel, PostgreSQL, Redis y Filament
RUN install-php-extensions pdo_pgsql pgsql redis bcmath intl zip gd pcntl

WORKDIR /app

# Copiar el código fuente completo del backend
COPY . .

# Instalar dependencias de producción y sincronizar autoloader
RUN composer update --no-dev --no-interaction --prefer-dist --optimize-autoloader

# Permisos para storage y bootstrap cache
RUN mkdir -p /app/storage/framework/cache /app/storage/framework/sessions /app/storage/framework/views /app/bootstrap/cache \
    && chown -R www-data:www-data /app/storage /app/bootstrap/cache \
    && chmod -R 775 /app/storage /app/bootstrap/cache

ENV SERVER_NAME=":80"
