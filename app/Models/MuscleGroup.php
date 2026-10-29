<?php

namespace App\Models;

use App\Enums\BodyZone;
use Database\Factories\MuscleGroupFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property BodyZone $body_zone
 * @property-read Pivot&object{is_primary: bool} $pivot
 */
#[Fillable(['name', 'slug', 'body_zone'])]
class MuscleGroup extends Model
{
    /** @use HasFactory<MuscleGroupFactory> */
    use HasFactory;

    /**
     * @return BelongsToMany<Exercise, $this>
     */
    public function exercises(): BelongsToMany
    {
        return $this->belongsToMany(Exercise::class)->withPivot('is_primary');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'body_zone' => BodyZone::class,
        ];
    }
}
