<?php

namespace App\Http\Requests;

use App\Enums\ExerciseCategory;
use App\Enums\TrackingType;
use App\Support\ExerciseTranslations;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExerciseRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'category' => ['required', Rule::enum(ExerciseCategory::class)],
            'tracking_type' => ['required', Rule::enum(TrackingType::class)],
            'equipment' => ['nullable', Rule::in(array_keys(ExerciseTranslations::EQUIPMENT))],
            'level' => ['nullable', Rule::in(array_keys(ExerciseTranslations::LEVELS))],
            'mechanic' => ['nullable', Rule::in(array_keys(ExerciseTranslations::MECHANICS))],
            'instructions' => ['nullable', 'array', 'max:20'],
            'instructions.*' => ['nullable', 'string', 'max:500'],
            'primary_muscles' => ['required', 'array', 'min:1'],
            'primary_muscles.*' => ['integer', 'exists:muscle_groups,id'],
            'secondary_muscles' => ['nullable', 'array'],
            'secondary_muscles.*' => ['integer', 'exists:muscle_groups,id'],
            'image' => ['nullable', 'image', 'max:4096'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'nombre',
            'category' => 'categoría',
            'tracking_type' => 'tipo de registro',
            'equipment' => 'equipamiento',
            'primary_muscles' => 'músculos principales',
            'secondary_muscles' => 'músculos secundarios',
            'image' => 'imagen',
        ];
    }
}
