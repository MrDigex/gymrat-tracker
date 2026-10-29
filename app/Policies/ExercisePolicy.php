<?php

namespace App\Policies;

use App\Models\Exercise;
use App\Models\User;

class ExercisePolicy
{
    /**
     * Catalog exercises are visible to everyone; custom ones only to their creator.
     */
    public function view(User $user, Exercise $exercise): bool
    {
        return $exercise->user_id === null || $exercise->user_id === $user->id;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Exercise $exercise): bool
    {
        return $exercise->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Exercise $exercise): bool
    {
        return $exercise->user_id === $user->id;
    }
}
