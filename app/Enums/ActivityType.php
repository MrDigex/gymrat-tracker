<?php

namespace App\Enums;

enum ActivityType: string
{
    case Run = 'carrera';
    case TrailRun = 'trail';
    case Treadmill = 'cinta';
    case Hyrox = 'hyrox';
    case Other = 'otro';

    public function label(): string
    {
        return match ($this) {
            self::Run => 'Carrera',
            self::TrailRun => 'Trail',
            self::Treadmill => 'Cinta',
            self::Hyrox => 'Hyrox',
            self::Other => 'Otro',
        };
    }
}
