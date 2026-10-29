<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('name');
            $table->timestamp('started_at');
            $table->unsignedInteger('distance_m');
            $table->unsignedInteger('duration_seconds');
            $table->unsignedInteger('moving_seconds')->nullable();
            $table->unsignedInteger('elevation_gain_m')->nullable();
            $table->unsignedSmallInteger('avg_hr')->nullable();
            $table->unsignedSmallInteger('max_hr')->nullable();
            $table->unsignedInteger('calories')->nullable();
            $table->string('source')->default('manual');
            $table->string('external_id')->nullable();
            $table->string('share_token')->nullable()->unique();
            $table->json('raw')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'source', 'external_id']);
            $table->index(['user_id', 'started_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
