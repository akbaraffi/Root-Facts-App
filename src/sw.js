importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

if (workbox) {
  console.log('Workbox berhasil dimuat');

  self.skipWaiting();
  workbox.core.clientsClaim();
  workbox.precaching.cleanupOutdatedCaches();

  workbox.precaching.precacheAndRoute([
    { url: '/', revision: '1.0.1' },
    { url: '/index.html', revision: '1.0.1' },
    { url: '/app.bundle.js', revision: '1.0.1' },
    { url: '/app.bundle.css', revision: '1.0.1' },
    { url: '/manifest.json', revision: '1.0.1' },
    { url: '/favicon.ico', revision: '1.0.1' },
    { url: '/icons/icon-192x192.png', revision: '1.0.1' },
    { url: '/icons/icon-512x512.png', revision: '1.0.1' },
    { url: '/icons/apple-touch-icon.png', revision: '1.0.1' },
    { url: '/screenshots/desktop.png', revision: '1.0.1' },
    { url: '/screenshots/mobile.png', revision: '1.0.1' },
    { url: '/model/model.json', revision: '1.0.1' },
    { url: '/model/metadata.json', revision: '1.0.1' },
    { url: '/model/weights.bin', revision: '1.0.1' },
    { url: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js', revision: '1.0.1' },
    { url: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgpu@4.22.0/dist/tf-backend-webgpu.min.js', revision: '1.0.1' },
    { url: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1', revision: '1.0.1' },
    { url: 'https://unpkg.com/lucide@0.462.0/dist/umd/lucide.js', revision: '1.0.1' },
  ]);

  workbox.routing.registerRoute(
    ({request}) => request.destination === 'style',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'css-cache',
    })
  );

  workbox.routing.registerRoute(
    ({url}) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.CacheFirst({
      cacheName: 'google-fonts-cache',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  workbox.routing.registerRoute(
    ({url}) => url.origin === 'https://cdn.jsdelivr.net',
    new workbox.strategies.CacheFirst({
      cacheName: 'cdn-cache',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'image-cache',
    })
  );

} else {
  console.log('Workbox gagal dimuat');
}
