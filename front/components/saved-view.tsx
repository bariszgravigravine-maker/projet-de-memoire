"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Heart, BedDouble, Bath, MapPin, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { listFavorites, removeFavorite } from "@/lib/api"
import { SkeletonGrid } from "@/components/skeleton"

const FALLBACK_IMAGES = [
  "/images/house-1.jpg",
  "/images/house-2.jpg",
  "/images/house-3.jpg",
  "/images/house-4.jpg",
  "/images/house-5.jpg",
  "/images/house-6.jpg",
]

function fallbackImage(index: number) {
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
}

function getPropertyImage(fav: any, index: number) {
  if (fav.photos && fav.photos.length > 0) {
    const url = fav.photos[0].url || fav.photos[0]
    if (url) return url
  }
  return fallbackImage(index)
}

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

  const formatLocation = (fav: any) => {
    const parts = [fav.district, fav.city].filter(Boolean)
    return parts.length ? parts.join(", ") : "Cameroun"
  }

  const formatPrice = (price: any) => {
    if (!price) return "N/A"
    return Number(price).toLocaleString("fr-FR")
  }

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

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((fav, i) => {
            const adId = fav.ad_id || fav.id
            const img = getPropertyImage(fav, i)
            return (
              <div
                key={adId}
                onClick={() => router.push(`/annonce/${adId}`)}
                className="group rounded-2xl overflow-hidden bg-card border border-border cursor-pointer anim-fade-up"
                style={{ animationDelay: `${i * 55}ms`, transition: "transform 0.24s ease, box-shadow 0.24s ease" }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)"
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = "none"
                }}
              >
                <div className="relative overflow-hidden" style={{ height: 176 }}>
                  <Image
                    src={img}
                    alt={fav.title || "Bien immobilier"}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  {/* Remove button */}
                  <button
                    onClick={(e) => handleRemove(fav, e)}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/85 backdrop-blur-sm rounded-full shadow-sm transition-transform hover:scale-110 z-10"
                  >
                    <Heart size={14} className="fill-red-500 text-red-500" />
                  </button>
                  {fav.property_type && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                      <span>{fav.property_type}</span>
                    </div>
                  )}
                </div>
                <div className="p-3.5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-bold text-foreground leading-tight truncate">{fav.title || "Bien immobilier"}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-muted-foreground shrink-0" />
                        <span className="text-[11px] text-muted-foreground truncate">{formatLocation(fav)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground">
                    {fav.bedrooms != null && (
                      <span className="flex items-center gap-1"><BedDouble size={12} />{fav.bedrooms} ch.</span>
                    )}
                    {fav.bathrooms != null && (
                      <span className="flex items-center gap-1"><Bath size={12} />{fav.bathrooms} sdb</span>
                    )}
                    {fav.area && (
                      <span className="flex items-center gap-1">{fav.area} m²</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[14px] font-bold text-foreground">
                      {formatPrice(fav.price)}
                      <span className="text-[11px] font-normal text-muted-foreground ml-1">FCFA{fav.transaction_type === "location" ? "/mois" : ""}</span>
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/annonce/${adId}`) }}
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
  )
}
