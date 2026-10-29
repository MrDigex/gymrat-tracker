<?php

namespace App\Models;

use Database\Factories\WorkoutSetFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $workout_session_id
 * @property int $exercise_id
 * @property int $set_number
 * @property int|null $reps
 * @property float|null $weight_kg
 * @property int|null $duration_seconds
 * @property int|null $distance_m
 * @property int|null $rpe
 * @property bool $is_warmup
 */
#[Fillable(['exercise_id', 'set_number', 'reps', 'weight_kg', 'duration_seconds', 'distance_m', 'rpe', 'is_warmup'])]
class WorkoutSet extends Model
{
    /** @use HasFactory<WorkoutSetFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<WorkoutSession, $this>
     */
    public function workoutSession(): BelongsTo
    {
        return $this->belongsTo(WorkoutSession::class);
    }

    /**
     * @return BelongsTo<Exercise, $this>
     */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }

    /**
     * Estimated one-rep max using the Epley formula.
     */
    public function estimatedOneRepMax(): ?float
    {
        if ($this->weight_kg === null || ! $this->reps) {
            return null;
        }

        return round($this->weight_kg * (1 + $this->reps / 30), 1);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'weight_kg' => 'float',
            'is_warmup' => 'boolean',
        ];
    }
}
