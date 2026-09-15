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

interface Property3DMapProps {
  properties: Array<{
    ad_id?: string
    id?: string
    title?: string
    price?: number
    latitude?: number
    longitude?: number
    city?: string
    district?: string
    photos?: Array<any>
  }>
  onMarkerClick?: (id: string) => void
}

export function Property3DMap({ properties, onMarkerClick }: Property3DMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    let map: maplibregl.Map

    try {
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets/style.json?key=pZbOuTTgEMlz7km8AJvW`,
        center: [11.5167, 3.8667], // Centre du Cameroun
        zoom: 11, // Zoom ville au lieu de pays
        pitch: 60, // Vue 3D inclinée
        bearing: -20,
        maxPitch: 85,
        antialias: true,
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

    map.on("error", (e: any) => {
      console.error("[Map] Erreur:", e.error?.message || e.message || e)
    })

    // Ajouter les bâtiments 3D quand la carte est chargée
    map.on("load", () => {
      setMapReady(true)
      try {
        // Couche 3D des bâtiments avec MapTiler - s'affiche au zoom 14+
        // Style inspiré de leafmap (lightgray -> royalblue -> lightblue)
        map.addLayer({
          id: "3d-buildings",
          source: "openmaptiles",
          "source-layer": "building",
          type: "fill-extrusion",
          minzoom: 14,
          paint: {
            "fill-extrusion-color": [
              "interpolate",
              ["linear"],
              ["get", "render_height"],
              0, "lightgray",
              200, "royalblue",
              400, "lightblue",
            ],
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              14, 0,
              15.5, ["get", "render_height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              14, 0,
              15, ["get", "render_min_height"],
            ],
            "fill-extrusion-opacity": 0.85,
          },
        })

        // Couche de contour des bâtiments pour plus de relief
        map.addLayer({
          id: "3d-buildings-outline",
          source: "openmaptiles",
          "source-layer": "building",
          type: "line",
          minzoom: 14,
          paint: {
            "line-color": "#1e3a5f",
            "line-width": 0.5,
            "line-opacity": 0.4,
          },
          layout: {
            "line-join": "round",
          },
        })
      } catch (e: any) {
        console.warn("[Map] Couche 3D non disponible:", e?.message || e)
      }
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

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

      // Custom HTML marker with price badge
      const el = document.createElement("div")
      el.style.cssText = `
        background: rgba(26, 26, 26, 0.95);
        color: white;
        padding: 4px 10px;
        border-radius: 16px;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        cursor: pointer;
        box-shadow: 0 3px 8px rgba(0,0,0,0.35);
        border: 2px solid white;
        transition: transform 0.2s ease;
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        pointer-events: auto;
      `
      el.textContent = prop.price ? `${(prop.price / 1000).toFixed(0)}k FCFA` : "Voir"
      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.15)"
        el.style.zIndex = "1000"
      })
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)"
        el.style.zIndex = ""
      })
      el.addEventListener("click", () => {
        const id = prop.ad_id || prop.id || ""
        if (id && onMarkerClick) onMarkerClick(id)
      })

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

    if (validProps.length > 1) {
      mapRef.current.fitBounds(bounds, {
        padding: 80,
        maxZoom: 15,
        pitch: 60,
        bearing: -20,
      })
    } else if (validProps.length === 1) {
      mapRef.current.flyTo({
        center: [validProps[0].longitude!, validProps[0].latitude!],
        zoom: 14,
        pitch: 60,
        bearing: -20,
      })
    }
  }, [properties, onMarkerClick])

  useEffect(() => {
    if (mapRef.current) {
      if (mapRef.current.loaded()) {
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
