<?php

namespace App\Enums;

enum ExerciseCategory: string
{
    case Strength = 'fuerza';
    case Cardio = 'cardio';
    case Hyrox = 'hyrox';
    case Stretching = 'estiramiento';
    case Plyometrics = 'pliometria';
    case Powerlifting = 'powerlifting';
    case OlympicWeightlifting = 'halterofilia';
    case Strongman = 'strongman';

    public function label(): string
    {
        return match ($this) {
            self::Strength => 'Fuerza',
            self::Cardio => 'Cardio',
            self::Hyrox => 'Hyrox',
            self::Stretching => 'Estiramiento',
            self::Plyometrics => 'Pliometría',
            self::Powerlifting => 'Powerlifting',
            self::OlympicWeightlifting => 'Halterofilia',
            self::Strongman => 'Strongman',
        };
    }
}
