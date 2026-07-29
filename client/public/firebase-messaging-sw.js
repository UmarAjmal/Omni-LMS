importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

const firebaseConfig = {
  // Empty init, backend handles most logic, but SW can intercept via generic push event if token is registered
};

// We will listen to push events directly to ensure native experience
self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      const title = payload.notification?.title || 'Falcon Swift LMS';
      const body = payload.notification?.body || 'You have a new notification.';
      const actionUrl = payload.data?.actionUrl || '/dashboard';

      const options = {
        body: body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        timestamp: Date.now(),
        data: { url: actionUrl },
        vibrate: [200, 100, 200],
        requireInteraction: true, // keeps it on screen like whatsapp/gmail
        actions: [
          { action: 'open', title: 'Tap to open' }
        ]
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (err) {
      console.error('Error handling push event:', err);
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
