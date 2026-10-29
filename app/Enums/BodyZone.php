<?php

namespace App\Enums;

enum BodyZone: string
{
    case Upper = 'superior';
    case Lower = 'inferior';
    case Core = 'core';
    case FullBody = 'cuerpo_completo';

    /**
     * Zones offered as filters. Full body is left out: the catalog tags almost every exercise with a single main
     * muscle, so hardly any exercise is classified as full body.
     *
     * @return list<self>
     */
    public static function filterable(): array
    {
        return [self::Upper, self::Lower, self::Core];
    }

    public function label(): string
    {
        return match ($this) {
            self::Upper => 'Tren superior',
            self::Lower => 'Tren inferior',
            self::Core => 'Core',
            self::FullBody => 'Cuerpo completo',
        };
    }
}
