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
        // Style "backdrop" très épuré, recoloré en blanc pur + noir (voir plus bas)
        style: `https://api.maptiler.com/maps/backdrop/style.json?key=pZbOuTTgEMlz7km8AJvW`,
        center: DEFAULT_CENTER, // Yaoundé (centre-ville)
        zoom: CITY_ZOOM, // Zoom "ville" pour voir directement les immeubles en 3D
        pitch: 60, // Vue 3D inclinée
        bearing: -17,
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

    // Recolore le style en noir & blanc pur + ajoute les bâtiments 3D noirs
    map.on("load", () => {
      setMapReady(true)
      try {
        const style = map.getStyle()
        const layers: any[] = style?.layers || []

        // ── Sol blanc bien blanc ──
        for (const layer of layers) {
          if (layer.id === "3d-buildings") continue
          if (layer.type === "background") {
            map.setPaintProperty(layer.id, "background-color", "#ffffff")
          } else if (layer.type === "fill") {
            // Terrain, eau, parcs, emprises 2D des bâtiments : tout en blanc
            map.setPaintProperty(layer.id, "fill-color", "#ffffff")
            map.setPaintProperty(layer.id, "fill-opacity", 1)
          } else if (layer.type === "hillshade") {
            map.setLayoutProperty(layer.id, "visibility", "none")
          } else if (layer.type === "line") {
            const id = String(layer.id).toLowerCase()
            if (id.includes("border")) {
              map.setPaintProperty(layer.id, "line-color", "#b5b5b5")
            } else {
              // Routes, chemins, voies ferrées : gris clair discret
              map.setPaintProperty(layer.id, "line-color", "#d9d9d9")
            }
          } else if (layer.type === "symbol") {
            // Libellés en noir sur halo blanc
            if (map.getLayoutProperty(layer.id, "text-field")) {
              map.setPaintProperty(layer.id, "text-color", "#1a1a1a")
              map.setPaintProperty(layer.id, "text-halo-color", "#ffffff")
              map.setPaintProperty(layer.id, "text-halo-width", 1)
            }
            if (map.getLayoutProperty(layer.id, "icon-image")) {
              map.setPaintProperty(layer.id, "icon-color", "#1a1a1a")
            }
          }
        }

        // ── Ciel blanc pour une vue inclinée totalement épurée ──
        map.setSky({
          "sky-color": "#ffffff",
          "sky-horizon-blend": 0.8,
          "horizon-color": "#f7f7f7",
          "horizon-fog-blend": 0.6,
          "fog-color": "#ffffff",
          "fog-ground-blend": 0.8,
        })

        // Éclairage doux : donne juste assez de relief aux faces des cubes
        // noirs sans les délaver
        map.setLight({
          anchor: "viewport",
          color: "#ffffff",
          intensity: 0.5,
          position: [1.5, 90, 45],
        })

        // Insère la couche des bâtiments juste avant les libellés pour que
        // les noms de rues/quartiers restent lisibles au-dessus des toits
        const labelLayerId = layers.find(
          (l: any) => l.type === "symbol" && l.layout?.["text-field"]
        )?.id

        // ── Bâtiments 3D : noir intégral, sans dégradé ni contour ──
        map.addLayer(
          {
            id: "3d-buildings",
            source: "maptiler_planet",
            "source-layer": "building",
            type: "fill-extrusion",
            minzoom: 13,
            // Exclure les éléments marqués hide_3d (p.ex. toits stylisés) sans
            // rejeter les bâtiments qui n'ont pas ce champ (null != true)
            filter: ["all", ["!=", ["get", "hide_3d"], true]],
            layout: {
              // Coins arrondis : rendu moins "boîte à chaussures"
              "fill-extrusion-rounded-corner-distance": 0.5,
            },
            paint: {
              "fill-extrusion-color": "#0a0a0a",
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                13, 0,
                14.5, ["get", "render_height"],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                13, 0,
                14, ["get", "render_min_height"],
              ],
              "fill-extrusion-opacity": 1,
              "fill-extrusion-vertical-gradient": false,
            },
          },
          labelLayerId
        )
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

    if (focusProps.length > 1) {
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
