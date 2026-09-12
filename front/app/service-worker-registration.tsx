'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker enregistré:', registration.scope)
        })
        .catch((error) => {
          console.error('Erreur enregistrement Service Worker:', error)
        })
    }
  }, [])

  return null
}
