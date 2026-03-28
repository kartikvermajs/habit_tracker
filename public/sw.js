/* ─── Habit Tracker Service Worker ─────────────────────────────────────────── */
const CACHE_NAME = 'habit-tracker-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

/* Push event: triggered by the server (future) or postMessage from client    */
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Habit Reminder', {
      body: data.body || 'Time to work on your habit!',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: data.tag || 'habit-reminder',
      vibrate: [200, 100, 200],
    })
  )
})

/* showNotification triggered from the page via postMessage */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = event.data
    event.waitUntil(
      self.registration.showNotification(title, {
        body: body || 'Time to work on your habit!',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: tag || 'habit',
        vibrate: [200, 100, 200],
      })
    )
  }
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length) return clients[0].focus()
      return self.clients.openWindow('/dashboard')
    })
  )
})
