const CACHE_NAME = "pizzaria-v1"; // <-- Mude para v2 quando atualizar os produtos!
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./produtos.js",
  "./script.js",
  "./manifest.json",
];

// 1. Instalação: Salva tudo no cache
self.addEventListener("install", (e) => {
  self.skipWaiting(); // Força o novo SW a ativar imediatamente
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }),
  );
});

// 2. Ativação: Limpa caches velhos e assume o controle
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log("Limpando cache antigo:", cache);
              return caches.delete(cache);
            }
          }),
        );
      })
      .then(() => self.clients.claim()), // Assume o controle das abas abertas
  );
});

// 3. Busca: Tenta o cache primeiro, se não tiver, vai na rede
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    }),
  );
});
