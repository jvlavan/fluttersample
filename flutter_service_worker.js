'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "4e67c61305fed85c649748b67dd31c9b",
"assets/assets/albums.json": "9ec560cc78a733dd3a2b12c17719efc9",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/fonts/MaterialIcons-Regular.otf": "1288c9e28052e028aba623321f7826ac",
"assets/images/balls/ball1.png": "a1163f2d7cf83328a7b62c1f8d7ef8d9",
"assets/images/balls/ball2.png": "85f2db46c56aa9f8db188e8d8e42d940",
"assets/images/balls/ball3.png": "77dd6e807f3bc50ac4227b08269dbffc",
"assets/images/balls/ball4.png": "8241ae73551acb56b9d615871c0535c2",
"assets/images/characters/boo.png": "c8d39aa35d9491e17f267012b6516b1c",
"assets/images/characters/broly.png": "d27d85090b3d757b535862029ef9d838",
"assets/images/characters/cell.png": "0bc07dc7183778fe884bae8c7ed970ea",
"assets/images/characters/frieza.png": "d32807fb626d788865ccbaebaf66dfbc",
"assets/images/characters/gohan.png": "dbd1a7f3845927a00390605e6bbb1b7d",
"assets/images/characters/goku.png": "24a923b922c5f6511903cbf4069183e6",
"assets/images/characters/vegeta.png": "478e4df9b97bd112fa5921bfaedbdcdc",
"assets/images/credit_cards/chip.png": "32228bc7f27a6d4f5efb6bfb23f3d8ad",
"assets/images/credit_cards/chip_logo.png": "3bef268e9de7dfc96f587a287e86100b",
"assets/images/dash_dart.png": "742d2248e4b76e1d4021dcb7d43e141d",
"assets/images/dash_dart_dark.png": "ed4a76c0ff90ce740861e2f7bce8a853",
"assets/images/mario_logo.png": "daf731f8c7df30ccae9c991edaaeba39",
"assets/images/mesi.png": "1193e84d0125ad7cc86649198f0386c6",
"assets/images/shoes/1.png": "7fc2c6b1334a9fa685336aca4ad846b5",
"assets/images/shoes/2.png": "a0cd607237ec1cb0683f4206996299dd",
"assets/images/shoes/3.png": "8ea360e79f98624d080d16ab5dfd4d33",
"assets/images/shoes/4.png": "50cf016f0231bf6d5dae9b3dfe3305a5",
"assets/images/twitter_flutter_bg.png": "f179e6f3c18556c70fdcf58fe0fa28d6",
"assets/images/twitter_flutter_logo.jpg": "8a7ecc44800a7d19fea8380929cf5757",
"assets/NOTICES": "614239ab6b14f2a958ac5473d7cbce40",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "115e937bb829a890521f72d2e664b632",
"index.html": "8ab62934f6b64617ffb02dbf818fd763",
"/": "8ab62934f6b64617ffb02dbf818fd763",
"main.dart.js": "cb6fcc240ec17a6b93470ad04e2c2276",
"version.json": "f5a37ed1f1c169499dfa873d7ae58a1b"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
