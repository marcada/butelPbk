#!/bin/sh
mkdir -p database
touch database/database.sqlite
chmod -R 777 database storage bootstrap/cache

# Restore seed assets to active storage volume if they exist in backup
if [ -d "storage_backup" ]; then
    echo "Restoring seed assets to active storage volume..."
    cp -rp storage_backup/* storage/
fi

rm -rf public/storage
php artisan storage:link
php artisan migrate:fresh --force
php artisan db:seed --force
php artisan serve --host=0.0.0.0 --port=8000
