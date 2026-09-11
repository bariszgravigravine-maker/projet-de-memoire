"use client"

import { useEffect, useRef, useCallback } from "react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

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
  const popupsRef = useRef<maplibregl.Popup[]>([])

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-layer",
            type: "raster",
            source: "osm-tiles",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [11.5167, 3.8667], // Centre du Cameroun
      zoom: 6,
      pitch: 45, // Vue 3D inclinée
      bearing: -20, // Léger décalage
      maxPitch: 80,
      antialias: true,
    })

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right")
    map.addControl(new maplibregl.ScaleControl(), "bottom-left")
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
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
      const price = prop.price ? `${Number(prop.price).toLocaleString("fr-FR")} FCFA` : ""

      // Custom HTML marker with price badge
      const el = document.createElement("div")
      el.style.cssText = `
        background: rgba(26, 26, 26, 0.95);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 2px solid white;
        transition: transform 0.2s ease;
        backdrop-filter: blur(4px);
      `
      el.textContent = prop.price ? `${(prop.price / 1000).toFixed(0)}k` : "•"
      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.15)"
      })
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)"
      })
      el.addEventListener("click", () => {
        const id = prop.ad_id || prop.id || ""
        if (id && onMarkerClick) onMarkerClick(id)
      })

      const popup = new maplibregl.Popup({ offset: 30, closeButton: true, maxWidth: "280px" }).setHTML(`
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 0; overflow: hidden; border-radius: 12px;">
          <div style="width: 100%; height: 120px; overflow: hidden; border-radius: 8px 8px 0 0;">
            <img src="${img}" alt="${prop.title || "Bien"}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <div style="padding: 10px 12px;">
            <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #1a1a1a; line-height: 1.3;">
              ${prop.title || "Annonce"}
            </h3>
            <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #1a1a1a;">
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
      mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 14 })
    } else if (validProps.length === 1) {
      mapRef.current.flyTo({
        center: [validProps[0].longitude!, validProps[0].latitude!],
        zoom: 13,
        pitch: 45,
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
    <div
      ref={mapContainer}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    />
  )
}
