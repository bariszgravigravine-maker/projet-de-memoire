"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Heart, BedDouble, Bath, MapPin, Trash2 } from "lucide-react"
import { listFavorites, removeFavorite } from "@/lib/api"
import { SkeletonGrid } from "@/components/skeleton"
import { PropertyPackageCard } from "@/components/property-package-card"

const FALLBACK_IMAGES = [
  "/images/house-1.jpg", "/images/house-2.jpg", "/images/house-3.jpg",
  "/images/house-4.jpg", "/images/house-5.jpg", "/images/house-6.jpg",
]

export function SavedView() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFavorites = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const json = await listFavorites()
      const data = json.data || json || []
      setFavorites(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des favoris")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const handleRemove = async (adId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
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

  return (
    <div className="flex flex-col gap-6 anim-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-foreground">
          Favoris
          <span className="ml-2 text-[12px] font-normal text-muted-foreground">{favorites.length} sauvegardés</span>
        </h2>
      </div>

      {loading && (
        <SkeletonGrid count={3} />
      )}

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

      {!loading && !error && favorites.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, 288px)",
            gap: "24px",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {favorites.map((fav, i) => (
            <PropertyPackageCard
              key={fav.ad_id || fav.id}
              ad={fav}
              index={i}
              liked
              onLike={(e) => handleRemove(fav.ad_id || fav.id, e)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
