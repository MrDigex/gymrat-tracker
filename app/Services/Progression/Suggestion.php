<?php

namespace App\Services\Progression;

use Illuminate\Contracts\Support\Arrayable;

/**
 * Next-session target for an exercise, computed from the user's history.
 *
 * @implements Arrayable<string, mixed>
 */
final readonly class Suggestion implements Arrayable
{
    public function __construct(
        public SuggestionReason $reason,
        public string $message,
        public int $sets = 3,
        public ?int $reps = null,
        public ?int $repsMin = null,
        public ?int $repsMax = null,
        public ?float $weightKg = null,
        public ?int $durationSeconds = null,
        public ?int $distanceM = null,
        public ?string $lastPerformance = null,
        public ?string $lastPerformedAt = null,
    ) {}

    public function hasHistory(): bool
    {
        return $this->reason !== SuggestionReason::FirstTime;
    }

    /**
     * @return array{reason: string, reason_label: string, message: string, has_history: bool, sets: int, reps: int|null, reps_min: int|null, reps_max: int|null, weight_kg: float|null, duration_seconds: int|null, distance_m: int|null, last_performance: string|null, last_performed_at: string|null}
     */
    public function toArray(): array
    {
        return [
            'reason' => $this->reason->value,
            'reason_label' => $this->reason->label(),
            'message' => $this->message,
            'has_history' => $this->hasHistory(),
            'sets' => $this->sets,
            'reps' => $this->reps,
            'reps_min' => $this->repsMin,
            'reps_max' => $this->repsMax,
            'weight_kg' => $this->weightKg,
            'duration_seconds' => $this->durationSeconds,
            'distance_m' => $this->distanceM,
            'last_performance' => $this->lastPerformance,
            'last_performed_at' => $this->lastPerformedAt,
        ];
    }
}
