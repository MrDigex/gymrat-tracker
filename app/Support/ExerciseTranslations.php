<?php

namespace App\Support;

use App\Enums\BodyZone;
use App\Enums\ExerciseCategory;
use App\Enums\TrackingType;

/**
 * Spanish labels for the vocabulary used by free-exercise-db and the exercise forms.
 */
class ExerciseTranslations
{
    /**
     * @var array<string, array{name: string, zone: BodyZone}>
     */
    public const array MUSCLES = [
        'chest' => ['name' => 'Pecho', 'zone' => BodyZone::Upper],
        'shoulders' => ['name' => 'Hombros', 'zone' => BodyZone::Upper],
        'biceps' => ['name' => 'Bíceps', 'zone' => BodyZone::Upper],
        'triceps' => ['name' => 'Tríceps', 'zone' => BodyZone::Upper],
        'forearms' => ['name' => 'Antebrazos', 'zone' => BodyZone::Upper],
        'lats' => ['name' => 'Dorsales', 'zone' => BodyZone::Upper],
        'middle back' => ['name' => 'Espalda media', 'zone' => BodyZone::Upper],
        'traps' => ['name' => 'Trapecios', 'zone' => BodyZone::Upper],
        'neck' => ['name' => 'Cuello', 'zone' => BodyZone::Upper],
        'abdominals' => ['name' => 'Abdominales', 'zone' => BodyZone::Core],
        'lower back' => ['name' => 'Zona lumbar', 'zone' => BodyZone::Core],
        'quadriceps' => ['name' => 'Cuádriceps', 'zone' => BodyZone::Lower],
        'hamstrings' => ['name' => 'Isquiotibiales', 'zone' => BodyZone::Lower],
        'glutes' => ['name' => 'Glúteos', 'zone' => BodyZone::Lower],
        'calves' => ['name' => 'Gemelos', 'zone' => BodyZone::Lower],
        'adductors' => ['name' => 'Aductores', 'zone' => BodyZone::Lower],
        'abductors' => ['name' => 'Abductores', 'zone' => BodyZone::Lower],
    ];

    /**
     * @var array<string, string>
     */
    public const array EQUIPMENT = [
        'body only' => 'Peso corporal',
        'barbell' => 'Barra',
        'dumbbell' => 'Mancuernas',
        'kettlebells' => 'Kettlebell',
        'cable' => 'Polea',
        'machine' => 'Máquina',
        'bands' => 'Bandas elásticas',
        'medicine ball' => 'Balón medicinal',
        'exercise ball' => 'Fitball',
        'e-z curl bar' => 'Barra Z',
        'foam roll' => 'Rodillo de espuma',
        'sled' => 'Trineo',
        'sandbag' => 'Saco de arena',
        'ski erg' => 'SkiErg',
        'rower' => 'Remoergómetro',
        'wall ball' => 'Wall ball',
        'other' => 'Otro',
    ];

    /**
     * @var array<string, string>
     */
    public const array LEVELS = [
        'beginner' => 'Principiante',
        'intermediate' => 'Intermedio',
        'expert' => 'Avanzado',
    ];

    /**
     * @var array<string, string>
     */
    public const array MECHANICS = [
        'compound' => 'Multiarticular',
        'isolation' => 'Aislamiento',
    ];

    public static function category(string $category): ExerciseCategory
    {
        return match ($category) {
            'cardio' => ExerciseCategory::Cardio,
            'stretching' => ExerciseCategory::Stretching,
            'plyometrics' => ExerciseCategory::Plyometrics,
            'powerlifting' => ExerciseCategory::Powerlifting,
            'olympic weightlifting' => ExerciseCategory::OlympicWeightlifting,
            'strongman' => ExerciseCategory::Strongman,
            default => ExerciseCategory::Strength,
        };
    }

    /**
     * Infer how an imported exercise should be logged from its source metadata.
     */
    public static function trackingType(ExerciseCategory $category, ?string $equipment, ?string $force): TrackingType
    {
        if (in_array($category, [ExerciseCategory::Cardio, ExerciseCategory::Stretching], true) || $force === 'static') {
            return TrackingType::Time;
        }

        if (in_array($equipment, [null, 'body only', 'exercise ball', 'foam roll', 'bands'], true)) {
            return TrackingType::Reps;
        }

        return TrackingType::WeightReps;
    }
}
