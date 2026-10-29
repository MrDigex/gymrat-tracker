<?php

namespace App\Models;

use App\Enums\ActivitySource;
use App\Enums\ActivityType;
use Database\Factories\ActivityFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property ActivityType $type
 * @property string $name
 * @property Carbon $started_at
 * @property int $distance_m
 * @property int $duration_seconds
 * @property int|null $moving_seconds
 * @property int|null $elevation_gain_m
 * @property int|null $avg_hr
 * @property int|null $max_hr
 * @property int|null $calories
 * @property ActivitySource $source
 * @property string|null $external_id
 * @property string|null $share_token
 * @property array<string, mixed>|null $raw
 * @property-read int|null $pace_seconds_per_km
 */
#[Fillable([
    'type', 'name', 'started_at', 'distance_m', 'duration_seconds', 'moving_seconds', 'elevation_gain_m',
    'avg_hr', 'max_hr', 'calories', 'source', 'external_id', 'raw',
])]
#[Hidden(['raw'])]
class Activity extends Model
{
    /** @use HasFactory<ActivityFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $appends = ['pace_seconds_per_km'];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<ActivitySplit, $this>
     */
    public function splits(): HasMany
    {
        return $this->hasMany(ActivitySplit::class)->orderBy('position');
    }

    public static function formatPace(?int $secondsPerKm): ?string
    {
        if ($secondsPerKm === null) {
            return null;
        }

        return sprintf('%d:%02d /km', intdiv($secondsPerKm, 60), $secondsPerKm % 60);
    }

    public static function formatDuration(int $seconds): string
    {
        $hours = intdiv($seconds, 3600);
        $minutes = intdiv($seconds % 3600, 60);

        return $hours > 0
            ? sprintf('%d:%02d:%02d', $hours, $minutes, $seconds % 60)
            : sprintf('%d:%02d', $minutes, $seconds % 60);
    }

    /**
     * @return Attribute<int|null, never>
     */
    protected function paceSecondsPerKm(): Attribute
    {
        return Attribute::get(function (): ?int {
            if ($this->distance_m <= 0) {
                return null;
            }

            return (int) round(($this->moving_seconds ?? $this->duration_seconds) / ($this->distance_m / 1000));
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => ActivityType::class,
            'source' => ActivitySource::class,
            'started_at' => 'datetime',
            'raw' => 'array',
        ];
    }
}
