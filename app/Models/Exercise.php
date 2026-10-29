<?php

namespace App\Models;

use App\Enums\BodyZone;
use App\Enums\ExerciseCategory;
use App\Enums\ExerciseSource;
use App\Enums\TrackingType;
use Database\Factories\ExerciseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int|null $user_id
 * @property string $name
 * @property string $slug
 * @property list<string>|null $instructions
 * @property ExerciseCategory $category
 * @property string|null $equipment
 * @property string|null $level
 * @property string|null $mechanic
 * @property TrackingType $tracking_type
 * @property string|null $image_path
 * @property string|null $image_alt_path
 * @property ExerciseSource $source
 * @property string|null $source_id
 * @property-read string|null $image_url
 * @property-read string|null $image_alt_url
 */
#[Fillable([
    'user_id', 'name', 'slug', 'instructions', 'category', 'equipment', 'level', 'mechanic',
    'tracking_type', 'image_path', 'image_alt_path', 'source', 'source_id',
])]
class Exercise extends Model
{
    /** @use HasFactory<ExerciseFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $appends = ['image_url', 'image_alt_url'];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsToMany<MuscleGroup, $this>
     */
    public function muscleGroups(): BelongsToMany
    {
        return $this->belongsToMany(MuscleGroup::class)->withPivot('is_primary');
    }

    /**
     * @return BelongsToMany<MuscleGroup, $this>
     */
    public function primaryMuscleGroups(): BelongsToMany
    {
        return $this->muscleGroups()->wherePivot('is_primary', true);
    }

    /**
     * @return HasMany<WorkoutSet, $this>
     */
    public function workoutSets(): HasMany
    {
        return $this->hasMany(WorkoutSet::class);
    }

    /**
     * Global catalog exercises plus the ones the given user created.
     */
    #[Scope]
    protected function visibleTo(Builder $query, User $user): void
    {
        $query->where(fn (Builder $query) => $query->whereNull('user_id')->orWhere('user_id', $user->id));
    }

    public function isCustom(): bool
    {
        return $this->user_id !== null;
    }

    /**
     * Body zone derived from the primary muscle groups; spanning several zones counts as full body.
     */
    public function bodyZone(): ?BodyZone
    {
        $zones = $this->primaryMuscleGroups->pluck('body_zone')->unique(fn (BodyZone $zone) => $zone->value);

        return match ($zones->count()) {
            0 => $this->category === ExerciseCategory::Hyrox ? BodyZone::FullBody : null,
            1 => $zones->first(),
            default => BodyZone::FullBody,
        };
    }

    /**
     * Whether the movement mainly loads the lower body, which allows bigger weight jumps.
     */
    public function isLowerBody(): bool
    {
        return $this->bodyZone() === BodyZone::Lower;
    }

    public static function uniqueSlug(string $name): string
    {
        return Str::slug($name).'-'.Str::lower(Str::random(5));
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function imageUrl(): Attribute
    {
        return Attribute::get(fn (): ?string => self::resolveImageUrl($this->image_path));
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function imageAltUrl(): Attribute
    {
        return Attribute::get(fn (): ?string => self::resolveImageUrl($this->image_alt_path));
    }

    private static function resolveImageUrl(?string $path): ?string
    {
        if ($path === null) {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://', '/'])) {
            return $path;
        }

        return Storage::disk('public')->url($path);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'instructions' => 'array',
            'category' => ExerciseCategory::class,
            'tracking_type' => TrackingType::class,
            'source' => ExerciseSource::class,
        ];
    }
}
