"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

// Contournement d'un bug de Turbopack (bundler de Next.js) qui empêche le
// Web Worker de maplibre-gl de se charger correctement (imports internes
// non réécrits). Sans worker, la carte reste bloquée sur son style de fond
// et n'affiche jamais aucune tuile. On pointe donc vers une copie du worker
// vendorisée dans public/maplibre (voir scripts/sync-maplibre-worker.mjs).
// Voir: https://github.com/vercel/next.js/issues/98137
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs")
}

// Yaoundé (centre-ville) — vue par défaut, déjà au niveau "ville" pour que
// les immeubles 3D soient visibles immédiatement, sans avoir à zoomer.
const DEFAULT_CENTER: [number, number] = [11.5167, 3.8667]
const CITY_ZOOM = 15.6
// Zoom minimal en dessous duquel les bâtiments 3D ne sont plus visibles
// (voir minzoom de la couche "3d-buildings" plus bas).
const MIN_BUILDING_ZOOM = 14.8

function normalizeCity(name?: string) {
  if (!name) return ""
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

interface PropertyMapItem {
  ad_id?: string
  id?: string
  title?: string
  price?: number
  latitude?: number
  longitude?: number
  city?: string
  district?: string
  bedrooms?: number
  bathrooms?: number
  photos?: Array<any>
}

interface Property3DMapProps {
  properties: PropertyMapItem[]
  onMarkerClick?: (id: string) => void
  /** Bien ciblé : itinéraire tracé vers ce bien */
  destination?: PropertyMapItem | null
  onCloseRoute?: () => void
  onViewProperty?: (id: string) => void
  /** Expose les actions de carte au parent (flyTo, zone, position, autoFit) */
  onMapActions?: (actions: {
    flyToProperty: (lat: number, lon: number, title?: string) => void
    flyToZone: (lat: number, lon: number, radiusKm?: number) => void
    getUserPosition: () => [number, number] | null
    setUserPosition: (lon: number, lat: number) => void
    setSuppressAutoFit: (v: boolean) => void
  }) => void
  /** Appelé quand l'itinéraire est calculé (km, durée) ou annulé */
  onRouteInfo?: (info: { km: number; min: number } | null, loading: boolean) => void
}

export function Property3DMap({ properties, onMarkerClick, destination, onCloseRoute, onViewProperty, onMapActions, onRouteInfo }: Property3DMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const userMarkerRef = useRef<maplibregl.Marker | null>(null)
  const userPosRef = useRef<[number, number] | null>(null)
  const destMarkerRef = useRef<maplibregl.Marker | null>(null)
  const placeMarkerRef = useRef<maplibregl.Marker | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [routeInfo, setRouteInfo] = useState<{ km: number; min: number } | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  // Quand true, le prochain updateMarkers ne re-fittera pas les bounds (zone search)
  const suppressNextAutoFitRef = useRef(false)

  // Fly to a specific property (place search) with a destination pin
  const flyToProperty = useCallback((lat: number, lon: number, title?: string) => {
    const map = mapRef.current
    if (!map) return
    placeMarkerRef.current?.remove()
    const el = document.createElement("div")
    el.innerHTML = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 4px rgba(0,0,0,0.4));">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" fill="#dc2626" stroke="white" stroke-width="1.5"/>
    </svg>`
    el.style.cssText = "cursor: pointer; pointer-events: auto;"
    if (title) el.title = title
    placeMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([lon, lat])
      .addTo(map)
    map.flyTo({
      center: [lon, lat],
      zoom: 17,
      pitch: 65,
      bearing: 0,
      duration: 1200,
      essential: true,
    })
  }, [])

  // Fit map to a zone around user position (zone search)
  const flyToZone = useCallback((lat: number, lon: number, radiusKm: number = 5) => {
    const map = mapRef.current
    if (!map) return
    const deg = radiusKm / 111
    map.fitBounds(
      [
        [lon - deg, lat - deg],
        [lon + deg, lat + deg],
      ],
      { pitch: 60, duration: 1000, padding: 80 }
    )
  }, [])

  // Définit la position de l'utilisateur (appelée par le parent, ex: recherche par zone).
  // Implémentation déclarée après showUserMarker plus bas.

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    let map: maplibregl.Map

    try {
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets/style.json?key=pZbOuTTgEMlz7km8AJvW`,
        center: DEFAULT_CENTER, // Yaoundé (centre-ville)
        zoom: CITY_ZOOM, // Zoom "ville" pour voir directement les immeubles en 3D
        pitch: 60, // Vue 3D inclinée
        bearing: -17,
        maxPitch: 85,
        // Depuis MapLibre v5, l'antialiasing se règle via canvasContextAttributes
        canvasContextAttributes: { antialias: true },
      })
    } catch (err: any) {
      console.error("[Map] Erreur d'initialisation:", err)
      setMapError(err.message || "Impossible de charger la carte")
      return
    }

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "top-right"
    )
    map.addControl(new maplibregl.ScaleControl(), "bottom-left")

    // Fournit une image transparente pour les icônes absentes du sprite
    // MapTiler (ex: "office_11", "atm_11") au lieu de spammer la console.
    // Deux mécanismes complémentaires : le résolveur (MapLibre récent) et
    // l'événement styleimagemissing (toutes versions).
    if (typeof (map as any).setMissingStyleImageResolver === "function") {
      ;(map as any).setMissingStyleImageResolver(() => new ImageData(1, 1))
    }
    map.on("styleimagemissing", (e: any) => {
      const id = e?.id
      if (!id || map.hasImage(id)) return
      try {
        map.addImage(id, new ImageData(1, 1))
      } catch {
        // Image déjà ajoutée entre-temps : on ignore
      }
    })

    map.on("error", (e: any) => {
      const msg = e.error?.message || e.message || ""
      // Les icônes de sprite manquantes sont déjà neutralisées ci-dessus
      if (typeof msg === "string" && msg.includes("could not be loaded")) return
      console.error("[Map] Erreur:", e.error?.message || e.message || e)
    })

    // Ajouter le ciel/l'éclairage + les bâtiments 3D quand la carte est chargée
    map.on("load", () => {
      setMapReady(true)
      try {
        // Ciel + brume : donne de la profondeur à la vue inclinée façon
        // showcase MapTiler (au lieu d'un aplat uni au-dessus de l'horizon)
        map.setSky({
          "sky-color": "#bcdcff",
          "sky-horizon-blend": 0.6,
          "horizon-color": "#f6f1e5",
          "horizon-fog-blend": 0.6,
          "fog-color": "#d8e4ee",
          "fog-ground-blend": 0.7,
        })

        // Éclairage directionnel pour donner du relief aux façades des
        // bâtiments extrudés (au lieu d'un rendu plat sans ombre)
        map.setLight({
          anchor: "viewport",
          color: "#ffffff",
          intensity: 0.35,
          position: [1.5, 90, 45],
        })

        // Insère la couche des bâtiments juste avant les libellés pour que
        // les noms de rues/quartiers restent lisibles au-dessus des toits
        const labelLayerId = map
          .getStyle()
          ?.layers?.find((l: any) => l.type === "symbol" && l.layout?.["text-field"])?.id

        // Couche 3D des bâtiments avec MapTiler - s'affiche au zoom 14+
        // Dégradé bleu selon la hauteur
        map.addLayer(
          {
            id: "3d-buildings",
            source: "openmaptiles",
            "source-layer": "building",
            type: "fill-extrusion",
            minzoom: 13,
            // Exclure les éléments marqués hide_3d (p.ex. toits stylisés) sans
            // rejeter les bâtiments qui n'ont pas ce champ (null != true)
            filter: ["all", ["!=", ["get", "hide_3d"], true]],
            layout: {
              // Coins arrondis : rendu moins "boîte à chaussures", plus proche
              // du showcase MapTiler
              "fill-extrusion-rounded-corner-distance": 0.5,
            },
            paint: {
              // coalesce : certains bâtiments n'ont pas de render_height
              // (valeur null) → MapLibre retombait sur rgba(0,0,0,1) et
              // polluait la console avec "Expected value to be of type number"
              "fill-extrusion-color": [
                "interpolate",
                ["linear"],
                ["coalesce", ["get", "render_height"], 0],
                0, "#e2e8f0",
                40, "#93b8e0",
                120, "#3b6fc9",
                250, "#1e3f8f",
              ],
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                13, 0,
                14.5, ["coalesce", ["get", "render_height"], 0],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                13, 0,
                14, ["coalesce", ["get", "render_min_height"], 0],
              ],
              "fill-extrusion-opacity": 0.92,
              // Assombrit légèrement la base des bâtiments pour simuler une
              // ombre portée / occlusion ambiante (pas d'AO natif dispo)
              "fill-extrusion-vertical-gradient": true,
            },
          },
          labelLayerId
        )

        // Couche de contour des bâtiments pour plus de relief
        map.addLayer(
          {
            id: "3d-buildings-outline",
            source: "openmaptiles",
            "source-layer": "building",
            type: "line",
            minzoom: 13,
            paint: {
              "line-color": "#1e3a5f",
              "line-width": 0.5,
              "line-opacity": 0.4,
            },
            layout: {
              "line-join": "round",
            },
          },
          labelLayerId
        )

        // Icône flèche (►) dessinée sur canvas — utilisée par la couche
        // "route-arrows" pour indiquer la direction à suivre le long du tracé
        if (!map.hasImage("route-arrow")) {
          const s = 64
          const c = document.createElement("canvas")
          c.width = s
          c.height = s
          const ctx = c.getContext("2d")!
          ctx.translate(s / 2, s / 2)
          ctx.beginPath()
          ctx.moveTo(20, 0)
          ctx.lineTo(-14, -16)
          ctx.lineTo(-6, 0)
          ctx.lineTo(-14, 16)
          ctx.closePath()
          ctx.fillStyle = "#1d4ed8"
          ctx.fill()
          ctx.lineWidth = 4
          ctx.strokeStyle = "#ffffff"
          ctx.stroke()
          map.addImage("route-arrow", ctx.getImageData(0, 0, s, s))
        }
      } catch (e: any) {
        console.warn("[Map] Couche 3D non disponible:", e?.message || e)
      }
    })

    mapRef.current = map
    // Exposé pour faciliter le diagnostic (console navigateur / tests CDP)
    if (typeof window !== "undefined") (window as any).__nestfindMap = map

    return () => {
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  // ── Ma position : point bleu pulsant sur la carte ──
  const showUserMarker = useCallback(() => {
    const map = mapRef.current
    const pos = userPosRef.current
    if (!map || !pos) return
    if (!userMarkerRef.current) {
      // Injecte l'animation CSS une seule fois dans le <head>
      if (!document.getElementById("nestfind-map-styles")) {
        const style = document.createElement("style")
        style.id = "nestfind-map-styles"
        style.textContent = `
          @keyframes nestfind-pulse {
            0%   { transform: scale(0.85); opacity: 0.9; }
            70%  { transform: scale(2.5);  opacity: 0;   }
            100% { transform: scale(2.5);  opacity: 0;   }
          }
        `
        document.head.appendChild(style)
      }

      const wrapper = document.createElement("div")
      wrapper.style.cssText = "width: 22px; height: 22px; position: relative; pointer-events: none;"
      wrapper.title = "Ma position"

      // Anneau pulsant
      const pulse = document.createElement("div")
      pulse.style.cssText = `
        position: absolute; inset: -6px;
        background: rgba(37, 99, 235, 0.28);
        border-radius: 50%;
        animation: nestfind-pulse 2s ease-out infinite;
      `

      // Point bleu central
      const dot = document.createElement("div")
      dot.style.cssText = `
        position: absolute; inset: 0;
        background: #2563eb;
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      `

      wrapper.appendChild(pulse)
      wrapper.appendChild(dot)

      userMarkerRef.current = new maplibregl.Marker({ element: wrapper })
        .setLngLat(pos)
        .addTo(map)
    } else {
      userMarkerRef.current.setLngLat(pos)
    }
  }, [])

  // Définit la position de l'utilisateur (appelée par le parent, ex: recherche par zone)
  const setUserPosition = useCallback((lon: number, lat: number) => {
    userPosRef.current = [lon, lat]
    const map = mapRef.current
    if (map?.isStyleLoaded()) showUserMarker()
    else map?.once("load", showUserMarker)
  }, [showUserMarker])

  // Expose flyTo + autoFit control to parent via onMapActions callback
  useEffect(() => {
    if (onMapActions) {
      onMapActions({
        flyToProperty,
        flyToZone,
        getUserPosition: () => userPosRef.current,
        setUserPosition,
        setSuppressAutoFit: (v: boolean) => { suppressNextAutoFitRef.current = v },
      })
    }
  }, [flyToProperty, flyToZone, setUserPosition, onMapActions])

  // Remonte les infos d'itinéraire (km/min) au composant parent
  useEffect(() => {
    onRouteInfo?.(routeInfo, routeLoading)
  }, [routeInfo, routeLoading, onRouteInfo])

  // Récupère la position de l'utilisateur dès que possible
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userPosRef.current = [pos.coords.longitude, pos.coords.latitude]
        const map = mapRef.current
        if (map?.isStyleLoaded()) showUserMarker()
        else map?.once("load", showUserMarker)
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    )
  }, [showUserMarker])

  // ── Itinéraire : tracé + flèches de direction vers le bien sélectionné ──
  const clearRoute = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    for (const id of ["route-arrows", "route-line", "route-casing"]) {
      if (map.getLayer(id)) map.removeLayer(id)
    }
    if (map.getSource("route")) map.removeSource("route")
    setRouteInfo(null)
  }, [])

  const drawRoute = useCallback(async () => {
    const map = mapRef.current
    if (!map) return
    clearRoute()

    const dLng = Number(destination?.longitude)
    const dLat = Number(destination?.latitude)
    if (!destination || isNaN(dLng) || isNaN(dLat)) return

    // Origine : ma position réelle si dispo, sinon le centre actuel de la carte
    const origin: [number, number] = userPosRef.current ?? [
      map.getCenter().lng,
      map.getCenter().lat,
    ]
    const dest: [number, number] = [dLng, dLat]

    setRouteLoading(true)
    let coords: [number, number][] = []
    let km: number | null = null
    let min: number | null = null
    try {
      // API publique OSRM (itinéraire routier) — pas de clé requise.
      // Timeout 8s : si le service est lent/injoignable on trace une ligne
      // droite plutôt que de laisser l'utilisateur attendre.
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 8000)
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin[0]},${origin[1]};${dest[0]},${dest[1]}?overview=full&geometries=geojson`,
        { signal: ctrl.signal }
      )
      clearTimeout(timer)
      const json = await res.json()
      const r = json?.routes?.[0]
      if (r?.geometry?.coordinates?.length) {
        coords = r.geometry.coordinates
        km = r.distance / 1000
        min = r.duration / 60
      }
    } catch {}
    // Repli : ligne droite si le service d'itinéraire est indisponible
    if (!coords.length) coords = [origin, dest]
    setRouteLoading(false)

    // La destination peut avoir changé pendant le fetch
    if (!map.getCanvas()) return

    map.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coords },
      },
    })

    const labelLayerId = map
      .getStyle()
      ?.layers?.find((l: any) => l.type === "symbol" && l.layout?.["text-field"])?.id

    map.addLayer(
      {
        id: "route-casing",
        type: "line",
        source: "route",
        paint: { "line-color": "#ffffff", "line-width": 9, "line-opacity": 0.95 },
        layout: { "line-cap": "round", "line-join": "round" },
      },
      labelLayerId
    )
    map.addLayer(
      {
        id: "route-line",
        type: "line",
        source: "route",
        paint: { "line-color": "#16a34a", "line-width": 6 },
        layout: { "line-cap": "round", "line-join": "round" },
      },
      labelLayerId
    )
    // Flèches ► espacées le long du tracé, orientées vers la destination
    map.addLayer(
      {
        id: "route-arrows",
        type: "symbol",
        source: "route",
        minzoom: 8,
        layout: {
          "symbol-placement": "line",
          "symbol-spacing": 90,
          "icon-image": "route-arrow",
          "icon-size": 0.55,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-rotation-alignment": "map",
          "icon-pitch-alignment": "map",
        },
      },
      labelLayerId
    )

    setRouteInfo(km != null && min != null ? { km, min } : null)

    const b = new maplibregl.LngLatBounds()
    b.extend(origin)
    b.extend(dest)
    coords.forEach((c) => b.extend(c))
    map.fitBounds(b, {
      padding: { top: 140, bottom: 160, left: 140, right: 140 },
      pitch: 60,
      duration: 900,
    })

    // Destination pin marker (red pin icon)
    destMarkerRef.current?.remove()
    const destEl = document.createElement("div")
    destEl.innerHTML = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 4px rgba(0,0,0,0.4));">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" fill="#dc2626" stroke="white" stroke-width="1.5"/>
    </svg>`
    destEl.style.cssText = "cursor: pointer; pointer-events: auto;"
    destEl.addEventListener("click", () => {
      if (destination && onViewProperty) {
        const id = destination.ad_id || destination.id
        if (id) onViewProperty(id)
      }
    })
    destMarkerRef.current = new maplibregl.Marker({ element: destEl, anchor: "bottom" })
      .setLngLat(dest)
      .addTo(map)
  }, [destination, clearRoute])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    // `loaded()` est false pendant un flyTo/zoom (tuiles en cours) et "load"
    // ne se déclenche qu'UNE fois à l'init : l'itinéraire ne se traçait plus.
    // `isStyleLoaded()` reste vrai dès que le style est prêt (addSource/addLayer OK).
    if (map.isStyleLoaded()) drawRoute()
    else map.once("load", drawRoute)
  }, [drawRoute])

  // Update markers when properties change
  const updateMarkers = useCallback(() => {
    if (!mapRef.current) return

    // Clear old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const validProps = properties.filter(
      (p) => p.latitude != null && p.longitude != null
    )

    if (validProps.length === 0) return

    const bounds = new maplibregl.LngLatBounds()

    validProps.forEach((prop) => {
      const photos = Array.isArray(prop.photos)
        ? prop.photos.map((p: any) => p?.url || p).filter(Boolean)
        : []
      const img = photos[0] || "/images/house-1.jpg"
      const price = prop.price
        ? `${Number(prop.price).toLocaleString("fr-FR")} FCFA`
        : ""

      // Custom HTML marker with price badge.
      // IMPORTANT : maplibre applique `transform: translate(...)` sur l'élément
      // racine du marker pour le positionner. Si on anime `transform` au survol,
      // on écrase ce translate et le badge "fuit" (boucle mouseenter/leave).
      // Solution : wrapper racine (positionné par maplibre) + badge interne qui scale.
      const wrapper = document.createElement("div")
      wrapper.style.cssText = "pointer-events: auto; cursor: pointer;"

      const badge = document.createElement("div")
      badge.style.cssText = `
        background: rgba(26, 26, 26, 0.95);
        color: white;
        padding: 4px 10px;
        border-radius: 16px;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 3px 8px rgba(0,0,0,0.35);
        border: 2px solid white;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        transform-origin: center bottom;
      `
      badge.textContent = prop.price ? `${(prop.price / 1000).toFixed(0)}k FCFA` : "Voir"
      badge.addEventListener("mouseenter", () => {
        badge.style.transform = "scale(1.18)"
        badge.style.boxShadow = "0 6px 16px rgba(0,0,0,0.45)"
        wrapper.style.zIndex = "1000"
      })
      badge.addEventListener("mouseleave", () => {
        badge.style.transform = "scale(1)"
        badge.style.boxShadow = "0 3px 8px rgba(0,0,0,0.35)"
        wrapper.style.zIndex = ""
      })
      badge.addEventListener("click", (ev) => {
        ev.stopPropagation()
        const id = prop.ad_id || prop.id || ""
        if (id && onMarkerClick) onMarkerClick(id)
        // Zoom vers le bien cliqué (style Yango : la caméra suit le marqueur)
        const map = mapRef.current
        if (map && prop.latitude != null && prop.longitude != null) {
          map.flyTo({
            center: [Number(prop.longitude), Number(prop.latitude)],
            zoom: 17,
            pitch: 65,
            bearing: 0,
            duration: 800,
            essential: true,
          })
        }
      })
      wrapper.appendChild(badge)
      const el = wrapper

      const popup = new maplibregl.Popup({
        offset: 30,
        closeButton: true,
        maxWidth: "260px",
      }).setHTML(`
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 0; overflow: hidden; border-radius: 12px;">
          <div style="width: 100%; height: 110px; overflow: hidden; border-radius: 8px 8px 0 0;">
            <img src="${img}" alt="${prop.title || "Bien"}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <div style="padding: 8px 12px;">
            <h3 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #1a1a1a; line-height: 1.3;">
              ${prop.title || "Annonce"}
            </h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #1a1a1a;">
              ${price}
            </p>
            <p style="margin: 0; font-size: 11px; color: #888;">
              ${[prop.district, prop.city].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>
      `)

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([prop.longitude!, prop.latitude!])
        .setPopup(popup)
        .addTo(mapRef.current!)

      markersRef.current.push(marker)
      bounds.extend([prop.longitude!, prop.latitude!])
    })

    const map = mapRef.current

    // On cible la ville qui regroupe le plus de résultats plutôt que de
    // cadrer sur l'ensemble des biens (qui peuvent être dispersés dans
    // plusieurs villes du pays) : sinon la caméra dézoome trop loin et les
    // immeubles 3D deviennent invisibles (ils n'existent qu'à partir du
    // zoom "ville", voir minzoom de la couche "3d-buildings").
    const byCity = new Map<string, typeof validProps>()
    for (const prop of validProps) {
      const key = normalizeCity(prop.city)
      const arr = byCity.get(key)
      if (arr) arr.push(prop)
      else byCity.set(key, [prop])
    }
    let focusProps = validProps
    let maxCount = 0
    for (const arr of byCity.values()) {
      if (arr.length > maxCount) {
        maxCount = arr.length
        focusProps = arr
      }
    }

    const focusBounds = new maplibregl.LngLatBounds()
    focusProps.forEach((p) => focusBounds.extend([p.longitude!, p.latitude!]))

    const enforceCityZoom = () => {
      if (map.getZoom() < MIN_BUILDING_ZOOM) {
        map.easeTo({ zoom: CITY_ZOOM, duration: 600 })
      }
    }

    // Si un suppressAutoFit est actif (ex: après zone search GPS), on ne
    // re-cible pas la carte afin que flyToZone conserve la vue courante.
    if (suppressNextAutoFitRef.current) {
      suppressNextAutoFitRef.current = false
    } else if (focusProps.length > 1) {
      map.fitBounds(focusBounds, {
        padding: 90,
        maxZoom: 17,
        pitch: 60,
        bearing: -17,
      })
      map.once("moveend", enforceCityZoom)
    } else {
      map.flyTo({
        center: [focusProps[0].longitude!, focusProps[0].latitude!],
        zoom: 16,
        pitch: 60,
        bearing: -17,
      })
    }
  }, [properties, onMarkerClick])

  useEffect(() => {
    if (mapRef.current) {
      if (mapRef.current.isStyleLoaded()) {
        updateMarkers()
      } else {
        mapRef.current.once("load", updateMarkers)
      }
    }
  }, [updateMarkers])

  return (
    <>
      <div
        ref={mapContainer}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          background: "#e5e7eb",
        }}
      />

      {mapError && (
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f4",
          zIndex: 1,
        }}>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#57534e", marginBottom: "4px" }}>
              Carte indisponible
            </p>
            <p style={{ fontSize: "12px", color: "#a8a29e" }}>
              {mapError}
            </p>
          </div>
        </div>
      )}
      {!mapReady && !mapError && (
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f4",
          zIndex: 1,
        }}>
          <div style={{ textAlign: "center" }}>
            <div className="animate-spin" style={{
              width: "32px",
              height: "32px",
              border: "3px solid #d6d3d1",
              borderTopColor: "#1c1917",
              borderRadius: "50%",
              margin: "0 auto 8px",
            }} />
            <p style={{ fontSize: "12px", color: "#78716c" }}>Chargement de la carte...</p>
          </div>
        </div>
      )}
    </>
  )
}
