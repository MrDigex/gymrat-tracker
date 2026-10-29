<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Format;
use Intervention\Image\Geometry\Factories\RectangleFactory;
use Intervention\Image\ImageManager;
use Intervention\Image\Typography\FontFactory;

/**
 * Renders 1200×630 Open Graph cards for shared routines, workouts and races.
 */
class OgImageGenerator
{
    public const int WIDTH = 1200;

    public const int HEIGHT = 630;

    private const string BACKGROUND = '#18181b';

    private const string ACCENT = '#facc15';

    private const string TEXT = '#fafafa';

    private const string MUTED = '#a1a1aa';

    /**
     * Render (or reuse the cached) PNG and return its binary contents.
     *
     * @param  list<string>  $lines
     */
    public function render(string $cacheKey, string $badge, string $title, array $lines, ?string $footer = null): string
    {
        $disk = Storage::disk('local');
        $path = 'og/'.Str::slug($cacheKey).'-'.md5($badge.$title.implode('|', $lines).$footer).'.png';

        if ($disk->exists($path)) {
            return $disk->get($path);
        }

        $font = resource_path('fonts/ArchivoBlack-Regular.ttf');
        $image = ImageManager::usingDriver(Driver::class)->createImage(self::WIDTH, self::HEIGHT)->fill(self::BACKGROUND);

        $image->drawRectangle(fn (RectangleFactory $rectangle) => $rectangle->size(self::WIDTH, 14)->at(0, 0)->background(self::ACCENT));
        $image->drawRectangle(fn (RectangleFactory $rectangle) => $rectangle->size(24 + mb_strlen($badge) * 17, 50)->at(70, 70)->background(self::ACCENT));
        $image->text(Str::upper($badge), 82, 106, fn (FontFactory $f) => $f->filename($font)->size(26)->color(self::BACKGROUND));

        $image->text(Str::limit($title, 60), 70, 200, fn (FontFactory $f) => $f->filename($font)->size(64)->color(self::TEXT)->wrap(1060)->lineHeight(1.5)->align('left', 'top'));

        $y = mb_strlen($title) > 28 ? 380 : 320;

        foreach (array_slice($lines, 0, 5) as $line) {
            $image->text('• '.Str::limit($line, 58), 70, $y, fn (FontFactory $f) => $f->filename($font)->size(28)->color(self::MUTED));
            $y += 46;
        }

        $image->text($footer ?? config('app.name'), 70, self::HEIGHT - 50, fn (FontFactory $f) => $f->filename($font)->size(28)->color(self::ACCENT));

        $png = (string) $image->encodeUsingFormat(Format::PNG);
        $disk->put($path, $png);

        return $png;
    }
}
