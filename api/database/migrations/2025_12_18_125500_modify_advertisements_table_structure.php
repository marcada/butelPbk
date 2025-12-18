<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('advertisements', function (Blueprint $table) {
            // Drop old columns
            $table->dropColumn(['package_type', 'web_image_path']);

            // Add new flags
            $table->boolean('type_carousel')->default(false);
            $table->boolean('type_sidebar')->default(false);
            $table->boolean('type_billboard')->default(false);

            // Add specific image paths
            $table->string('carousel_image_path')->nullable(); // For top carousel
            $table->string('sidebar_image_path')->nullable();  // For right sidebar (formerly web_image_path)
        });
    }

    public function down()
    {
        Schema::table('advertisements', function (Blueprint $table) {
            $table->string('package_type')->default('web_only');
            $table->string('web_image_path')->nullable();

            $table->dropColumn([
                'type_carousel',
                'type_sidebar',
                'type_billboard',
                'carousel_image_path',
                'sidebar_image_path'
            ]);
        });
    }
};
