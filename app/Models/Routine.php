<?php

namespace App\Models;

use Database\Factories\RoutineFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string|null $description
 * @property string|null $share_token
 * @property bool $is_public
 * @property-read int|null $routine_exercises_count
 * @property-read string|null $workout_sessions_max_started_at
 */
#[Fillable(['name', 'description'])]
class Routine extends Model
{
    /** @use HasFactory<RoutineFactory> */
    use HasFactory;

    private const int SECONDS_PER_SET = 45;

    private const int DEFAULT_REST_SECONDS = 90;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<RoutineExercise, $this>
     */
    public function routineExercises(): HasMany
    {
        return $this->hasMany(RoutineExercise::class)->orderBy('position');
    }

    /**
     * @return HasMany<WorkoutSession, $this>
     */
    public function workoutSessions(): HasMany
    {
        return $this->hasMany(WorkoutSession::class);
    }

    /**
     * Rough session length: about 45 s of work plus the planned rest per set, rounded to 5 minutes.
     */
    public function estimatedMinutes(): int
    {
        $seconds = $this->routineExercises->sum(
            fn (RoutineExercise $item) => $item->target_sets * (self::SECONDS_PER_SET + ($item->rest_seconds ?? self::DEFAULT_REST_SECONDS))
        );

        return $seconds > 0 ? max(5, (int) (round($seconds / 60 / 5) * 5)) : 0;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
        ];
    }
}
