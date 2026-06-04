FROM php:8.2-cli-alpine

# Install system dependencies & PHP extensions
RUN apk add --no-cache \
    unzip \
    libzip-dev \
    sqlite-dev \
    mysql-client \
    && docker-php-ext-install pdo_mysql zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy composer config & install dependencies
COPY composer.json composer.lock* ./
RUN composer config audit.block-insecure false \
    && composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy code
COPY . .

# Backup storage folder to bypass volume mount overlay
RUN cp -r storage storage_backup

# Run composer autoloader and clean up permissions
RUN composer dump-autoload --no-dev --optimize \
    && chmod +x docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
