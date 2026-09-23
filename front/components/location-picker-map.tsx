"use client"

import { useEffect, useRef, useCallback } from "react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { LocateFixed } from "lucide-react"

// Même contournement Turbopack que property-2d-map / property-3d-map :
// sans worker vendorisé, aucune tuile ne s'affiche.
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs")
  maplibregl.setWorkerCount(Math.min(4, navigator.hardwareConcurrency || 2))
}

// Centres des villes du formulaire (coordonnées directes = recentrage
// instantané de la mini-map quand la ville change, sans appel réseau).
const CITY_CENTERS: Record<string, [number, number]> = {
  "Yaoundé": [11.5167, 3.8667],
  "Douala": [9.7679, 4.0511],
  "Bafoussam": [10.4179, 5.4737],
  "Bamenda": [10.1459, 5.9597],
  "Garoua": [13.3958, 9.3265],
  "Maroua": [14.3159, 10.591],
  "Buea": [9.2632, 4.156],
  "Limbe": [9.214, 4.023],
  "Kribi": [9.91, 2.94],
  "Ebolowa": [11.15, 2.9],
  "Ngaoundéré": [13.5833, 7.3167],
  "Dschang": [10.053, 5.444],
}

interface LocationPickerMapProps {
  /** Ville choisie dans le formulaire — la carte se recentre dessus */
  city: string
  /** Appelé à chaque clic sur la carte avec les coordonnées du pin */
  onPick: (lat: number, lon: number) => void
  /** Pin imposé de l'extérieur (géocodage du quartier saisi) — optionnel */
  pin?: { lat: number; lon: number } | null
}

/**
 * Mini-map de sélection de localisation (page publier) : l'utilisateur
 * clique pour poser un pin précis — les coordonnées servent ensuite au
 * géocodage inversé (vrai nom du quartier) et à la détection automatique
 * des équipements de proximité.
 */
export function LocationPickerMap({ city, onPick, pin }: LocationPickerMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick

  const placePin = useCallback((lon: number, lat: number) => {
    const map = mapRef.current
    if (!map) return
    if (!markerRef.current) {
      const el = document.createElement("div")
      el.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 4px rgba(0,0,0,0.4));">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" fill="#16a34a" stroke="white" stroke-width="1.5"/>
      </svg>`
      el.style.cssText = "cursor: pointer;"
      markerRef.current = new maplibregl.Marker({ element: el, anchor: "bottom", draggable: true })
        .setLngLat([lon, lat])
        .addTo(map)
      // Le pin est déplaçable à la souris pour affiner la position
      markerRef.current.on("dragend", () => {
        const p = markerRef.current!.getLngLat()
        onPickRef.current(p.lat, p.lng)
      })
    } else {
      markerRef.current.setLngLat([lon, lat])
    }
  }, [])

  // Init de la carte (une seule fois)
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets/style.json?key=pZbOuTTgEMlz7km8AJvW`,
      center: CITY_CENTERS["Yaoundé"],
      zoom: 12,
      pitch: 0,
      maxPitch: 0,
      pitchWithRotate: false,
      touchPitch: false,
      refreshExpiredTiles: false,
      fadeDuration: 0,
      validateStyle: false,
      maxTileCacheSize: 1024,
    })

    map.addControl(new maplibregl.NavigationControl(), "top-right")

    map.on("click", (e) => {
      placePin(e.lngLat.lng, e.lngLat.lat)
      onPickRef.current(e.lngLat.lat, e.lngLat.lng)
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [placePin])

  // Recentrage quand la ville change
  useEffect(() => {
    const map = mapRef.current
    const center = CITY_CENTERS[city]
    if (!map || !center) return
    map.flyTo({ center, zoom: 12, duration: 900 })
  }, [city])

  // Pin externe : le quartier/adresse saisi a été géocodé — la carte se
  // positionne seule, l'utilisateur n'a rien à chercher à la main.
  useEffect(() => {
    if (!pin) return
    placePin(pin.lon, pin.lat)
    mapRef.current?.flyTo({ center: [pin.lon, pin.lat], zoom: 16, duration: 900 })
  }, [pin, placePin])

  // Bouton "Ma position" : pose le pin sur la position GPS de l'utilisateur
  const locateMe = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lon = pos.coords.longitude
        const lat = pos.coords.latitude
        placePin(lon, lat)
        mapRef.current?.flyTo({ center: [lon, lat], zoom: 16, duration: 900 })
        onPickRef.current(lat, lon)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  }, [placePin])

  return (
    <div className="relative">
      <div
        ref={mapContainer}
        className="w-full rounded-xl border border-border overflow-hidden"
        style={{ height: "260px" }}
      />
      <button
        type="button"
        onClick={locateMe}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur rounded-full px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-lg hover:bg-white transition-colors"
        title="Poser le pin sur ma position GPS"
      >
        <LocateFixed className="w-3.5 h-3.5" />
        Ma position
      </button>
    </div>
  )
}
