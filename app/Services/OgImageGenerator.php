<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Format;
use Intervention\Image\Geometry\Factories\EllipseFactory;
use Intervention\Image\Geometry\Factories\PolygonFactory;
use Intervention\Image\Geometry\Factories\RectangleFactory;
use Intervention\Image\ImageManager;
use Intervention\Image\Interfaces\ImageInterface;
use Intervention\Image\Typography\FontFactory;

/**
 * Renders 1200×630 Open Graph cards ("Tiza y Hierro") for shared routines,
 * workouts and races: kicker, huge title, up to three stats, the mascot,
 * the wordmark, a call-to-action pill and the hazard tape.
 */
class OgImageGenerator
{
    public const int WIDTH = 1200;

    public const int HEIGHT = 630;

    private const string BACKGROUND = '#18181b';

    private const string ACCENT = '#facc15';

    private const string TEXT = '#fafafa';

    private const string MUTED = '#a1a1aa';

    private const string SOFT = '#d4d4d8';

    private const int LEFT = 64;

    private const int TEXT_WIDTH = 640;

    /**
     * Render (or reuse the cached) PNG and return its binary contents.
     *
     * Stats are taken from `$stats` when given; otherwise "Label: value"
     * lines become stats, and exercise lists become Ejercicios / Series.
     *
     * @param  list<string>  $lines
     * @param  array<string, string>  $stats  label => value
     */
    public function render(string $cacheKey, string $badge, string $title, array $lines, ?string $footer = null, array $stats = []): string
    {
        $disk = Storage::disk('local');
        $path = 'og/'.Str::slug($cacheKey).'-'.md5('v3'.$badge.$title.implode('|', $lines).$footer.json_encode($stats)).'.png';

        if ($disk->exists($path)) {
            return $disk->get($path);
        }

        $display = resource_path('fonts/ArchivoBlack-Regular.ttf');
        $body = resource_path('fonts/Archivo-Variable.ttf');
        $image = ImageManager::usingDriver(Driver::class)->createImage(self::WIDTH, self::HEIGHT)->fill(self::BACKGROUND);

        $image->insert(
            ImageManager::usingDriver(Driver::class)->decodePath(public_path('images/mascot-ink.png'))->scale(420, 400),
            self::WIDTH - 60 - 420,
            70,
        );

        $kicker = $this->kicker($badge, $footer);
        $kickerSize = $this->textWidth($kicker, $body, 30) > self::TEXT_WIDTH ? 25 : 30;
        $image->text($kicker, self::LEFT, 126, fn (FontFactory $f) => $f->filename($body)->size($kickerSize)->color(self::SOFT)->align('left', 'top'));

        [$titleSize, $titleLines] = $this->fitTitle(Str::upper(Str::limit($title, 40, '…')), $display);
        $y = 176;

        foreach ($titleLines as $line) {
            $image->text($line, self::LEFT - 4, $y, fn (FontFactory $f) => $f->filename($display)->size($titleSize)->color(self::TEXT)->align('left', 'top'));
            $y += (int) round($titleSize * 0.98);
        }

        $this->drawStats($image, $stats ?: $this->deriveStats($lines), max($y + 34, 330), $display, $body);

        $image->text('Gym', self::LEFT, 540, fn (FontFactory $f) => $f->filename($display)->size(40)->color(self::TEXT)->align('left', 'top'));
        $image->text('Rat', self::LEFT + $this->textWidth('Gym', $display, 40) + 2, 540, fn (FontFactory $f) => $f->filename($display)->size(40)->color(self::ACCENT)->align('left', 'top'));

        $this->drawPill($image, Str::lower($badge) === 'rutina' ? 'Cópiala gratis' : 'Empieza gratis', $display);
        $this->drawHazard($image);

        $png = (string) $image->encodeUsingFormat(Format::PNG);
        $disk->put($path, $png);

        return $png;
    }

    /**
     * "Rutina de Demo GymRat", "Carrera de Demo GymRat · 24 oct 2026".
     */
    private function kicker(string $badge, ?string $footer): string
    {
        $parts = collect(explode(' · ', (string) $footer))
            ->map(fn (string $part) => trim($part))
            ->filter(fn (string $part) => $part !== '' && $part !== config('app.name'))
            ->values();

        if ($parts->isEmpty()) {
            return Str::limit($badge, 50);
        }

        return Str::limit($badge.' de '.$parts->implode(' · '), 50);
    }

