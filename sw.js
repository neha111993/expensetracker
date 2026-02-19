const CACHE_NAME = 'expense-tracker-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/m.css',      
  '/Register.html',
  '/try.html',     
  '/try.css',      
  '/register.css', 
  '/try.js',       
  '/register.js',
  '/Reset.html',
  '/reset.css',
  '/manifest.json',
  '/icon-192.png', 
  '/icon-512.png'  
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});