// Change le numéro de version à chaque mise à jour pour forcer le rafraîchissement du cache.
const CACHE = 'lecteur-v4';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'wolf-bg.webp', 'wolf-disc.webp', 'wolf-frame.webp', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  // Ajout fichier par fichier : un fichier manquant n'empêche plus l'installation.
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))));
  self.clients.claim();
});

// Sert le cache tout de suite, puis met à jour en arrière-plan (fonctionne hors ligne, polices comprises).
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== location.origin && !FONT_HOSTS.includes(url.hostname)) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (cached) { e.waitUntil(net); return cached; }
    const res = await net;
    if (res) return res;
    if (req.mode === 'navigate') return (await cache.match('index.html')) || (await cache.match('./'));
    return Response.error();
  }));
});
