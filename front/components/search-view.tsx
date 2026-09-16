"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, SlidersHorizontal, MapPin, X, LayoutDashboard, Sparkles, Send, Navigation, LocateFixed, Crosshair, ChevronRight, Bed, Bath, GripHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAds, agentSearch, listPreferences } from "@/lib/api"
import { Property3DMap } from "@/components/property-3d-map"

const POPULAR_CITIES = ["Yaoundé", "Douala", "Bafoussam", "Bamenda", "Garoua", "Kribi", "Buea", "Limbe", "Bertoua", "Maroua", "Ngaoundéré", "Ebolowa"]
const PROPERTY_TYPES = ["Tous", "maison", "appartement", "studio", "chambre", "villa", "terrain", "bureau"]

// Quartiers populaires de Yaoundé et Douala (pour la recherche par place)
const POPULAR_DISTRICTS = [
  "Bastos", "Bonas", "Ngoa-Ekellé", "Mvan", "Ekie", "Mfandena", "Omnisport", "Etoudi", "Tsinga", "Ekounou",
  "Bonapriso", "Akwa", "Bonanjo", "Bonamoussadi", "Deido", "Bepanda", "Logbaba", "Makepe",
]

interface PreferenceOption {
  code: string
  label: string
  icon?: string
  category?: string
}

// Repli si l'API des préférences est indisponible (mêmes codes que le backend)
const FALLBACK_PREFERENCES: PreferenceOption[] = [
  { code: "ecole", label: "Proche école", category: "education" },
  { code: "lycee", label: "Proche lycée", category: "education" },
  { code: "universite", label: "Proche université", category: "education" },
  { code: "hopital", label: "Proche hôpital", category: "sante" },
  { code: "pharmacie", label: "Proche pharmacie", category: "sante" },
  { code: "centre_ville", label: "Proche centre-ville", category: "commodites" },
  { code: "marche", label: "Proche marché", category: "commodites" },
  { code: "transport", label: "Proche transport", category: "commodites" },
  { code: "banque", label: "Proche banque", category: "commodites" },
  { code: "commissariat", label: "Proche commissariat", category: "securite" },
  { code: "mosquee", label: "Proche mosquée", category: "spiritualite" },
  { code: "eglise", label: "Proche église", category: "spiritualite" },
]

interface MapActions {
  flyToProperty: (lat: number, lon: number, title?: string) => void
  flyToZone: (lat: number, lon: number, radiusKm?: number) => void
  getUserPosition: () => [number, number] | null
  setUserPosition: (lon: number, lat: number) => void
  setSuppressAutoFit: (v: boolean) => void
}

