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
        Schema::table('strava_accounts', function (Blueprint $table) {
            $table->string('athlete_name')->nullable()->after('athlete_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('strava_accounts', function (Blueprint $table) {
            $table->dropColumn('athlete_name');
        });
    }
};
