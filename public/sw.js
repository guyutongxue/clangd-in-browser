// @ts-check

/// <reference no-default-lib="true"/>
/// <reference lib="es2022" />
/// <reference lib="webworker" />

var self_ = /** @type {ServiceWorkerGlobalScope & typeof globalThis} */ (self);

const CACHE_KEY = "v3";

/**
 *
 * @param {string[]} resources
 */
const addResourcesToCache = async (resources) => {
  const cache = await caches.open(CACHE_KEY);
  await cache.addAll(resources);
};

/**
 * @param {Request} request
 * @param {Response} response
 */
const putInCache = async (request, response) => {
  const url = new URL(request.url);
  if (url.protocol === "chrome-extension:") {
    return;
  }
  const cache = await caches.open(CACHE_KEY);
  await cache.put(request, response);
};

const deleteCache = async (key) => {
  await caches.delete(key);
};

const deleteOldCaches = async () => {
  const cacheKeepList = [CACHE_KEY];
  const keyList = await caches.keys();
  const cachesToDelete = keyList.filter((key) => !cacheKeepList.includes(key));
  await Promise.all(cachesToDelete.map(deleteCache));
};

/**
 * @param {Request} request
 */
const cacheFirst = async (request) => {
  const cache = await caches.open(CACHE_KEY);
  const responseFromCache = await cache.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }
  const responseFromNetwork = await fetch(request);
  putInCache(request, responseFromNetwork.clone());
  return responseFromNetwork;
};

self_.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // await self_.registration?.navigationPreload.enable();
      await deleteOldCaches();
    })()
  );
});

self_.addEventListener("install", (event) => {
  event.waitUntil(
    addResourcesToCache(["/wasm/clangd.js", "/wasm/clangd.wasm"])
  );
});

self_.addEventListener("fetch", (event) => {
  event.respondWith(cacheFirst(event.request));
});
