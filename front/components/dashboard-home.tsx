"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, SlidersHorizontal, Plus, Sparkles, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAds, getRecommendations, addFavorite, removeFavorite, listFavorites } from "@/lib/api"
import { SkeletonGrid } from "@/components/skeleton"
import { PropertyPackageCard } from "@/components/property-package-card"
import confetti from "canvas-confetti"

const TAGS = ["Tous", "maison", "appartement", "studio", "villa", "terrain", "bureau", "magasin"]

export function DashboardHome() {
  const router = useRouter()
  const [activeTag, setActiveTag] = useState("Tous")
  const [searchQuery, setSearchQuery] = useState("")
  const [ads, setAds] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [likedAds, setLikedAds] = useState<Set<string>>(new Set())

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
    } catch (err) {
      // Recommendations are optional
    }
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
      } catch {
        // User might not be logged in
      }
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
      if (wasLiked) {
        await removeFavorite(id)
      } else {
        await addFavorite(id)
      }
    } catch (err) {
      setLikedAds((prev) => {
        const next = new Set(prev)
        if (wasLiked) next.add(id)
        else next.delete(id)
        return next
      })
    }
  }

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

      {/* Header */}
      <div className="flex items-center justify-between">
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
          <MapPin size={36} className="text-muted-foreground mb-3" />
          <p className="text-[14px] font-semibold text-foreground">Aucune annonce trouvée</p>
          <p className="text-[12px] text-muted-foreground mt-1">Essayez d'autres filtres ou villes</p>
        </div>
      )}

      {/* Single grid — no sections by type */}
      {!loading && !error && ads.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, 288px)",
            gap: "24px",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {ads.map((ad, i) => (
            <PropertyPackageCard
              key={ad.ad_id || ad.id}
              ad={ad}
              index={i}
              liked={likedAds.has(ad.ad_id || ad.id)}
              onLike={(e) => toggleLike(ad.ad_id || ad.id, e)}
            />
          ))}
        </div>
      )}

      {/* Recommendations IA */}
      {recommendations.length > 0 && !loading && !error && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-foreground" />
            <h2 className="text-[15px] font-bold text-foreground">Recommandé pour vous</h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, 260px)",
              gap: "20px",
              justifyContent: "center",
              width: "100%",
            }}
          >
            {recommendations.map((ad, i) => (
              <PropertyPackageCard
                key={ad.ad_id || ad.id || i}
                ad={ad}
                index={i}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
