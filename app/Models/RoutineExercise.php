<?php

namespace App\Models;

use Database\Factories\RoutineExerciseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $routine_id
 * @property int $exercise_id
 * @property int $position
 * @property int $target_sets
 * @property int|null $target_reps_min
 * @property int|null $target_reps_max
 * @property float|null $target_weight_kg
 * @property int|null $target_seconds
 * @property int|null $target_distance_m
 * @property int|null $rest_seconds
 * @property string|null $notes
 */
#[Fillable([
    'exercise_id', 'position', 'target_sets', 'target_reps_min', 'target_reps_max', 'target_weight_kg',
    'target_seconds', 'target_distance_m', 'rest_seconds', 'notes',
])]
class RoutineExercise extends Model
{
    /** @use HasFactory<RoutineExerciseFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Routine, $this>
     */
    public function routine(): BelongsTo
    {
        return $this->belongsTo(Routine::class);
    }

    /**
     * @return BelongsTo<Exercise, $this>
     */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'target_weight_kg' => 'float',
        ];
    }
}
