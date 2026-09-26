/* Built into /sw.js with a content-based version by prepare-pwa.mjs. */
const PREFIX = "trc-hub-";
const VERSION = "__TRC_BUILD__";
const PAGES = `${PREFIX}${VERSION}-pages`;
const ASSETS = `${PREFIX}${VERSION}-assets`;
const DATA = `${PREFIX}${VERSION}-data`;
const OFFLINE = "/offline.html";
const PRECACHE = [OFFLINE, "/icons/trc-192.png", "/icons/trc-512.png"];
const PAGE_PATH = /^\/(?:$|coding$|driving$|skills$|electrical$|install$|college$|notes(?:\/[a-z0-9-]+)?$|study$|reasoning$|progress$)/;

async function keep(cacheName, key, response, max) {
  if (!response.ok || response.type === "opaque" || response.redirected) return;
  try {
    const cache = await caches.open(cacheName);
    await cache.put(key, response.clone());
    const keys = await cache.keys();
    await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map(k => cache.delete(k)));
  } catch { /* Storage limits must never stop the online app. */ }
}

async function savePage(path) {
  if (!PAGE_PATH.test(path)) return;
  const response = await fetch(new Request(path, { headers: { Accept: "text/html" }, cache: "no-cache" }));
  if (!response.ok || response.redirected || !response.headers.get("content-type")?.includes("text/html")) return;
  const html = await response.clone().text();
  // An HTML shell is useful offline only when its initial JS and CSS are present.
  const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"?]+\.(?:js|css))(?:\?[^"\s]*)?"/g)].map(m => m[1]))];
  await Promise.all(assets.map(async path => {
    const cache = await caches.open(ASSETS);
    if (!await cache.match(path)) await keep(ASSETS, path, await fetch(path), 180);
  }));
  await keep(PAGES, path, response, 32);
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(ASSETS);
    await cache.addAll(PRECACHE);
    await savePage("/");
    // Updates wait until the student chooses Reload to update.
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const current = new Set([PAGES, ASSETS, DATA]);
    await Promise.all((await caches.keys()).filter(k => k.startsWith(PREFIX) && !current.has(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") { void self.skipWaiting(); return; }
  if (event.data?.type === "CACHE_PAGE" && typeof event.data.path === "string") {
    event.waitUntil(savePage(event.data.path).catch(() => {}));
  }
});

self.addEventListener("fetch", event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  // Never confuse Next's streamed RSC payload with a complete HTML document.
  // Failed RSC navigations can then fall back to a normal document navigation.
  if (request.headers.has("rsc") || request.headers.has("next-router-state-tree") || url.searchParams.has("_rsc")) return;
  if (request.mode === "navigate" && PAGE_PATH.test(url.pathname)) {
    event.respondWith((async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      try {
        const response = await fetch(request, { signal: controller.signal });
        if (response.ok && response.headers.get("content-type")?.includes("text/html")) {
          await keep(PAGES, url.pathname, response, 32);
        }
        if (response.status < 500) return response;
        const cached = await (await caches.open(PAGES)).match(url.pathname);
        return cached || response;
      } catch {
        return await (await caches.open(PAGES)).match(url.pathname)
          || await (await caches.open(ASSETS)).match(OFFLINE)
          || new Response("You are offline. Reconnect and try again.", { status: 503, headers: { "Content-Type": "text/plain" } });
      } finally { clearTimeout(timer); }
    })());
    return;
  }
  const immutable = url.pathname.startsWith("/_next/static/");
  const localAsset = /^\/(?:icons|branding)\//.test(url.pathname);
  const note = /^\/notes\/read\/[a-z0-9-]+\.json$/.test(url.pathname);
  if (!(immutable || localAsset || note) || (!immutable && url.search)) return;
  event.respondWith((async () => {
    const name = note ? DATA : ASSETS, cache = await caches.open(name);
    const key = immutable ? url.pathname : request;
    const cached = await cache.match(key);
    if (immutable && cached) return cached;
    try {
      const response = await fetch(request);
      await keep(name, key, response, note ? 24 : 180);
      return response.ok ? response : cached || response;
    } catch { return cached || Response.error(); }
  })());
});
