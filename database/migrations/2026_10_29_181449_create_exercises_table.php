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
        Schema::create('exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->json('instructions')->nullable();
            $table->string('category');
            $table->string('equipment')->nullable();
            $table->string('level')->nullable();
            $table->string('mechanic')->nullable();
            $table->string('tracking_type');
            $table->string('image_path')->nullable();
            $table->string('image_alt_path')->nullable();
            $table->string('source');
            $table->string('source_id')->nullable();
            $table->timestamps();

            $table->unique(['source', 'source_id']);
            $table->index(['user_id', 'name']);
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exercises');
    }
};
