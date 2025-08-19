// LexChronos Service Worker
const CACHE_NAME = 'lexchronos-v1';
const OFFLINE_URL = '/offline';

// Cache essential resources
const STATIC_CACHE_URLS = [
  '/',
  '/offline',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages/_app.js',
  '/_next/static/chunks/pages/index.js',
  '/manifest.json'
];

// Cache API responses
const API_CACHE_URLS = [
  '/api/cases',
  '/api/timeline',
  '/api/documents'
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing');
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('Service Worker: Caching essential resources');
        await cache.addAll(STATIC_CACHE_URLS);
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('Service Worker: Cache installation failed:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating');
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('Service Worker: Deleting old cache:', name);
            return caches.delete(name);
          })
      );
      
      // Claim all clients
      self.clients.claim();
    })()
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') return;
  
  // Handle different request types
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network first with cache fallback
    event.respondWith(networkFirstStrategy(request));
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Static assets - Cache first
    event.respondWith(cacheFirstStrategy(request));
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|eot)$/)) {
    // Asset files - Cache first
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // Navigation requests - Network first with offline fallback
    event.respondWith(navigationStrategy(request));
  }
});

// Network first strategy for API calls
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline JSON response for API calls
    return new Response(
      JSON.stringify({ error: 'Offline', offline: true }), 
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 503
      }
    );
  }
}

// Cache first strategy for static assets
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch:', request.url, error);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Navigation strategy for page requests
async function navigationStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful navigation responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await caches.match(OFFLINE_URL);
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback offline response
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LexChronos - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-icon { font-size: 64px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="offline-icon">📱</div>
          <h1>You're offline</h1>
          <p>LexChronos is not available without an internet connection.</p>
          <button onclick="location.reload()">Try Again</button>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
      status: 503
    });
  }
}

// Push notification event
self.addEventListener('push', event => {
  console.log('Service Worker: Push event received');
  
  const options = {
    body: 'You have new updates in LexChronos',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'lexchronos-notification',
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/action-open.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.message || options.body;
    options.title = data.title || 'LexChronos';
    if (data.url) {
      options.data = { url: data.url };
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('LexChronos', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification click event');
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window/tab if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync event
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync event', event.tag);
  
  if (event.tag === 'document-upload') {
    event.waitUntil(syncDocuments());
  } else if (event.tag === 'case-update') {
    event.waitUntil(syncCaseUpdates());
  } else if (event.tag === 'timeline-sync') {
    event.waitUntil(syncTimeline());
  }
});

// Background sync functions
async function syncDocuments() {
  try {
    console.log('Service Worker: Syncing documents');
    
    // Get pending documents from IndexedDB
    const pendingDocs = await getPendingDocuments();
    
    for (const doc of pendingDocs) {
      try {
        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(doc)
        });
        
        if (response.ok) {
          await removePendingDocument(doc.id);
          console.log('Document synced successfully:', doc.id);
        }
      } catch (error) {
        console.error('Failed to sync document:', doc.id, error);
      }
    }
  } catch (error) {
    console.error('Document sync failed:', error);
  }
}

async function syncCaseUpdates() {
  try {
    console.log('Service Worker: Syncing case updates');
    // Implementation for syncing case updates
  } catch (error) {
    console.error('Case sync failed:', error);
  }
}

async function syncTimeline() {
  try {
    console.log('Service Worker: Syncing timeline');
    // Implementation for syncing timeline changes
  } catch (error) {
    console.error('Timeline sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingDocuments() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('lexchronos-offline', 1);
    
    request.onsuccess = event => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingDocuments'], 'readonly');
      const store = transaction.objectStore('pendingDocuments');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function removePendingDocument(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('lexchronos-offline', 1);
    
    request.onsuccess = event => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingDocuments'], 'readwrite');
      const store = transaction.objectStore('pendingDocuments');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

console.log('Service Worker: Loaded successfully');