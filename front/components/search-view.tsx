"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, SlidersHorizontal, MapPin, X, LayoutDashboard, Sparkles, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAds, agentSearch } from "@/lib/api"
import { Property3DMap } from "@/components/property-3d-map"
import { Skeleton } from "@/components/skeleton"

const POPULAR_CITIES = ["Yaoundé", "Douala", "Bafoussam", "Bamenda", "Garoua", "Kribi", "Buea", "Limbe"]
const PROPERTY_TYPES = ["Tous", "maison", "appartement", "studio", "chambre", "villa", "terrain", "bureau"]

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
  const [showPanel, setShowPanel] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null)
  const [aiMode, setAiMode] = useState(false)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const hasFetchedRef = useRef(false)

  const handleSearch = useCallback(async () => {
    setLoading(true)
    setSearched(true)
    setAiResponse(null)
    try {
      const params: Record<string, string | number> = {}
      if (query.trim()) params.city = query.trim()
      if (type !== "Tous") params.type = type
      if (priceMin) params.priceMin = Number(priceMin)
      if (priceMax) params.priceMax = Number(priceMax)
      if (bedroomsMin) params.bedroomsMin = Number(bedroomsMin)

      const json = await getAds(params)
      const data = json.data?.results || json.results || []
      setResults(data)
    } catch (err: any) {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query, type, priceMin, priceMax, bedroomsMin])

  const handleAiSearch = useCallback(async () => {
    if (!query.trim()) return
    setAiLoading(true)
    setSearched(true)
    setLoading(true)
    setAiResponse(null)
    try {
      const json = await agentSearch(query.trim())
      const data = json.data?.results || json.results || []
      setResults(data)
      setAiResponse(json.data?.response || json.response || null)
    } catch (err: any) {
      setResults([])
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

  const handleMarkerClick = useCallback((id: string) => {
    const prop = results.find((r) => (r.ad_id || r.id) === id)
    if (prop) {
      setSelectedProperty(prop)
      setShowPanel(true)
    }
  }, [results])

  const formatPrice = (price: any) => {
    const n = Number(price)
    if (isNaN(n)) return ""
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M FCFA`
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k FCFA`
    return `${n} FCFA`
  }

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Full-screen 3D Map */}
      <Property3DMap
        properties={results}
        onMarkerClick={handleMarkerClick}
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

          <div className="flex-1 max-w-2xl flex items-center gap-2 bg-white/90 backdrop-blur rounded-full px-4 py-2.5 shadow-lg">
            {aiMode ? (
              <Sparkles size={16} className="text-amber-500 shrink-0" />
            ) : (
              <Search size={16} className="text-stone-500 shrink-0" />
            )}
            <input
              className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-400 outline-none min-w-0"
              placeholder={aiMode ? "Décrivez votre bien idéal en langage naturel..." : "Rechercher par ville, quartier..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (aiMode ? handleAiSearch() : handleSearch())}
            />
            {query && (
              <button onClick={() => { setQuery(""); setAiResponse(null); }} className="text-stone-400 hover:text-stone-600 shrink-0">
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

        {/* AI Response banner */}
        {aiResponse && (
          <div className="mx-4 mt-2 max-w-2xl pointer-events-auto anim-fade-up">
            <div className="p-4 rounded-2xl bg-white/95 backdrop-blur shadow-lg">
              <div className="flex items-start gap-2">
                <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-amber-600 mb-1">Assistant IA</p>
                  <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{aiResponse}</p>
                </div>
                <button onClick={() => setAiResponse(null)} className="text-stone-400 hover:text-stone-600 shrink-0">
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
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="flex-1 py-2.5 rounded-full bg-stone-800 text-white text-sm font-semibold hover:bg-stone-700 transition-colors"
                >
                  Appliquer les filtres
                </button>
                <button
                  onClick={() => { setQuery(""); setType("Tous"); setPriceMin(""); setPriceMax(""); setBedroomsMin(""); }}
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
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
            {POPULAR_CITIES.map((city) => (
              <button
                key={city}
                onClick={() => { setQuery(city); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 backdrop-blur shadow-lg text-sm font-medium text-stone-700 hover:bg-white transition-colors"
              >
                <MapPin size={14} className="text-stone-500" />
                {city}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Side panel with results list */}
      {searched && !loading && results.length > 0 && (
        <div className={cn(
          "absolute left-0 top-16 bottom-0 z-10 transition-transform duration-300 pointer-events-auto",
          showPanel ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="h-full w-80 sm:w-96 bg-white/95 backdrop-blur shadow-xl flex flex-col">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-800">
                {results.length} bien(s) trouvé(s)
              </h3>
              <button
                onClick={() => setShowPanel(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X size={16} className="text-stone-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {results.map((ad) => {
                const photos = Array.isArray(ad.photos)
                  ? ad.photos.map((p: any) => p?.url || p).filter(Boolean)
                  : []
                const img = photos[0] || "/images/house-1.jpg"
                return (
                  <div
                    key={ad.ad_id || ad.id}
                    onClick={() => router.push(`/annonce/${ad.ad_id || ad.id}`)}
                    onMouseEnter={() => setSelectedProperty(ad)}
                    className={cn(
                      "flex gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      selectedProperty?.ad_id === ad.ad_id
                        ? "border-stone-800 bg-stone-50"
                        : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                    )}
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={img}
                        alt={ad.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const el = e.currentTarget
                          if (!el.dataset.fb) {
                            el.dataset.fb = "1"
                            el.src = "/images/house-1.jpg"
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="font-semibold text-stone-800 text-sm truncate">{ad.title}</p>
                      <p className="text-xs text-stone-500 mt-0.5 truncate">
                        <MapPin size={10} className="inline mr-1" />
                        {[ad.district, ad.city].filter(Boolean).join(", ")}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                        {ad.bedrooms != null && <span>{ad.bedrooms} ch.</span>}
                        {ad.bathrooms != null && <span>{ad.bathrooms} sdb</span>}
                      </div>
                      <p className="text-sm font-bold text-stone-800 mt-1 truncate">
                        {formatPrice(ad.price)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Toggle panel button when hidden */}
      {searched && !loading && results.length > 0 && !showPanel && (
        <button
          onClick={() => setShowPanel(true)}
          className="absolute left-4 top-20 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-lg hover:bg-white transition-colors pointer-events-auto"
        >
          <Search size={18} className="text-stone-700" />
        </button>
      )}

      {/* No results */}
      {searched && !loading && results.length === 0 && (
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
