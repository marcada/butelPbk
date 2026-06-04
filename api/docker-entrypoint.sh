#!/bin/sh
mkdir -p database
touch database/database.sqlite
chmod -R 777 database storage bootstrap/cache
php artisan migrate --force
php artisan db:seed --force
php artisan serve --host=0.0.0.0 --port=8000
