<?php

namespace App\Models;

use Database\Factories\ActivitySplitFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $activity_id
 * @property int $position
 * @property string $label
 * @property int|null $distance_m
 * @property int $duration_seconds
 */
#[Fillable(['position', 'label', 'distance_m', 'duration_seconds'])]
class ActivitySplit extends Model
{
    /** @use HasFactory<ActivitySplitFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Activity, $this>
     */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }
}
