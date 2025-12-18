<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('advertisements', function (Blueprint $table) {
            $table->id();
            $table->string('client_name');
            $table->string('title');
            $table->string('package_type'); // 'web_only', 'web_plus_billboard'
            $table->string('web_image_path')->nullable(); // 19:9
            $table->string('billboard_image_path')->nullable(); // 9:16
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('advertisements');
    }
};
