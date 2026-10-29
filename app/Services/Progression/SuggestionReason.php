<?php

namespace App\Services\Progression;

enum SuggestionReason: string
{
    case FirstTime = 'first_time';
    case IncreaseWeight = 'increase_weight';
    case IncreaseReps = 'increase_reps';
    case AddLoad = 'add_load';
    case IncreaseTime = 'increase_time';
    case DecreaseTime = 'decrease_time';
    case Deload = 'deload';

    public function label(): string
    {
        return match ($this) {
            self::FirstTime => 'Primera vez',
            self::IncreaseWeight => 'Sube el peso',
            self::IncreaseReps => 'Suma repeticiones',
            self::AddLoad => 'Añade lastre',
            self::IncreaseTime => 'Aguanta más',
            self::DecreaseTime => 'Más rápido',
            self::Deload => 'Descarga',
        };
    }
}
