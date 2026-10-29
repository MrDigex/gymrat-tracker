<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'dark') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "dark" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: #fafafa;
            }

            html.dark {
                background-color: #18181b;
            }
        </style>

        {{-- Versioned so browsers and the CDN don't keep a previously cached icon --}}
        <link rel="icon" href="/favicon.ico?v=2" sizes="any">
        <link rel="icon" href="/images/logo/favicon-32.png?v=2" type="image/png" sizes="32x32">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2">

        @isset($openGraph)
            <meta name="description" content="{{ $openGraph['description'] }}">
            <meta property="og:type" content="website">
            <meta property="og:site_name" content="{{ config('app.name') }}">
            <meta property="og:title" content="{{ $openGraph['title'] }}">
            <meta property="og:description" content="{{ $openGraph['description'] }}">
            <meta property="og:image" content="{{ $openGraph['image'] }}">
            <meta property="og:image:width" content="1200">
            <meta property="og:image:height" content="630">
            <meta property="og:url" content="{{ $openGraph['url'] }}">
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:title" content="{{ $openGraph['title'] }}">
            <meta name="twitter:description" content="{{ $openGraph['description'] }}">
            <meta name="twitter:image" content="{{ $openGraph['image'] }}">
        @endisset

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
