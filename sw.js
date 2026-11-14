/* Service worker KasirKu — naikkan V setiap kali mengubah file aplikasi */
const V = 'kasirku-v2';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(c => Promise.allSettled([...SHELL, ...LIBS].map(u => c.add(u)))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;                       // API Apps Script (POST) tidak pernah di-cache
  if (LIBS.includes(r.url)) {                           // pustaka PDF: cache-first
    e.respondWith(caches.match(r).then(h => h || fetch(r).then(x => { const cp = x.clone(); caches.open(V).then(c => c.put(r, cp)); return x; })));
    return;
  }
  if (u.origin !== location.origin) return;             // ImageKit dll: langsung ke jaringan
  if (r.mode === 'navigate') {                          // halaman: network-first, offline pakai cache
    e.respondWith(fetch(r).then(x => { if (x.ok) { const cp = x.clone(); caches.open(V).then(c => c.put('index.html', cp)); } return x; })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(r).then(h => {             // aset lain: stale-while-revalidate
    const n = fetch(r).then(x => { if (x.ok) { const cp = x.clone(); caches.open(V).then(c => c.put(r, cp)); } return x; }).catch(() => h);
    return h || n;
  }));
});
