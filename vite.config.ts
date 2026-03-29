import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            // Serve the generated sw.js from the Laravel public path
            outDir: 'public/build',
            base: '/build/',
            scope: '/',
            // Include assets to precache
            includeAssets: ['favicon.svg', 'logo.png', 'icons/*.png'],
            manifest: {
                name: 'CargoOS — RT Express',
                short_name: 'CargoOS',
                description: 'RT Express Logistics Dashboard',
                theme_color: '#0ea5e9',
                background_color: '#0f1117',
                display: 'standalone',
                orientation: 'landscape',
                start_url: '/',
                scope: '/',
                lang: 'en',
                categories: ['business', 'logistics'],
                icons: [
                    {
                        src: '/icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: '/icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: '/icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                // Cache strategy: network-first for API, cache-first for assets
                runtimeCaching: [
                    {
                        // API calls — always try network first
                        urlPattern: /^https?:\/\/.*\/api\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            networkTimeoutSeconds: 10,
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60, // 1 hour
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        // Static assets (JS, CSS, images) — cache first
                        urlPattern: /\.(?:js|css|woff2?|png|jpg|svg|ico)$/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'static-assets',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                            },
                        },
                    },
                ],
            },
            // Dev mode — enable for testing install banner in dev
            devOptions: {
                enabled: true,
                type: 'module',
            },
        }),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
