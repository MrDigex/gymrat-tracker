<?php

namespace App\Policies;

use App\Models\Routine;
use App\Models\User;

class RoutinePolicy
{
    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Routine $model): bool
    {
        return $model->user_id === $user->id;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Routine $model): bool
    {
        return $model->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Routine $model): bool
    {
        return $model->user_id === $user->id;
    }
}
