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
        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('displays_per_showing')->default(50);
            $table->integer('duration')->default(20); // duration in seconds
            $table->integer('shows_per_day')->default(20);
            $table->decimal('price', 10, 2);
            $table->string('color')->default('#4f46e5'); // hex code for charts
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};