    /**
     * Largest title size that fits; long titles wrap onto two lines.
     *
     * @return array{0: int, 1: list<string>}
     */
    private function fitTitle(string $title, string $font): array
    {
        foreach ([128, 112, 96, 84, 72] as $size) {
            if ($this->textWidth($title, $font, $size) <= self::TEXT_WIDTH) {
                return [$size, [$title]];
            }
        }

        $size = 64;
        $lines = [''];

        foreach (explode(' ', $title) as $word) {
            $current = array_key_last($lines);
            $candidate = trim($lines[$current].' '.$word);

            if ($lines[$current] !== '' && $this->textWidth($candidate, $font, $size) > self::TEXT_WIDTH) {
                $lines[] = $word;
            } else {
                $lines[$current] = $candidate;
            }
        }

        $lines = array_slice($lines, 0, 2);

        return [$size, array_map(fn (string $line) => Str::limit($line, 22, '…'), $lines)];
    }

    /**
     * @param  list<string>  $lines
     * @return array<string, string>
     */
    private function deriveStats(array $lines): array
    {
        $stats = [];

        foreach ($lines as $line) {
            if (preg_match('/^([^:·]{1,20}):\s*(.+)$/u', $line, $match)) {
                $stats[trim($match[1])] = trim($match[2]);
            }
        }

        if ($stats !== []) {
            return $stats;
        }

        $sets = 0;

        foreach ($lines as $line) {
            if (preg_match('/(\d+)\s*(?:×|series)/u', $line, $match)) {
                $sets += (int) $match[1];
            }
        }

        return array_filter([
            'Ejercicios' => count($lines) > 0 ? (string) count($lines) : null,
            'Series' => $sets > 0 ? (string) $sets : null,
        ]);
    }

    /**
     * @param  array<string, string>  $stats
     */
    private function drawStats(ImageInterface $image, array $stats, int $y, string $display, string $body): void
    {
        $x = self::LEFT;
        $index = 0;

        foreach (array_slice($stats, 0, 3, true) as $label => $value) {
            $value = Str::limit($value, 12, '');
            $size = mb_strlen($value) > 5 ? 44 : 56;
            $width = max($this->textWidth($value, $display, $size), $this->textWidth($label, $body, 26));

            if ($index > 0 && $x + $width > self::LEFT + self::TEXT_WIDTH) {
                break;
            }

            $image->text($label, $x, $y, fn (FontFactory $f) => $f->filename($body)->size(26)->color(self::MUTED)->align('left', 'top'));
            $image->text($value, $x, $y + 40, fn (FontFactory $f) => $f->filename($display)->size($size)->color($index === 0 ? self::ACCENT : self::TEXT)->align('left', 'top'));

            $x += $width + 44;
            $index++;
        }
    }

    private function drawPill(ImageInterface $image, string $label, string $font): void
    {
        $height = 50;
        $width = $this->textWidth($label, $font, 24) + 48;
        $x = self::WIDTH - 64 - $width;
        $y = 530;
        $radius = 12;

        $image->drawRectangle(fn (RectangleFactory $r) => $r->size($width - 2 * $radius, $height)->at($x + $radius, $y)->background(self::ACCENT));
        $image->drawRectangle(fn (RectangleFactory $r) => $r->size($width, $height - 2 * $radius)->at($x, $y + $radius)->background(self::ACCENT));

        foreach ([[$x + $radius, $y + $radius], [$x + $width - $radius, $y + $radius], [$x + $radius, $y + $height - $radius], [$x + $width - $radius, $y + $height - $radius]] as [$cx, $cy]) {
            $image->drawEllipse(fn (EllipseFactory $e) => $e->size(2 * $radius, 2 * $radius)->at($cx, $cy)->background(self::ACCENT));
        }

        $image->text($label, $x + 24, $y + 13, fn (FontFactory $f) => $f->filename($font)->size(24)->color(self::BACKGROUND)->align('left', 'top'));
    }

    /**
     * Yellow/black diagonal tape along the bottom edge.
     */
    private function drawHazard(ImageInterface $image): void
    {
        $top = self::HEIGHT - 20;
        $image->drawRectangle(fn (RectangleFactory $r) => $r->size(self::WIDTH, 20)->at(0, $top)->background(self::BACKGROUND));

        for ($x = -40; $x < self::WIDTH + 40; $x += 40) {
            $image->drawPolygon(fn (PolygonFactory $p) => $p
                ->point($x + 20, $top)
                ->point($x + 40, $top)
                ->point($x + 20, self::HEIGHT)
                ->point($x, self::HEIGHT)
                ->background(self::ACCENT));
        }
    }

    private function textWidth(string $text, string $font, int $size): int
    {
        $box = imagettfbbox($size * .76, 0, $font, $text);

        return $box === false ? 0 : (int) abs($box[2] - $box[0]);
    }
}
