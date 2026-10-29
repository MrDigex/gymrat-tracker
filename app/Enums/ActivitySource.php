<?php

namespace App\Enums;

enum ActivitySource: string
{
    case Manual = 'manual';
    case Strava = 'strava';
    case Shortcut = 'shortcut';

    public function label(): string
    {
        return match ($this) {
            self::Manual => 'Manual',
            self::Strava => 'Strava',
            self::Shortcut => 'Atajo de iOS',
        };
    }
}
