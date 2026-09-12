'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Force unregister ALL existing service workers first
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          return Promise.all(
            registrations.map((reg) => {
              console.log('[SW] Desinscription ancien SW:', reg.scope)
              return reg.unregister()
            })
          )
        })
        .then(() => {
          // Clear all caches
          if ('caches' in window) {
            return caches.keys().then((keys) => {
              return Promise.all(keys.map((key) => caches.delete(key)))
            })
          }
        })
        .then(() => {
          // Register the new clean SW
          return navigator.serviceWorker.register('/sw.js')
        })
        .then((registration) => {
          console.log('[SW] Nouveau Service Worker enregistré:', registration.scope)
        })
        .catch((error) => {
          console.error('[SW] Erreur:', error)
        })
    }
  }, [])

  return null
}
