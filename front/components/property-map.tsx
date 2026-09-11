"use client"

import { useEffect, useRef } from "react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

interface PropertyMapProps {
  properties: Array<{
    ad_id?: string
    id?: string
    title?: string
    price?: number
    latitude?: number
    longitude?: number
    city?: string
    district?: string
  }>
  onMarkerClick?: (id: string) => void
  height?: string
}

export function PropertyMap({ properties, onMarkerClick, height = "400px" }: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

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
    })

    map.addControl(new maplibregl.NavigationControl(), "top-right")
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
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
      const el = document.createElement("div")
      el.style.cssText = `
        background: #1a1a1a;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        border: 2px solid white;
      `
      el.textContent = prop.price
        ? `${(prop.price / 1000).toFixed(0)}k`
        : "•"

      el.addEventListener("click", () => {
        const id = prop.ad_id || prop.id || ""
        if (id && onMarkerClick) onMarkerClick(id)
      })

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([prop.longitude!, prop.latitude!])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            `<div style="font-family: system-ui; padding: 4px;">
              <strong>${prop.title || "Annonce"}</strong>
              <br/>
              <span style="color: #666; font-size: 12px;">
                ${prop.price?.toLocaleString("fr-FR") || ""} FCFA
              </span>
              <br/>
              <span style="color: #999; font-size: 11px;">
                ${[prop.district, prop.city].filter(Boolean).join(", ")}
              </span>
            </div>`
          )
        )
        .addTo(mapRef.current!)

      markersRef.current.push(marker)
      bounds.extend([prop.longitude!, prop.latitude!])
    })

    if (validProps.length > 1) {
      mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 14 })
    } else if (validProps.length === 1) {
      mapRef.current.flyTo({
        center: [validProps[0].longitude!, validProps[0].latitude!],
        zoom: 13,
      })
    }
  }, [properties, onMarkerClick])

  return (
    <div
      ref={mapContainer}
      style={{ height, width: "100%", borderRadius: "16px", overflow: "hidden" }}
      className="border border-border"
    />
  )
}
