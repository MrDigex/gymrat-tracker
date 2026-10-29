<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\StravaAccountFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property int $athlete_id
 * @property string $access_token
 * @property string $refresh_token
 * @property CarbonImmutable $expires_at
 * @property string|null $scopes
 */
#[Fillable(['athlete_id', 'access_token', 'refresh_token', 'expires_at', 'scopes'])]
#[Hidden(['access_token', 'refresh_token'])]
class StravaAccount extends Model
{
    /** @use HasFactory<StravaAccountFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tokenIsExpired(): bool
    {
        return $this->expires_at->subMinute()->isPast();
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'access_token' => 'encrypted',
            'refresh_token' => 'encrypted',
            'expires_at' => 'datetime',
        ];
    }
}
