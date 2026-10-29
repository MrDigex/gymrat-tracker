<?php

namespace App\Enums;

enum ExerciseSource: string
{
    case FreeExerciseDb = 'free-exercise-db';
    case Hyrox = 'hyrox';
    case User = 'user';
}
