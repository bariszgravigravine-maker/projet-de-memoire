"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Search, Heart, BedDouble, Bath, MapPin, SlidersHorizontal, Plus,
  Sparkles, ChevronLeft, MessageSquare, Eye, Star, Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getAds, getRecommendations, addFavorite, removeFavorite, listFavorites, openConversation, getToken } from "@/lib/api"
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
    <div className="flex flex-col gap-4 anim-fade-up">
      {/* Search bar — demo mobile style */}
      <div className="flex items-center gap-3" style={{ animationDelay: "60ms" }}>
        <div
          className="flex-1 flex items-center gap-2 bg-muted rounded-full px-4 py-2.5"
          style={{ transition: "box-shadow 0.2s ease" }}
          onFocusCapture={e => (e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,0,0,0.12)")}
          onBlurCapture={e => (e.currentTarget.style.boxShadow = "none")}
        >
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            className="flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground outline-none"
            placeholder="Rechercher votre bien immobilier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchAds()}
          />
        </div>
        <button
          onClick={fetchAds}
          className="flex items-center gap-2 bg-foreground text-background text-[12px] font-semibold px-4 py-2.5 rounded-full hover:bg-foreground/90 transition-colors"
        >
          <SlidersHorizontal size={13} />
          <span className="hidden sm:inline">Filtrer</span>
        </button>
      </div>

      {/* Tag filters — demo mobile style */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1" style={{ animationDelay: "120ms" }}>
        {TAGS.map((tag, i) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={cn(
              "shrink-0 px-3 py-1 rounded-full text-[11px] font-medium border anim-fade-up",
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

      {/* Main content: grid + detail panel */}
      <div className="flex gap-6 flex-1">
        {/* Left: property grid — 2 cols mobile, adapts on desktop */}
        <div className={cn("flex-1 min-w-0", selected ? "lg:max-w-[60%]" : "")}>
          {/* Section label */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-bold text-foreground">
              Annonces récentes
              <span className="ml-2 text-[11px] font-normal text-muted-foreground">{ads.length} trouvées</span>
            </h2>
            <button
              onClick={() => router.push("/annonce/publier")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-[11px] font-semibold hover:bg-foreground/90 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline">Publier</span>
            </button>
          </div>

          {/* Loading */}
          {loading && <SkeletonGrid count={6} />}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[13px] font-semibold text-foreground">{error}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Vérifiez que le backend est démarré</p>
              <button onClick={fetchAds} className="mt-4 px-4 py-2 bg-foreground text-background rounded-full text-[12px] font-medium hover:bg-foreground/90 transition-colors">
                Réessayer
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && ads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Heart size={28} className="text-muted-foreground mb-2" />
              <p className="text-[13px] font-semibold text-foreground">Aucune annonce trouvée</p>
              <p className="text-[11px] text-muted-foreground mt-1">Essayez d'autres filtres ou villes</p>
            </div>
          )}

          {/* Property grid — demo mobile style (2 cols, compact cards) */}
          {!loading && !error && ads.length > 0 && (
            <div className={cn(
              "grid gap-3",
              selected ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-2 xl:grid-cols-3"
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
                      "rounded-2xl overflow-hidden bg-card border cursor-pointer anim-fade-up",
                      isSelected ? "border-foreground shadow-lg ring-2 ring-foreground/10" : "border-border"
                    )}
                    style={{
                      animationDelay: `${i * 60}ms`,
                      transition: "transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease, border-color 0.2s ease",
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px) scale(1.01)"
                        ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"
                      }
                    }}
                    onMouseLeave={e => {
                      ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(0) scale(1)"
                      ;(e.currentTarget as HTMLDivElement).style.boxShadow = "none"
                    }}
                    onMouseDown={e => {
                      ;(e.currentTarget as HTMLDivElement).style.transform = "scale(0.97)"
                    }}
                    onMouseUp={e => {
                      ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px) scale(1.01)"
                    }}
                  >
                    {/* Image — compact like demo */}
                    <div className="relative overflow-hidden" style={{ height: 110 }}>
                      <Image
                        src={img}
                        alt={ad.title || "Bien immobilier"}
                        fill
                        sizes="(max-width: 768px) 50vw, 200px"
                        className="object-cover"
                        style={{ transition: "transform 0.4s ease" }}
                      />
                      {/* Heart */}
                      <button
                        onClick={e => toggleLike(adId, e)}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-white/80 rounded-full backdrop-blur-sm"
                        style={{ transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}
                        onMouseDown={e => {
                          e.stopPropagation()
                          ;(e.currentTarget as HTMLButtonElement).style.transform = "scale(0.8)"
                        }}
                        onMouseUp={e => {
                          ;(e.currentTarget as HTMLButtonElement).style.transform = "scale(1.2)"
                          setTimeout(() => {
                            if (e.currentTarget) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"
                          }, 200)
                        }}
                      >
                        <Heart
                          size={12}
                          className={isLiked ? "fill-red-500 text-red-500" : "text-foreground/60"}
                          style={{ transition: "fill 0.2s ease, color 0.2s ease" }}
                        />
                      </button>
                      {/* View count badge */}
                      {ad.view_count > 0 && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                          <Eye size={8} />
                          <span>{ad.view_count}</span>
                        </div>
                      )}
                    </div>
                    {/* Info — compact like demo */}
                    <div className="p-2">
                      <p className="text-[11.5px] font-semibold text-foreground leading-tight truncate">{ad.title || "Bien immobilier"}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={9} className="text-muted-foreground shrink-0" />
                        <span className="text-[9.5px] text-muted-foreground truncate">{formatLocation(ad)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[9.5px] text-muted-foreground">
                        {ad.bedrooms != null && (
                          <span className="flex items-center gap-0.5"><BedDouble size={10} />{ad.bedrooms}</span>
                        )}
                        {ad.bathrooms != null && (
                          <span className="flex items-center gap-0.5"><Bath size={10} />{ad.bathrooms}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] font-bold text-foreground">
                          {formatPrice(ad.price)}
                          <span className="text-[9px] font-normal text-muted-foreground ml-0.5">FCFA{ad.transaction_type === "location" ? "/mois" : ""}</span>
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedId(adId) }}
                          className="bg-foreground text-background text-[9px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), background 0.15s ease" }}
                          onMouseDown={e => { e.stopPropagation(); (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.9)" }}
                          onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)" }}
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

        {/* Right: detail panel — demo mobile style */}
        {selected && (
          <div className="hidden lg:flex w-[340px] shrink-0 flex-col rounded-2xl overflow-hidden border border-border bg-card shadow-xl h-fit sticky top-24 anim-slide-right">
            {/* Hero */}
            <div className="relative overflow-hidden" style={{ height: 200 }}>
              <Image
                src={getPropertyImage(selected, 0)}
                alt={selected.title || "Bien immobilier"}
                fill
                sizes="340px"
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

            <div className="p-4 flex flex-col gap-4">
              {/* Title row */}
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="text-[16px] font-bold text-foreground leading-tight">{selected.title || "Bien immobilier"}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatLocation(selected)}</p>
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
                    <span className="flex items-center gap-1"><BedDouble size={12} />{selected.bedrooms} ch.</span>
                  )}
                  {selected.bathrooms != null && (
                    <span className="flex items-center gap-1"><Bath size={12} />{selected.bathrooms} sdb</span>
                  )}
                  {selected.area && (
                    <span>{selected.area} m²</span>
                  )}
                </div>
                <span className="text-[15px] font-bold text-foreground">
                  {formatPrice(selected.price)}
                  <span className="text-[10px] font-normal text-muted-foreground ml-1">FCFA{selected.transaction_type === "location" ? "/mois" : ""}</span>
                </span>
              </div>

              <div className="border-t border-border" />

              {/* Description */}
              {selected.description && (
                <div>
                  <p className="text-[11px] font-semibold text-foreground mb-1.5">Description</p>
                  <p className="text-[10.5px] text-muted-foreground leading-relaxed line-clamp-4">
                    {selected.description}
                  </p>
                </div>
              )}

              {/* Agent */}
              {selected.owner_first_name && (
                <div>
                  <p className="text-[11px] font-semibold text-foreground mb-2">Agent</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-border shrink-0 bg-muted flex items-center justify-center">
                        <span className="text-[13px] font-bold text-foreground">
                          {selected.owner_first_name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-foreground">{selected.owner_first_name} {selected.owner_last_name || ""}</p>
                        <p className="text-[9px] text-muted-foreground">{selected.owner_phone || "Agent immobilier"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          // Chat 1:1 avec l'annonceur — pas le chat IA (/chat)
                          if (!getToken()) {
                            router.push(`/auth?redirect=/dashboard`)
                            return
                          }
                          // On ne peut pas discuter avec soi-même : si le bien
                          // appartient au compte connecté, on le signale au lieu
                          // d'atterrir sur une messagerie vide.
                          const me = (() => {
                            try { return JSON.parse(localStorage.getItem("immo_user") || "null") } catch { return null }
                          })()
                          if (!selected.owner_id) {
                            router.push(`/annonce/${selected.ad_id || selected.id}`)
                            return
                          }
                          if (me?.id && selected.owner_id === me.id) {
                            alert("Cette annonce vous appartient — vous ne pouvez pas vous envoyer de message.")
                            return
                          }
                          try {
                            const res = await openConversation(selected.owner_id)
                            const conv = res.data || res
                            const convId = conv.id || conv.conversation_id
                            router.push(convId ? `/messages?conversationId=${convId}` : "/messages")
                          } catch (err: any) {
                            // Ne plus tomber silencieusement sur une page vide :
                            // l'utilisateur voit pourquoi (ex: token expiré).
                            alert(err?.message || "Impossible d'ouvrir la conversation")
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center border border-border rounded-full hover:bg-muted transition-colors"
                      >
                        <MessageSquare size={12} className="text-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => router.push(`/annonce/${selected.ad_id || selected.id}`)}
                className="w-full bg-foreground text-background font-semibold text-[12px] py-3 rounded-full hover:bg-foreground/90 transition-opacity"
              >
                Voir l'annonce complète
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations IA */}
      {recommendations.length > 0 && !loading && !error && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-foreground" />
            <h2 className="text-[13px] font-bold text-foreground">Recommandé pour vous</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recommendations.map((ad, i) => {
              const adId = ad.ad_id || ad.id
              const img = getPropertyImage(ad, i)
              return (
                <div
                  key={adId || i}
                  onClick={() => router.push(`/annonce/${adId}`)}
                  className="rounded-2xl overflow-hidden bg-card border border-border cursor-pointer anim-fade-up"
                  style={{
                    animationDelay: `${i * 60}ms`,
                    transition: "transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease",
                  }}
                  onMouseEnter={e => {
                    ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px) scale(1.01)"
                    ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(0) scale(1)"
                    ;(e.currentTarget as HTMLDivElement).style.boxShadow = "none"
                  }}
                >
                  <div className="relative overflow-hidden" style={{ height: 90 }}>
                    <Image
                      src={img}
                      alt={ad.title || "Bien"}
                      fill
                      sizes="(max-width: 768px) 50vw, 150px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] font-semibold text-foreground truncate">{ad.title || "Bien immobilier"}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={9} className="text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground truncate">{formatLocation(ad)}</span>
                    </div>
                    <p className="text-[11px] font-bold text-foreground mt-1.5">
                      {formatPrice(ad.price)}
                      <span className="text-[9px] font-normal text-muted-foreground ml-0.5">FCFA</span>
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
