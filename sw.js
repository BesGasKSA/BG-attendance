// App shell cache. The page itself is network-first so a new release shows
// on the next open; icons and fonts are cache-first. API calls are never cached.
var CACHE = 'bgatt-20261027.073506';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  // Cache what exists; one missing file must not stop the app from installing.
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.hostname.indexOf('script.google') >= 0 || url.hostname.indexOf('googleusercontent') >= 0) return;
  if (url.pathname.endsWith('/version.json')) return; // always the network: this is how the app learns of a new release
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    e.respondWith(fetch(req.url, { cache: 'no-store', credentials: 'same-origin' }).then(function (res) {
      var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); return res;
    }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match('./'); }); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res.ok && (url.origin === location.origin || url.hostname.indexOf('fonts.') >= 0 || url.hostname === 'cdnjs.cloudflare.com' || url.hostname === 'unpkg.com')) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    });
  }));
});
// Push (2026-10-25): the push carries nothing; the text is fixed and the app's bell shows what is waiting. Never a name or a detail.
self.addEventListener('push', function (e) {
  e.waitUntil(self.registration.showNotification('لديك جديد بانتظارك · New items waiting', {
    body: 'افتح التطبيق لترى الطلبات والمهام · Open the app to see your requests and tasks',
    icon: 'icon-192.png', badge: 'icon-192.png', tag: 'hr-tasks', renotify: true, data: { url: './#home' }
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) if (list[i].url.indexOf(self.registration.scope) === 0 && 'focus' in list[i]) return list[i].focus();
    return self.clients.openWindow(url);
  }));
});
