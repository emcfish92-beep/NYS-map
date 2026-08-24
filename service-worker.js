const CACHE_NAME = "outdoor-map-v2";

const APP_FILES = [
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];


/*
  INSTALL

  Cache the basic app files.
*/
self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(APP_FILES);
      })
  );
});


/*
  ACTIVATE

  Delete old caches.
*/
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});


/*
  FETCH
*/
self.addEventListener("fetch", event => {

  const request = event.request;
  const url = new URL(request.url);


  /*
    IMPORTANT:

    Do NOT interfere with MapTiler or other
    external websites.
  */
  if (url.origin !== self.location.origin) {
    return;
  }


  /*
    Always try to get the newest version of:
      - the webpage
      - places.js

    If there is no internet, fall back to cache.
  */
  if (
    request.mode === "navigate" ||
    url.pathname.endsWith("/places.js")
  ) {

    event.respondWith(
      fetch(request)
        .then(response => {

          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, copy);
            });

          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );

    return;
  }


  /*
    Everything else:
    use cache first, then internet.
  */
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request);
      })
  );

});