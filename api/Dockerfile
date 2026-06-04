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
COPY composer*.json ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy code
COPY . .

# Run composer autoloader and clean up permissions
RUN composer dump-autoload --no-dev --optimize \
    && chmod +x docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
