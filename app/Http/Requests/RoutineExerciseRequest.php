<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RoutineExerciseRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'exercise_id' => [$this->isMethod('post') ? 'required' : 'prohibited', 'integer', 'exists:exercises,id'],
            'target_sets' => ['nullable', 'integer', 'min:1', 'max:20'],
            'target_reps_min' => ['nullable', 'integer', 'min:1', 'max:200'],
            'target_reps_max' => ['nullable', 'integer', 'min:1', 'max:200', 'gte:target_reps_min'],
            'target_weight_kg' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'target_seconds' => ['nullable', 'integer', 'min:1', 'max:86400'],
            'target_distance_m' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'rest_seconds' => ['nullable', 'integer', 'min:0', 'max:1800'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'exercise_id' => 'ejercicio',
            'target_sets' => 'series',
            'target_reps_min' => 'repeticiones mínimas',
            'target_reps_max' => 'repeticiones máximas',
            'target_weight_kg' => 'peso',
            'target_seconds' => 'tiempo',
            'target_distance_m' => 'distancia',
            'rest_seconds' => 'descanso',
            'notes' => 'notas',
        ];
    }
}
