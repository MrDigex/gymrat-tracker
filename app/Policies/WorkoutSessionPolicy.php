<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkoutSession;

class WorkoutSessionPolicy
{
    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, WorkoutSession $model): bool
    {
        return $model->user_id === $user->id;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, WorkoutSession $model): bool
    {
        return $model->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, WorkoutSession $model): bool
    {
        return $model->user_id === $user->id;
    }
}
