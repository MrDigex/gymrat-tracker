<?php

namespace App\Jobs;

use App\Actions\SaveActivity;
use App\Models\StravaAccount;
use App\Services\Strava\StravaActivityMapper;
use App\Services\Strava\StravaClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ImportStravaActivity implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(public StravaAccount $account, public int $stravaActivityId) {}

    /**
     * Execute the job.
     */
    public function handle(StravaClient $strava, StravaActivityMapper $mapper, SaveActivity $saveActivity): void
    {
        $payload = $strava->activity($this->account, $this->stravaActivityId);

        if (! $mapper->isRun($payload)) {
            return;
        }

        $saveActivity->handle($this->account->user, $mapper->attributes($payload), $mapper->splits($payload));
    }
}
