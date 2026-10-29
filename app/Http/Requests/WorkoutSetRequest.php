<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class WorkoutSetRequest extends FormRequest
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
            'reps' => ['nullable', 'integer', 'min:0', 'max:1000', 'required_without_all:duration_seconds,distance_m'],
            'weight_kg' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'duration_seconds' => ['nullable', 'integer', 'min:1', 'max:86400'],
            'distance_m' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'rpe' => ['nullable', 'integer', 'min:1', 'max:10'],
            'is_warmup' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'exercise_id' => 'ejercicio',
            'reps' => 'repeticiones',
            'weight_kg' => 'peso',
            'duration_seconds' => 'tiempo',
            'distance_m' => 'distancia',
            'rpe' => 'RPE',
        ];
    }
}
