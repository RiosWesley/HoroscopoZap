// Versão do cache
const CACHE_NAME = 'horoscopozap-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/website-image.png',
  '/manifest.json'
  // Os arquivos de build (JS/CSS) serão adicionados dinamicamente
];

console.log("Service Worker: Registrado e ativo!");

// Instalação: cacheia arquivos essenciais
self.addEventListener('install', event => {
  console.log("Service Worker: Evento install");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação: remove caches antigos
self.addEventListener('activate', event => {
  console.log("Service Worker: Evento activate");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Intercepta requisições e serve do cache se offline
self.addEventListener('fetch', event => {
  console.log("Service Worker: Interceptando fetch", event.request.method, event.request.url);

  // Intercepta POST para /receive-share (Web Share Target)
  if (
    event.request.method === 'POST' &&
    new URL(event.request.url).pathname === '/receive-share'
  ) {
    event.respondWith(
      (async () => {
        try {
          // Extrai o campo "chat" do formData
          const formData = await event.request.formData();
          // Loga todas as chaves e tipos do formData
          const allKeys = [];
          for (const key of formData.keys()) allKeys.push(key);
          console.log("Service Worker: formData keys recebidas:", allKeys);

          for (const key of allKeys) {
            const value = formData.get(key);
            if (value && (value instanceof File || value instanceof Blob)) {
              const name = value.name || '(sem nome)';
              const type = value.type || '(sem tipo)';
              const size = value.size || 0;
              const ext = name.split('.').pop()?.toLowerCase() || '';
              console.log(`Service Worker: Campo '${key}' é arquivo: nome=${name}, tipo=${type}, tamanho=${size} bytes`);
            } else {
              console.log(`Service Worker: Campo '${key}' não é arquivo. Valor:`, value);
            }
          }

          // Tenta pegar o arquivo do campo "chat" ou "file"
          let file = formData.get('chat');
          let campo = 'chat';
          if (!(file && (file instanceof File || file instanceof Blob))) {
            file = formData.get('file');
            campo = 'file';
          }
          if (!(file && (file instanceof File || file instanceof Blob))) {
            // Se houver múltiplos "file", pega o primeiro válido
            for (const key of allKeys) {
              if (key === 'file') {
                const candidate = formData.getAll(key);
                for (const f of candidate) {
                  if (f && (f instanceof File || f instanceof Blob)) {
                    file = f;
                    campo = 'file';
                    break;
                  }
                }
                if (file) break;
              }
            }
          }
          if (file && (file instanceof File || file instanceof Blob)) {
            const name = file.name || '(sem nome)';
            const type = file.type || '(sem tipo)';
            const size = file.size || 0;
            const ext = name.split('.').pop()?.toLowerCase() || '';
            console.log(`Service Worker: Arquivo recebido do campo '${campo}': nome=${name}, tipo=${type}, tamanho=${size} bytes`);

            // Validação de extensão e tamanho
            if ((ext === 'zip' || ext === 'txt') && size > 0) {
              const mediaCache = await caches.open('media-share');
              await mediaCache.put('shared-file', new Response(file));
              console.log("Service Worker: Arquivo válido salvo no cache como 'shared-file'.");
              return Response.redirect('/receive-share?share-target', 303);
            } else {
              console.error("Service Worker: Arquivo inválido (extensão ou tamanho). Não salvo no cache.");
              return new Response('Arquivo inválido. Envie um .zip ou .txt do WhatsApp.', { status: 400 });
            }
          } else {
            console.error("Service Worker: Nenhum arquivo válido encontrado nos campos 'chat' ou 'file'.", file);
            return new Response('Nenhum arquivo válido encontrado nos campos chat ou file.', { status: 400 });
          }
        } catch (e) {
          console.error("Service Worker: Erro ao processar POST do Web Share Target", e);
          return new Response('Erro ao processar arquivo compartilhado', { status: 500 });
        }
      })()
    );
    return;
  }

  // Só intercepta GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(response => {
      // Serve do cache, se disponível
      if (response) return response;

      // Senão, busca na rede e adiciona ao cache
      return fetch(event.request)
        .then(networkResponse => {
          // Só cacheia arquivos do mesmo domínio
          if (
            !event.request.url.startsWith(self.location.origin) ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // Fallback offline: retorna index.html para navegação SPA
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
