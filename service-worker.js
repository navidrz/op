// service-worker.js

// [1] Import Workbox libraries from the CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// [2] Check if Workbox loaded correctly
if (workbox) {
  // [3] Set Workbox to not log debugging info in production
  workbox.setConfig({ debug: false });

  // [4] Precache and route essential app shell files
  // Use unique revision strings (e.g., hash of file content) for robust updates
  // Update these revision strings whenever you deploy a new version.
  workbox.precaching.precacheAndRoute([
    { url: 'index.html', revision: 'v1' },
    { url: 'styles.css', revision: 'v1' },
    { url: 'app.js', revision: 'v1' },
    { url: 'offline.html', revision: 'v1' },
    { url: 'manifest.json', revision: 'v1' },
    // Icons and other essential assets
    { url: 'images/icons/icon-192.png', revision: 'v1' },
    { url: 'images/icons/icon-512.png', revision: 'v1' }
  ]);

  // [5] Google Analytics offline support
  // This allows analytics hits to be queued while offline and sent when back online.
  workbox.googleAnalytics.initialize();

  // [6] Runtime caching for images:
  // Strategy: StaleWhileRevalidate - always show cached images and update them in the background.
  // Limit entries to keep cache small and apply expiration to avoid infinite growth.
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'images-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50, // Keep only 50 images
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        })
      ],
    })
  );

  // [7] Runtime caching for CSS and JS:
  // Strategy: StaleWhileRevalidate for fast loads and always update in background.
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'style' || request.destination === 'script',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'assets-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 15 * 24 * 60 * 60, // 15 days
        })
      ]
    })
  );

  // [8] Network-first strategy for API calls to cdn.tsetmc.com
  // If offline, fallback to cached responses if available.
  // Also integrate Background Sync to re-try failed requests later.
  workbox.routing.registerRoute(
    ({ url }) => url.origin.includes('cdn.tsetmc.com'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache',
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
        new workbox.backgroundSync.BackgroundSyncPlugin('api-queue', {
          maxRetentionTime: 24 * 60 // Retry for up to 24 hours
        }),
      ]
    })
  );

  // [9] Offline Fallback for navigation requests:
  // If the user requests a page not in cache and network fails, show offline.html.
  // This ensures a good UX offline.
  workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.destination === 'document') {
      // Return the offline fallback page
      return workbox.precaching.matchPrecache('offline.html');
    } 
    // If request is for an image and offline, could return a generic fallback image if needed:
    if (event.request.destination === 'image') {
      // Return a fallback image if you'd like (just ensure it's precached)
      // return workbox.precaching.matchPrecache('/images/fallback/offline.png');
    }
    return Response.error();
  });

  // [10] (Optional) Listen for push events for notifications
  // Placeholder code for push notifications:
  // self.addEventListener('push', event => {
  //   const data = event.data.json();
  //   event.waitUntil(
  //     registration.showNotification(data.title, {
  //       body: data.body,
  //       icon: 'images/icons/icon-192.png'
  //     })
  //   );
  // });

  // [11] (Optional) Listen for notification clicks to handle user interaction:
  // self.addEventListener('notificationclick', event => {
  //   event.notification.close();
  //   event.waitUntil(clients.openWindow('/'));
  // });

} else {
  console.log('Workbox failed to load. Service Worker not active.');
}
