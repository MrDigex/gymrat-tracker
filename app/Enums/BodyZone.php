<?php

namespace App\Enums;

enum BodyZone: string
{
    case Upper = 'superior';
    case Lower = 'inferior';
    case Core = 'core';
    case FullBody = 'cuerpo_completo';

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
