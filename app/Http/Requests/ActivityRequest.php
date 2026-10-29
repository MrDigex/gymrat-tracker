<?php

namespace App\Http\Requests;

use App\Enums\ActivityType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ActivityRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(ActivityType::class)],
            'name' => ['required', 'string', 'max:120'],
            'started_at' => ['required', 'date', 'before_or_equal:now'],
            'distance_m' => ['required', 'integer', 'min:1', 'max:1000000'],
            'duration_seconds' => ['required', 'integer', 'min:1', 'max:604800'],
            'elevation_gain_m' => ['nullable', 'integer', 'min:0', 'max:20000'],
            'avg_hr' => ['nullable', 'integer', 'min:30', 'max:250'],
            'max_hr' => ['nullable', 'integer', 'min:30', 'max:250'],
            'calories' => ['nullable', 'integer', 'min:0', 'max:20000'],
            'splits' => ['nullable', 'array', 'max:200'],
            'splits.*.label' => ['required', 'string', 'max:60'],
            'splits.*.distance_m' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'splits.*.duration_seconds' => ['required', 'integer', 'min:1', 'max:604800'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'type' => 'tipo',
            'name' => 'nombre',
            'started_at' => 'fecha',
            'distance_m' => 'distancia',
            'duration_seconds' => 'tiempo',
            'elevation_gain_m' => 'desnivel',
            'avg_hr' => 'frecuencia cardiaca media',
            'max_hr' => 'frecuencia cardiaca máxima',
            'calories' => 'calorías',
            'splits.*.label' => 'parcial',
            'splits.*.duration_seconds' => 'tiempo del parcial',
        ];
    }
}
