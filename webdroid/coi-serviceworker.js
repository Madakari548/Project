/*! coi-serviceworker v0.1.6 - Guido Zuidhof, MIT License
 * Source: https://github.com/gzuidhof/coi-serviceworker
 */
let coepCredentialless = false;
if (typeof window === "undefined") {
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
  self.addEventListener("message", ev => {
    if (!ev.data) return;
    if (ev.data.type === "deregister") {
      self.registration.unregister().then(() => self.clients.matchAll()).then(clients => clients.forEach(client => client.navigate(client.url)));
    } else if (ev.data.type === "coepCredentialless") {
      coepCredentialless = ev.data.value;
    }
  });
  self.addEventListener("fetch", event => {
    const request = event.request;
    if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;
    const forwarded = coepCredentialless && request.mode === "no-cors" ? new Request(request, { credentials: "omit" }) : request;
    event.respondWith(fetch(forwarded).then(response => {
      if (response.status === 0) return response;
      const headers = new Headers(response.headers);
      headers.set("Cross-Origin-Embedder-Policy", coepCredentialless ? "credentialless" : "require-corp");
      headers.set("Cross-Origin-Opener-Policy", "same-origin");
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }).catch(error => { console.error("COI service worker fetch failed", error); throw error; }));
  });
} else {
  (() => {
    const options = { shouldRegister: () => true, shouldDeregister: () => false, coepCredentialless: () => false, doReload: () => window.location.reload(), quiet: false, ...window.coi };
    const nav = navigator;
    if (nav.serviceWorker && nav.serviceWorker.controller) {
      nav.serviceWorker.controller.postMessage({ type: "coepCredentialless", value: options.coepCredentialless() });
      if (options.shouldDeregister()) nav.serviceWorker.controller.postMessage({ type: "deregister" });
    }
    if (window.crossOriginIsolated !== false || !options.shouldRegister()) return;
    if (!window.isSecureContext) {
      if (!options.quiet) console.log("COOP/COEP service worker requires a secure context (HTTPS or localhost).");
      return;
    }
    if (nav.serviceWorker) {
      nav.serviceWorker.register(document.currentScript.src).then(registration => {
        if (!options.quiet) console.log("COOP/COEP service worker registered", registration.scope);
        registration.addEventListener("updatefound", () => options.doReload());
        if (registration.active && !nav.serviceWorker.controller) options.doReload();
      }).catch(error => { if (!options.quiet) console.error("COOP/COEP service worker registration failed", error); });
    }
  })();
}
