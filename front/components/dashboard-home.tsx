"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Search, Heart, BedDouble, Bath, MapPin, SlidersHorizontal, Plus,
  Sparkles, ChevronLeft, MessageSquare, Eye, Star
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getAds, getRecommendations, addFavorite, removeFavorite, listFavorites } from "@/lib/api"
import { SkeletonGrid } from "@/components/skeleton"
import confetti from "canvas-confetti"

const TAGS = ["Tous", "maison", "appartement", "studio", "villa", "terrain", "bureau", "magasin"]

const FALLBACK_IMAGES = [
  "/images/house-1.jpg",
  "/images/house-2.jpg",
  "/images/house-3.jpg",
  "/images/house-4.jpg",
  "/images/house-5.jpg",
  "/images/house-6.jpg",
]

function getPropertyImage(ad: any, index: number) {
  if (ad.photos && ad.photos.length > 0) {
    const url = ad.photos[0].url || ad.photos[0]
    if (url && !url.startsWith("data:")) return url
  }
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
}

export function DashboardHome() {
  const router = useRouter()
  const [activeTag, setActiveTag] = useState("Tous")
  const [searchQuery, setSearchQuery] = useState("")
  const [ads, setAds] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [likedAds, setLikedAds] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchAds = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = {}
      if (activeTag !== "Tous") params.type = activeTag
      if (searchQuery.trim()) params.city = searchQuery.trim()
      const json = await getAds(params)
      const data = json.data?.results || json.results || []
      setAds(data)
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des annonces")
    } finally {
      setLoading(false)
    }
  }, [activeTag, searchQuery])

  const fetchRecommendations = useCallback(async () => {
    try {
      const json = await getRecommendations()
      const data = json.data?.results || json.data || json.results || []
      setRecommendations(Array.isArray(data) ? data.slice(0, 4) : [])
    } catch (err) {}
  }, [])

  useEffect(() => {
    fetchAds()
    fetchRecommendations()
  }, [fetchAds, fetchRecommendations])

  useEffect(() => {
    async function loadFavorites() {
      try {
        const json = await listFavorites()
        const favs = json.data || json || []
        if (Array.isArray(favs)) {
          setLikedAds(new Set(favs.map((f: any) => f.ad_id || f.id)))
        }
      } catch {}
    }
    loadFavorites()
  }, [])

  const toggleLike = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const wasLiked = likedAds.has(id)
    setLikedAds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    if (!wasLiked && e) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const x = (rect.left + rect.width / 2) / window.innerWidth
      const y = (rect.top + rect.height / 2) / window.innerHeight
      const colors = ["#ef4444", "#f87171", "#fca5a5", "#fecaca", "#ffffff"]
      confetti({
        particleCount: 30, spread: 45, origin: { x, y }, colors,
        startVelocity: 25, gravity: 0.6, scalar: 0.8, ticks: 150,
        shapes: ["circle"], disableForReducedMotion: true,
      })
      setTimeout(() => {
        confetti({
          particleCount: 15, spread: 60, origin: { x, y: y - 0.05 }, colors,
          startVelocity: 15, gravity: 0.5, scalar: 0.6, ticks: 120,
          shapes: ["circle"], disableForReducedMotion: true,
        })
      }, 100)
    }
    try {
      if (wasLiked) await removeFavorite(id)
      else await addFavorite(id)
    } catch (err) {
      setLikedAds((prev) => {
        const next = new Set(prev)
        if (wasLiked) next.add(id)
        else next.delete(id)
        return next
      })
    }
  }

  const formatLocation = (ad: any) => {
    const parts = [ad.district, ad.city].filter(Boolean)
    return parts.length ? parts.join(", ") : "Cameroun"
  }

  const formatPrice = (price: any) => {
    if (!price) return "N/A"
    return Number(price).toLocaleString("fr-FR")
  }

  const selected = ads.find(a => (a.ad_id || a.id) === selectedId)

  return (
    <div className="flex flex-col gap-6 anim-fade-up">
      {/* Search + Filter row */}
      <div className="flex items-center gap-3" style={{ animationDelay: "60ms" }}>
        <div className="flex-1 flex items-center gap-3 bg-muted rounded-full px-4 py-3">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
            placeholder="Rechercher votre bien immobilier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchAds()}
          />
        </div>
        <button
          onClick={fetchAds}
          className="flex items-center gap-2 bg-foreground text-background text-[13px] font-semibold px-4 py-3 rounded-full hover:bg-foreground/90 transition-colors"
        >
          <SlidersHorizontal size={14} />
          <span className="hidden sm:inline">Filtrer</span>
        </button>
      </div>

      {/* Tag filters */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1" style={{ animationDelay: "120ms" }}>
        {TAGS.map((tag, i) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-[12.5px] font-medium border anim-fade-up",
              activeTag === tag
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-foreground border-border hover:bg-muted"
            )}
            style={{
              animationDelay: `${120 + i * 30}ms`,
              transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.14s cubic-bezier(0.34,1.56,0.64,1)",
            }}
            onMouseDown={e => (e.currentTarget.style.transform = "scale(0.92)")}
            onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Main content: list + detail panel */}
      <div className="flex gap-6 flex-1">
        {/* Left column: property grid */}
        <div className={cn("flex-1 min-w-0", selected ? "lg:max-w-[60%]" : "")}>
          {/* Section label */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-foreground">
              Annonces récentes
              <span className="ml-2 text-[12px] font-normal text-muted-foreground">{ads.length} trouvées</span>
            </h2>
            <button
              onClick={() => router.push("/annonce/publier")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-[12px] font-semibold hover:bg-foreground/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Publier</span>
            </button>
          </div>

          {/* Loading */}
          {loading && <SkeletonGrid count={6} />}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[14px] font-semibold text-foreground">{error}</p>
              <p className="text-[12px] text-muted-foreground mt-1">Vérifiez que le backend est démarré</p>
              <button onClick={fetchAds} className="mt-4 px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium hover:bg-foreground/90 transition-colors">
                Réessayer
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && ads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Heart size={36} className="text-muted-foreground mb-3" />
              <p className="text-[14px] font-semibold text-foreground">Aucune annonce trouvée</p>
              <p className="text-[12px] text-muted-foreground mt-1">Essayez d'autres filtres ou villes</p>
            </div>
          )}

          {/* Grid — demo mobile style cards */}
          {!loading && !error && ads.length > 0 && (
            <div className={cn(
              "grid gap-4",
              selected ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
            )}>
              {ads.map((ad, i) => {
                const adId = ad.ad_id || ad.id
                const img = getPropertyImage(ad, i)
                const isLiked = likedAds.has(adId)
                const isSelected = selectedId === adId
                return (
                  <div
                    key={adId}
                    onClick={() => setSelectedId(isSelected ? null : adId)}
                    className={cn(
                      "group rounded-2xl overflow-hidden bg-card border cursor-pointer anim-fade-up",
                      isSelected ? "border-foreground shadow-lg ring-2 ring-foreground/10" : "border-border"
                    )}
                    style={{
                      animationDelay: `${i * 55}ms`,
                      transition: "transform 0.24s cubic-bezier(0.22,1,0.36,1), box-shadow 0.24s ease, border-color 0.2s ease",
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"
                        ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)"
                      }
                    }}
                    onMouseLeave={e => {
                      ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
                      ;(e.currentTarget as HTMLDivElement).style.boxShadow = isSelected ? "" : "none"
                    }}
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden" style={{ height: 176 }}>
                      <Image
                        src={img}
                        alt={ad.title || "Bien immobilier"}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      {/* Heart button */}
                      <button
                        onClick={(e) => toggleLike(adId, e)}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/85 backdrop-blur-sm rounded-full shadow-sm transition-transform hover:scale-110 z-10"
                      >
                        <Heart
                          size={14}
                          className={isLiked ? "fill-red-500 text-red-500" : "text-foreground/60"}
                        />
                      </button>
                      {/* Property type badge */}
                      {ad.property_type && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                          <span>{ad.property_type}</span>
                        </div>
                      )}
                      {/* View count badge */}
                      {ad.view_count > 0 && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                          <Eye size={9} />
                          <span>{ad.view_count}</span>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-3.5">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-bold text-foreground leading-tight truncate">{ad.title || "Bien immobilier"}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-muted-foreground shrink-0" />
                            <span className="text-[11px] text-muted-foreground truncate">{formatLocation(ad)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground">
                        {ad.bedrooms != null && (
                          <span className="flex items-center gap-1"><BedDouble size={12} />{ad.bedrooms} ch.</span>
                        )}
                        {ad.bathrooms != null && (
                          <span className="flex items-center gap-1"><Bath size={12} />{ad.bathrooms} sdb</span>
                        )}
                        {ad.area && (
                          <span className="flex items-center gap-1">{ad.area} m²</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[14px] font-bold text-foreground">
                          {formatPrice(ad.price)}
                          <span className="text-[11px] font-normal text-muted-foreground ml-1">FCFA{ad.transaction_type === "location" ? "/mois" : ""}</span>
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedId(adId) }}
                          className="bg-foreground text-background text-[11px] font-semibold px-3 py-1.5 rounded-full hover:bg-foreground/90 transition-colors"
                        >
                          Détails
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column: detail panel — demo mobile style */}
        {selected && (
          <div className="hidden lg:flex w-[360px] shrink-0 flex-col rounded-2xl overflow-hidden border border-border bg-card shadow-xl h-fit sticky top-24 anim-slide-right">
            {/* Hero */}
            <div className="relative overflow-hidden" style={{ height: 208 }}>
              <Image
                src={getPropertyImage(selected, 0)}
                alt={selected.title || "Bien immobilier"}
                fill
                sizes="360px"
                className="object-cover"
                priority
              />
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-white/90 transition-colors"
              >
                <ChevronLeft size={18} className="text-foreground" />
              </button>
              {selected.property_type && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/50 backdrop-blur-sm text-white">
                  {selected.property_type}
                </div>
              )}
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Title row */}
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="text-[18px] font-bold text-foreground leading-tight">{selected.title || "Bien immobilier"}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{formatLocation(selected)}</p>
                </div>
                <button
                  onClick={(e) => toggleLike(selected.ad_id || selected.id, e)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors shrink-0"
                >
                  <Heart
                    size={15}
                    className={likedAds.has(selected.ad_id || selected.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}
                  />
                </button>
              </div>

              {/* Price + stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  {selected.bedrooms != null && (
                    <span className="flex items-center gap-1"><BedDouble size={13} />{selected.bedrooms} ch.</span>
                  )}
                  {selected.bathrooms != null && (
                    <span className="flex items-center gap-1"><Bath size={13} />{selected.bathrooms} sdb</span>
                  )}
                  {selected.area && (
                    <span>{selected.area} m²</span>
                  )}
                </div>
                <span className="text-[16px] font-bold text-foreground">
                  {formatPrice(selected.price)}
                  <span className="text-[11px] font-normal text-muted-foreground ml-1">FCFA{selected.transaction_type === "location" ? "/mois" : ""}</span>
                </span>
              </div>

              <div className="border-t border-border" />

              {/* Description */}
              {selected.description && (
                <div>
                  <p className="text-[12px] font-semibold text-foreground mb-1.5">Description</p>
                  <p className="text-[11.5px] text-muted-foreground leading-relaxed line-clamp-4">
                    {selected.description}
                  </p>
                </div>
              )}

              {/* Agent */}
              {selected.owner_first_name && (
                <div>
                  <p className="text-[12px] font-semibold text-foreground mb-3">Agent</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-border shrink-0 bg-muted flex items-center justify-center">
                        <span className="text-[14px] font-bold text-foreground">
                          {selected.owner_first_name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-foreground">{selected.owner_first_name} {selected.owner_last_name || ""}</p>
                        <p className="text-[10px] text-muted-foreground">{selected.owner_phone || "Agent immobilier"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/chat?ad_id=${selected.ad_id || selected.id}`)}
                        className="w-8 h-8 flex items-center justify-center border border-border rounded-full hover:bg-muted transition-colors"
                      >
                        <MessageSquare size={13} className="text-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => router.push(`/annonce/${selected.ad_id || selected.id}`)}
                className="w-full bg-foreground text-background font-semibold text-[13.5px] py-3.5 rounded-full hover:bg-foreground/90 transition-opacity"
              >
                Voir l'annonce complète
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations IA */}
      {recommendations.length > 0 && !loading && !error && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-foreground" />
            <h2 className="text-[15px] font-bold text-foreground">Recommandé pour vous</h2>
          </div>
          <div className={cn(
            "grid gap-4",
            "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
          )}>
            {recommendations.map((ad, i) => {
              const adId = ad.ad_id || ad.id
              const img = getPropertyImage(ad, i)
              return (
                <div
                  key={adId || i}
                  onClick={() => router.push(`/annonce/${adId}`)}
                  className="group rounded-2xl overflow-hidden bg-card border border-border cursor-pointer anim-fade-up hover:shadow-lg transition-shadow"
                  style={{ animationDelay: `${i * 55}ms` }}
                >
                  <div className="relative overflow-hidden" style={{ height: 140 }}>
                    <Image
                      src={img}
                      alt={ad.title || "Bien"}
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-[12.5px] font-bold text-foreground truncate">{ad.title || "Bien immobilier"}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground truncate">{formatLocation(ad)}</span>
                    </div>
                    <p className="text-[13px] font-bold text-foreground mt-2">
                      {formatPrice(ad.price)}
                      <span className="text-[10px] font-normal text-muted-foreground ml-1">FCFA</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
