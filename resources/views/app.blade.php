<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-theme="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>RTEXPRESS — Logistics Dashboard</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/x-icon" href="/favicon.ico/favicon.ico">
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon.ico/favicon-96x96.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon.ico/favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/favicon.ico/apple-icon-180x180.png">
    <link rel="apple-touch-icon" sizes="152x152" href="/favicon.ico/apple-icon-152x152.png">
    <link rel="apple-touch-icon" href="/favicon.ico/apple-icon.png">
    <link rel="manifest" href="/favicon.ico/manifest.json">
    <meta name="msapplication-TileImage" content="/favicon.ico/ms-icon-144x144.png">
    <meta name="msapplication-config" content="/favicon.ico/browserconfig.xml">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
</head>
<body>
    <div id="app"></div>
</body>
</html>
