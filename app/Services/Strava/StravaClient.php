<?php

namespace App\Services\Strava;

use App\Models\StravaAccount;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;

/**
 * Thin wrapper over the Strava v3 API (OAuth + activities).
 */
class StravaClient
{
    public const string BASE_URL = 'https://www.strava.com';

    public function isConfigured(): bool
    {
        return filled(config('services.strava.client_id')) && filled(config('services.strava.client_secret'));
    }

    public function authorizeUrl(string $redirectUri, string $state): string
    {
        return self::BASE_URL.'/oauth/authorize?'.http_build_query([
            'client_id' => config('services.strava.client_id'),
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'approval_prompt' => 'auto',
            'scope' => 'read,activity:read_all',
            'state' => $state,
        ]);
    }

    /**
     * Exchange an authorization code for tokens and the athlete profile.
     *
     * @return array{access_token: string, refresh_token: string, expires_at: int, athlete: array{id: int}}
     *
     * @throws RequestException
     */
    public function exchangeCode(string $code): array
    {
        return Http::asForm()->post(self::BASE_URL.'/oauth/token', [
            'client_id' => config('services.strava.client_id'),
            'client_secret' => config('services.strava.client_secret'),
            'code' => $code,
            'grant_type' => 'authorization_code',
        ])->throw()->json();
    }

    /**
     * @return array<string, mixed>
     *
     * @throws RequestException
     */
    public function activity(StravaAccount $account, int|string $activityId): array
    {
        return $this->request($account)->get('/api/v3/activities/'.$activityId)->throw()->json();
    }

    /**
     * @return list<array<string, mixed>>
     *
     * @throws RequestException
     */
    public function activitiesSince(StravaAccount $account, int $afterTimestamp, int $perPage = 100): array
    {
        return $this->request($account)->get('/api/v3/athlete/activities', [
            'after' => $afterTimestamp,
            'per_page' => $perPage,
        ])->throw()->json();
    }

    public function deauthorize(StravaAccount $account): void
    {
        $this->request($account)->post('/oauth/deauthorize');
    }

    private function request(StravaAccount $account): PendingRequest
    {
        if ($account->tokenIsExpired()) {
            $this->refresh($account);
        }

        return Http::baseUrl(self::BASE_URL)->withToken($account->access_token)->acceptJson()->timeout(20);
    }

    /**
     * @throws RequestException
     */
    private function refresh(StravaAccount $account): void
    {
        $tokens = Http::asForm()->post(self::BASE_URL.'/oauth/token', [
            'client_id' => config('services.strava.client_id'),
            'client_secret' => config('services.strava.client_secret'),
            'grant_type' => 'refresh_token',
            'refresh_token' => $account->refresh_token,
        ])->throw()->json();

        $account->update([
            'access_token' => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
            'expires_at' => now()->setTimestamp($tokens['expires_at']),
        ]);
    }
}
