<?php

namespace App\Enums;

enum TrackingType: string
{
    case WeightReps = 'weight_reps';
    case Reps = 'reps';
    case Time = 'time';
    case DistanceTime = 'distance_time';

    public function label(): string
    {
        return match ($this) {
            self::WeightReps => 'Peso y repeticiones',
            self::Reps => 'Repeticiones',
            self::Time => 'Tiempo',
            self::DistanceTime => 'Distancia y tiempo',
        };
    }
}
