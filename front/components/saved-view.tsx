"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Heart, MapPin, Search } from "lucide-react"
import { listFavorites, removeFavorite } from "@/lib/api"
import { SkeletonGrid } from "@/components/skeleton"
import { PropertyPackageCard } from "@/components/property-package-card"

const TYPE_LABELS: Record<string, string> = {
  maison: "Maisons",
  appartement: "Appartements",
  studio: "Studios",
  villa: "Villas",
  terrain: "Terrains",
  bureau: "Bureaux",
  magasin: "Magasins",
}

const TYPE_ORDER = ["maison", "appartement", "studio", "villa", "terrain", "bureau", "magasin"]

export function SavedView() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFavorites = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const json = await listFavorites()
      const data = json.data || json || []
      setFavorites(Array.isArray(data) ? data : [])
      setFiltered(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des favoris")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      setFiltered(favorites)
      return
    }
    const next = favorites.filter((f: any) =>
      (f.title || "").toLowerCase().includes(q) ||
      (f.city || "").toLowerCase().includes(q) ||
      (f.district || "").toLowerCase().includes(q) ||
      (f.property_type || "").toLowerCase().includes(q)
    )
    setFiltered(next)
  }, [searchQuery, favorites])

  const handleRemove = async (fav: any, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const adId = fav.ad_id || fav.id
    try {
      await removeFavorite(adId)
      setFavorites((prev) => prev.filter((f) => (f.ad_id || f.id) !== adId))
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression")
    }
  }

  // Group favorites by property type
  const groupedFavs = (() => {
    const groups: Record<string, any[]> = {}
    for (const fav of filtered) {
      const type = fav.property_type || "autre"
      if (!groups[type]) groups[type] = []
      groups[type].push(fav)
    }
    return groups
  })()

  const activeTypes = TYPE_ORDER.filter(type => groupedFavs[type]?.length > 0)
  const otherTypes = Object.keys(groupedFavs).filter(t => !TYPE_ORDER.includes(t) && t !== "autre")
  const allSections = [...activeTypes, ...otherTypes]
  if (groupedFavs["autre"]?.length > 0) allSections.push("autre")

  return (
    <div className="flex flex-col gap-6 anim-fade-up">
      {/* Search row */}
      <div className="flex items-center gap-3" style={{ animationDelay: "60ms" }}>
        <div className="flex-1 flex items-center gap-3 bg-muted rounded-full px-4 py-3">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
            placeholder="Rechercher dans vos favoris..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Section label */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-foreground">
          Favoris
          <span className="ml-2 text-[12px] font-normal text-muted-foreground">{filtered.length} sauvegardés</span>
        </h2>
      </div>

      {loading && <SkeletonGrid count={3} />}

      {error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[14px] font-semibold text-foreground">{error}</p>
          <p className="text-[12px] text-muted-foreground mt-1">Connectez-vous pour voir vos favoris</p>
          <button onClick={fetchFavorites} className="mt-4 px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium">
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && favorites.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart size={36} className="text-muted-foreground mb-3" />
          <p className="text-[14px] font-semibold text-foreground">Aucun favori</p>
          <p className="text-[12px] text-muted-foreground mt-1">Ajoutez des annonces à vos favoris pour les retrouver ici</p>
          <button onClick={() => router.push("/dashboard")} className="mt-4 px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium">
            Parcourir les annonces
          </button>
        </div>
      )}

      {!loading && !error && favorites.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search size={36} className="text-muted-foreground mb-3" />
          <p className="text-[14px] font-semibold text-foreground">Aucun résultat</p>
          <p className="text-[12px] text-muted-foreground mt-1">Essayez un autre terme de recherche</p>
        </div>
      )}

      {/* Sections by type — Gallery style cards */}
      {!loading && !error && filtered.length > 0 && (
        <div className="flex flex-col gap-12">
          {allSections.map((type, sectionIdx) => (
            <div key={type} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-[16px] font-bold text-foreground">
                    {TYPE_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1)}
                  </h3>
                  <span className="text-[12px] font-normal text-muted-foreground">
                    {groupedFavs[type].length} {groupedFavs[type].length > 1 ? "favoris" : "favori"}
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, 288px)",
                  gap: "24px",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                {groupedFavs[type].map((fav, i) => (
                  <PropertyPackageCard
                    key={fav.ad_id || fav.id}
                    ad={fav}
                    index={sectionIdx * 10 + i}
                    liked
                    onLike={(e) => handleRemove(fav, e)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
