'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Desinscrit d'abord tous les anciens SW
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          return Promise.all(
            registrations.map((reg) => {
              console.log('[SW] Desinscription:', reg.scope)
              return reg.unregister()
            })
          )
        })
        .then(() => {
          // Enregistre le nouveau SW auto-destructeur une derniere fois
          // pour remplacer l ancien SW chez les utilisateurs bloques
          return navigator.serviceWorker.register('/sw.js')
        })
        .then(() => {
          console.log('[SW] Auto-destructeur enregistre, le SW sera supprime')
        })
        .catch((error) => {
          console.error('[SW] Erreur:', error)
        })
    }
  }, [])

  return null
}