export function SearchView() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [type, setType] = useState("Tous")
  const [priceMin, setPriceMin] = useState("")
  const [priceMax, setPriceMax] = useState("")
  const [bedroomsMin, setBedroomsMin] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null)
  const [routeTarget, setRouteTarget] = useState<any | null>(null)
  const [aiMode, setAiMode] = useState(false)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [zoneLoading, setZoneLoading] = useState(false)
  const [zoneInfo, setZoneInfo] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  // Préférences de proximité : catalogue + sélection courante
  const [prefOptions, setPrefOptions] = useState<PreferenceOption[]>(FALLBACK_PREFERENCES)
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([])
  // Critères interprétés par l'IA (affichés en puces sous la réponse)
  const [aiParsed, setAiParsed] = useState<any | null>(null)
  // Infos d'itinéraire remontées par Property3DMap (km, durée)
  const [routeInfo, setRouteInfo] = useState<{ km: number; min: number } | null>(null)
  const [routeInfoLoading, setRouteInfoLoading] = useState(false)
  // Déplacement de la card overlay (drag libre depuis le handle/poignée)
  const [cardOffset, setCardOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  const hasFetchedRef = useRef(false)
  const mapActionsRef = useRef<MapActions | null>(null)

  // Drag : démarre le suivi du pointeur (souris + tactile)
  const onCardDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: cardOffset.x,
      baseY: cardOffset.y,
    }
    const onMove = (ev: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      setCardOffset({
        x: d.baseX + ev.clientX - d.startX,
        y: d.baseY + ev.clientY - d.startY,
      })
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }, [cardOffset])

  const handleMapActions = useCallback((actions: MapActions) => {
    mapActionsRef.current = actions
  }, [])

  // Reçoit les infos d'itinéraire de la carte (km/min calculés par OSRM)
  const handleRouteInfo = useCallback((info: { km: number; min: number } | null, loading: boolean) => {
    setRouteInfo(info)
    setRouteInfoLoading(loading)
  }, [])

  // Charge le catalogue des préférences depuis l'API (une seule fois)
  useEffect(() => {
    let cancelled = false
    listPreferences()
      .then((json) => {
        const list = json?.data?.preferences || json?.preferences
        if (!cancelled && Array.isArray(list) && list.length > 0) setPrefOptions(list)
      })
      .catch(() => {
        // Repli silencieux sur FALLBACK_PREFERENCES
      })
    return () => { cancelled = true }
  }, [])

  const togglePref = useCallback((code: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }, [])

  // Zone search: biens autour de ma position GPS en temps réel
  const handleZoneSearch = useCallback(async () => {
    setZoneLoading(true)
    setZoneInfo(null)
    setSelectedProperty(null)
    setRouteTarget(null)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("Geolocation non supporté"))
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })
      const lon = pos.coords.longitude
      const lat = pos.coords.latitude
      const radius = 5
      // Affiche le point bleu de ma position sur la map
      mapActionsRef.current?.setUserPosition(lon, lat)
      const json = await getAds({
        centerLat: lat,
        centerLon: lon,
        radius,
      })
      const data = json.data?.results || json.results || []
      // Empêche updateMarkers de re-fitter sur la ville dominante afin que
      // flyToZone puisse conserver la vue centrée sur la position GPS.
      mapActionsRef.current?.setSuppressAutoFit(true)
      setResults(data)
      setSearched(true)
      mapActionsRef.current?.flyToZone(lat, lon, radius)
      setZoneInfo(`${data.length} bien(s) dans un rayon de ${radius} km autour de vous`)
    } catch (err: any) {
      setZoneInfo(err?.message || "Impossible d'obtenir votre position. Activez la géolocalisation.")
    } finally {
      setZoneLoading(false)
    }
  }, [])

  // Place search : tape un lieu/quartier/ville et zoome dessus avec un marqueur pin
  // Cherche à la fois par ville ET par quartier (Bastos est un quartier, pas une ville)
  // searchQuery optionnel : évite la closure périmée depuis les suggestions et chips
  const handlePlaceSearch = useCallback(async (searchQuery?: string) => {
    const q = (searchQuery ?? query).trim()
    if (!q) return
    setLoading(true)
    setSearched(true)
    setZoneInfo(null)
    setSelectedProperty(null)
    setRouteTarget(null)
    try {
      // 1) Cherche par ville
      let json = await getAds({ city: q })
      let data = json.data?.results || json.results || []

      // 2) Si aucun résultat par ville, cherche par quartier
      if (data.length === 0) {
        json = await getAds({ district: q })
        data = json.data?.results || json.results || []
      }

      // 3) Si toujours rien, cherche dans les deux (ville + quartier) avec une requête large
      if (data.length === 0) {
        // Dernier recours : récupère tous et filtre côté client
        json = await getAds()
        const all = json.data?.results || json.results || []
        const ql = q.toLowerCase()
        data = all.filter((p: any) =>
          (p.city && p.city.toLowerCase().includes(ql)) ||
          (p.district && p.district.toLowerCase().includes(ql)) ||
          (p.title && p.title.toLowerCase().includes(ql)) ||
          (p.address && p.address.toLowerCase().includes(ql))
        )
      }

      setResults(data)

      // 4) Zoome sur le premier résultat avec un marqueur pin
      if (data.length > 0 && data[0].latitude != null) {
        mapActionsRef.current?.flyToProperty(
          Number(data[0].latitude),
          Number(data[0].longitude),
          data[0].title
        )
      }
    } catch (err: any) {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query])

  const handleSearch = useCallback(async () => {
    setLoading(true)
    setSearched(true)
    setAiResponse(null)
    setSelectedProperty(null)
    setRouteTarget(null)
    try {
      const params: Record<string, string | number> = {}
      if (query.trim()) {
        // Si la query ressemble à un quartier connu, on cherche par district
        const isDistrict = POPULAR_DISTRICTS.some(d => d.toLowerCase() === query.trim().toLowerCase())
        if (isDistrict) {
          params.district = query.trim()
        } else {
          params.city = query.trim()
        }
      }
      if (type !== "Tous") params.type = type
      if (priceMin) params.priceMin = Number(priceMin)
      if (priceMax) params.priceMax = Number(priceMax)
      if (bedroomsMin) params.bedroomsMin = Number(bedroomsMin)
      // Préférences de proximité : "?preferences=lycee,hopital"
      if (selectedPrefs.length > 0) params.preferences = selectedPrefs.join(",")

      const json = await getAds(params)
      const data = json.data?.results || json.results || []
      setResults(data)
    } catch (err: any) {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query, type, priceMin, priceMax, bedroomsMin, selectedPrefs])

  const handleAiSearch = useCallback(async () => {
    if (!query.trim()) return
    setAiLoading(true)
    setSearched(true)
    setLoading(true)
    setAiResponse(null)
    setSelectedProperty(null)
    setRouteTarget(null)
    try {
      const json = await agentSearch(query.trim())
      const payload = json.data || json
      const data = payload.results || []
      setResults(data)
      setAiResponse(payload.response || null)
      // Critères compris par l'IA (préférences, ville, quartier, budget...)
      const parsed = payload.criteria || {}
      setAiParsed(parsed)
      // Les puces de proximité reflètent ce que l'IA a détecté
      if (Array.isArray(parsed.preferences) && parsed.preferences.length > 0) {
        setSelectedPrefs(parsed.preferences)
      }
    } catch (err: any) {
      setResults([])
      setAiParsed(null)
      setAiResponse("Erreur lors de la recherche IA. Essayez la recherche avec filtres.")
    } finally {
      setAiLoading(false)
      setLoading(false)
    }
  }, [query])

  // Fetch initial results once on mount
  useEffect(() => {
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true
    handleSearch()
  }, [handleSearch])

  // Quand on clique sur un marqueur de la map → affiche l'overlay card (style Yango)
  const handleMarkerClick = useCallback((id: string) => {
    const prop = results.find((r) => (r.ad_id || r.id) === id)
    if (prop) {
      setSelectedProperty(prop)
      setCardOffset({ x: 0, y: 0 }) // recentre la card sur le nouveau bien
      // Ne trace pas l'itinéraire automatiquement, juste sélectionne
    }
  }, [results])

  // Trace l'itinéraire vers le bien sélectionné (depuis l'overlay card)
  const handleRoute = useCallback(() => {
    if (selectedProperty) {
      // En mode itinéraire, seul le bien ciblé reste sur la carte : on
      // empêche updateMarkers de re-cadrer la vue (la route fait fitBounds).
      mapActionsRef.current?.setSuppressAutoFit(true)
      setRouteTarget(selectedProperty)
    }
  }, [selectedProperty])

  // Ferme l'overlay card et nettoie l'itinéraire
  const handleCloseCard = useCallback(() => {
    setSelectedProperty(null)
    setRouteTarget(null)
    setRouteInfo(null)
    setRouteInfoLoading(false)
    setCardOffset({ x: 0, y: 0 })
  }, [])

  const formatPrice = (price: any) => {
    const n = Number(price)
    if (isNaN(n)) return ""
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M FCFA`
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k FCFA`
    return `${n} FCFA`
  }

  // Suggestions de lieux pendant la frappe
  const suggestions = query.trim().length > 0
    ? [...POPULAR_CITIES, ...POPULAR_DISTRICTS]
        .filter(s => s.toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, 6)
    : []

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Full-screen 3D Map */}
      {/* En mode itinéraire, seul le bien ciblé garde son marqueur : */}
      {/* les autres badges disparaissent pour désencombrer la carte. */}
      <Property3DMap
        properties={routeTarget ? [routeTarget] : results}
        onMarkerClick={handleMarkerClick}
        destination={routeTarget}
        onCloseRoute={() => setRouteTarget(null)}
        onViewProperty={(id) => { if (id) router.push(`/annonce/${id}`) }}
        onMapActions={handleMapActions}
        onRouteInfo={handleRouteInfo}
      />

      {/* Top bar with back button + search */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex items-center gap-3 p-4 pointer-events-auto">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-lg hover:bg-white transition-colors shrink-0"
            title="Retour au tableau de bord"
          >
            <LayoutDashboard className="w-5 h-5 text-stone-700" />
          </button>

          <div className="flex-1 max-w-2xl relative">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-full px-4 py-2.5 shadow-lg">
              {aiMode ? (
                <Sparkles size={16} className="text-amber-500 shrink-0" />
              ) : (
                <Search size={16} className="text-stone-500 shrink-0" />
              )}
              <input
                className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-400 outline-none min-w-0"
                placeholder={aiMode ? "Décrivez votre bien idéal en langage naturel..." : "Rechercher par ville, quartier, lieu..."}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setShowSuggestions(false)
                    if (aiMode) handleAiSearch()
                    else handlePlaceSearch()
                  }
                  if (e.key === "Escape") setShowSuggestions(false)
                }}
              />
              {query && (
                <button onClick={() => { setQuery(""); setAiResponse(null); setShowSuggestions(false) }} className="text-stone-400 hover:text-stone-600 shrink-0">
                  <X size={14} />
                </button>
              )}
              {aiMode && (
                <button
                  onClick={handleAiSearch}
                  disabled={aiLoading || !query.trim()}
                  className="shrink-0 p-1.5 rounded-full bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 transition-colors"
                  title="Rechercher avec l'IA"
                >
                  <Send size={14} />
                </button>
              )}
            </div>

            {/* Suggestions dropdown (villes + quartiers) */}
            {showSuggestions && suggestions.length > 0 && !aiMode && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-100">
                {suggestions.map((s) => {
                  const isDistrict = POPULAR_DISTRICTS.includes(s)
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        setQuery(s)
                        setShowSuggestions(false)
                        // Passe la suggestion directement pour éviter la closure périmée
                        handlePlaceSearch(s)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors text-left border-b border-stone-50 last:border-0"
                    >
                      <MapPin size={16} className={isDistrict ? "text-amber-500" : "text-stone-500"} />
                      <span className="text-sm text-stone-800 flex-1">{s}</span>
                      <span className="text-[10px] text-stone-400 font-medium uppercase">
                        {isDistrict ? "Quartier" : "Ville"}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Mode toggle: IA / Filtres */}
          <button
            onClick={() => { setAiMode(!aiMode); setShowFilters(!aiMode ? false : showFilters); setAiResponse(null); }}
            className={cn(
              "flex items-center gap-1.5 text-sm font-semibold px-3 py-2.5 rounded-full transition-colors shadow-lg pointer-events-auto shrink-0",
              aiMode ? "bg-amber-500 text-white" : "bg-white/90 backdrop-blur text-stone-700 hover:bg-white"
            )}
            title={aiMode ? "Mode IA activé" : "Activer la recherche IA"}
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">IA</span>
          </button>

          {/* Recherche par zone (autour de ma position GPS) */}
          <button
            onClick={handleZoneSearch}
            disabled={zoneLoading}
            className={cn(
              "flex items-center gap-1.5 text-sm font-semibold px-3 py-2.5 rounded-full transition-colors shadow-lg pointer-events-auto shrink-0",
              zoneLoading
                ? "bg-emerald-500 text-white animate-pulse"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            )}
            title="Rechercher les biens autour de ma position"
          >
            <LocateFixed size={14} />
            <span className="hidden sm:inline">{zoneLoading ? "Localisation..." : "Zone"}</span>
          </button>

          {/* Recherche par place (zoome sur un lieu précis) */}
          <button
            onClick={() => handlePlaceSearch()}
            disabled={loading || !query.trim()}
            className={cn(
              "flex items-center gap-1.5 text-sm font-semibold px-3 py-2.5 rounded-full transition-colors shadow-lg pointer-events-auto shrink-0",
              "bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-40"
            )}
            title="Localiser ce lieu précis sur la carte"
          >
            <Crosshair size={14} />
            <span className="hidden sm:inline">Place</span>
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full transition-colors shadow-lg pointer-events-auto shrink-0",
              showFilters ? "bg-stone-800 text-white" : "bg-white/90 backdrop-blur text-stone-700 hover:bg-white"
            )}
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filtres</span>
          </button>
        </div>

        {/* Zone info banner */}
        {zoneInfo && (
          <div className="mx-4 mt-2 max-w-2xl pointer-events-auto anim-fade-up">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-lg flex items-start gap-2">
              <LocateFixed size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800 flex-1">{zoneInfo}</p>
              <button onClick={() => setZoneInfo(null)} className="text-emerald-400 hover:text-emerald-600 shrink-0">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* AI Response banner */}
        {aiResponse && (
          <div className="mx-4 mt-2 max-w-2xl pointer-events-auto anim-fade-up">
            <div className="p-4 rounded-2xl bg-white/95 backdrop-blur shadow-lg">
              <div className="flex items-start gap-2">
                <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-amber-600 mb-1">Assistant IA</p>
                  <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{aiResponse}</p>
                  {/* Critères compris par l'IA */}
                  {aiParsed && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {aiParsed.preferences?.map((code: string) => {
                        const opt = prefOptions.find((p) => p.code === code)
                        return (
                          <span key={code} className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                            {opt?.label || code}
                          </span>
                        )
                      })}
                      {aiParsed.city && (
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-semibold">
                          {aiParsed.city}
                        </span>
                      )}
                      {aiParsed.district && (
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-semibold">
                          {aiParsed.district}
                        </span>
                      )}
                      {aiParsed.type && (
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-semibold capitalize">
                          {aiParsed.type}
                        </span>
                      )}
                      {aiParsed.priceMax != null && (
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-semibold">
                          ≤ {formatPrice(aiParsed.priceMax)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={() => { setAiResponse(null); setAiParsed(null) }} className="text-stone-400 hover:text-stone-600 shrink-0">
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters panel */}
        {showFilters && (
          <div className="mx-4 mt-2 max-w-2xl pointer-events-auto anim-fade-up">
            <div className="p-4 rounded-2xl bg-white/95 backdrop-blur shadow-lg space-y-3">
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Type de bien</label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        type === t
                          ? "bg-stone-800 text-white border-stone-800"
                          : "bg-transparent text-stone-700 border-stone-200 hover:bg-stone-100"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Prix min (FCFA)</label>
                  <input
                    type="number"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Prix max (FCFA)</label>
                  <input
                    type="number"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="500000"
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Chambres min</label>
                  <input
                    type="number"
                    value={bedroomsMin}
                    onChange={(e) => setBedroomsMin(e.target.value)}
                    placeholder="2"
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-300"
                  />
                </div>
              </div>
              {/* Préférences de proximité */}
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">
                  Proximité {selectedPrefs.length > 0 && `(${selectedPrefs.length})`}
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {prefOptions.map((p) => {
                    const active = selectedPrefs.includes(p.code)
                    return (
                      <button
                        key={p.code}
                        onClick={() => togglePref(p.code)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          active
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-transparent text-stone-700 border-stone-200 hover:bg-stone-100"
                        )}
                      >
                        {p.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="flex-1 py-2.5 rounded-full bg-stone-800 text-white text-sm font-semibold hover:bg-stone-700 transition-colors"
                >
                  Appliquer les filtres
                </button>
                <button
                  onClick={() => { setQuery(""); setType("Tous"); setPriceMin(""); setPriceMax(""); setBedroomsMin(""); setSelectedPrefs([]); }}
                  className="px-4 py-2.5 rounded-full bg-stone-100 text-stone-600 text-sm font-medium hover:bg-stone-200 transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {(loading || aiLoading) && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur shadow-lg">
            <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
            <span className="text-sm text-stone-700 font-medium">
              {aiLoading ? "L'IA analyse votre demande..." : "Recherche en cours..."}
            </span>
          </div>
        </div>
      )}

      {/* Popular cities floating chips */}
      {!searched && !loading && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
            {POPULAR_CITIES.map((city) => (
              <button
                key={city}
                onClick={() => { setQuery(city); handlePlaceSearch(city); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 backdrop-blur shadow-lg text-sm font-medium text-stone-700 hover:bg-white transition-colors"
              >
                <MapPin size={14} className="text-stone-500" />
                {city}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Compteur de résultats en bas (overlay discret sur la map) */}
      {searched && !loading && results.length > 0 && !selectedProperty && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="px-4 py-2 rounded-full bg-stone-900/90 backdrop-blur text-white text-sm font-semibold shadow-lg">
            {results.length} bien(s) sur la carte
          </div>
        </div>
      )}

      {/* OVERLAY CARD style Yango : preview du bien sélectionné, déplaçable */}
      {selectedProperty && (
        <div
          className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none"
          style={{ transform: `translate(${cardOffset.x}px, ${cardOffset.y}px)` }}
        >
          {/* Bouton fermer flottant au-dessus de la card */}
          <div className="flex justify-center mb-1.5 pointer-events-auto">
            <button
              onClick={handleCloseCard}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-lg hover:bg-stone-50 transition-colors"
              title="Fermer"
            >
              <X size={16} className="text-stone-700" />
            </button>
          </div>

          <div className="mx-3 mb-3 sm:mx-auto sm:max-w-xs bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-100 pointer-events-auto">
            {/* Image du bien (zone de drag) */}
            <div
              onPointerDown={onCardDragStart}
              className="relative h-28 bg-stone-100 cursor-grab active:cursor-grabbing select-none touch-none"
            >
              {(() => {
                const photos = Array.isArray(selectedProperty.photos)
                  ? selectedProperty.photos.map((p: any) => p?.url || p).filter(Boolean)
                  : []
                const img = photos[0] || "/images/house-1.jpg"
                return (
                  <img
                    src={img}
                    alt={selectedProperty.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const el = e.currentTarget
                      if (!el.dataset.fb) {
                        el.dataset.fb = "1"
                        el.src = "/images/house-1.jpg"
                      }
                    }}
                  />
                )
              })()}
              {/* Badge prix en overlay sur l'image */}
              <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-stone-900/90 backdrop-blur text-white text-xs font-bold shadow-lg">
                {formatPrice(selectedProperty.price)}
              </div>
              {/* Badge type en overlay */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur text-stone-800 text-[10px] font-semibold shadow-lg capitalize">
                {selectedProperty.property_type || ""}
              </div>
              {/* Poignée de déplacement */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-white/85 backdrop-blur shadow flex items-center justify-center">
                <GripHorizontal size={14} className="text-stone-500" />
              </div>
            </div>

            {/* Contenu de la card */}
            <div className="px-3 py-2.5 space-y-2">
              <div>
                <h3 className="text-sm font-bold text-stone-900 leading-tight line-clamp-1">
                  {selectedProperty.title}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                  <MapPin size={12} className="shrink-0" />
                  {[selectedProperty.district, selectedProperty.city].filter(Boolean).join(", ")}
                </p>
              </div>

              {/* Caractéristiques */}
              <div className="flex items-center gap-3 text-xs text-stone-600">
                {selectedProperty.bedrooms != null && (
                  <span className="flex items-center gap-1">
                    <Bed size={13} className="text-stone-400" />
                    {selectedProperty.bedrooms} ch.
                  </span>
                )}
                {selectedProperty.bathrooms != null && (
                  <span className="flex items-center gap-1">
                    <Bath size={13} className="text-stone-400" />
                    {selectedProperty.bathrooms} sdb
                  </span>
                )}
                {selectedProperty.area != null && (
                  <span className="flex items-center gap-1">
                    <span className="text-stone-400">▢</span>
                    {selectedProperty.area} m²
                  </span>
                )}
              </div>

              {/* Préférences de proximité du bien */}
              {Array.isArray(selectedProperty.preferences) && selectedProperty.preferences.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedProperty.preferences.slice(0, 4).map((p: any) => (
                    <span
                      key={p.code}
                      className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-medium"
                      title={p.note || p.label}
                    >
                      {p.label}
                    </span>
                  ))}
                  {selectedProperty.preferences.length > 4 && (
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-medium">
                      +{selectedProperty.preferences.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Actions : Itinéraire + Voir détail */}
              <div className="flex gap-2">
                <button
                  onClick={handleRoute}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors",
                    routeTarget?.ad_id === selectedProperty.ad_id
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  )}
                >
                  <Navigation size={14} />
                  {routeInfoLoading && routeTarget?.ad_id === selectedProperty.ad_id
                    ? "Calcul…"
                    : routeInfo && routeTarget?.ad_id === selectedProperty.ad_id
                    ? `${routeInfo.km.toFixed(1)} km · ${Math.round(routeInfo.min)} min`
                    : routeTarget?.ad_id === selectedProperty.ad_id
                    ? "Tracé"
                    : "Itinéraire"}
                </button>
                <button
                  onClick={() => router.push(`/annonce/${selectedProperty.ad_id || selectedProperty.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
                >
                  Voir le bien
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No results */}
      {searched && !loading && results.length === 0 && !selectedProperty && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-auto">
          <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-white/90 backdrop-blur shadow-lg">
            <MapPin size={36} className="text-stone-400 mb-3" />
            <p className="text-sm font-semibold text-stone-700">Aucun résultat</p>
            <p className="text-xs text-stone-500 mt-1">Essayez d'autres critères de recherche</p>
          </div>
        </div>
      )}
    </div>
  )
}
