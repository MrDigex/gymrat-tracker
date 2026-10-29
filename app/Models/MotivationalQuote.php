<?php

namespace App\Models;

use Database\Factories\MotivationalQuoteFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $text
 * @property string|null $author
 */
#[Fillable(['text', 'author'])]
class MotivationalQuote extends Model
{
    /** @use HasFactory<MotivationalQuoteFactory> */
    use HasFactory;

    /**
     * Quote of the day for a user: stable during the day, different between users.
     */
    public static function forDay(int $userId, ?int $offset = 0): ?self
    {
        $count = static::query()->count();

        if ($count === 0) {
            return null;
        }

        $index = (crc32(now()->toDateString().'|'.$userId) + $offset) % $count;

        return static::query()->orderBy('id')->skip($index)->first();
    }
}
