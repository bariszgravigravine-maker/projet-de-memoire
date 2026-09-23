"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import dynamic from "next/dynamic"
import { ArrowLeft, Plus, Trash2, Eye, Home, Loader2, Heart, Users } from "lucide-react"
import { listMyAds, deleteAd } from "@/lib/api"
import { Skeleton } from "@/components/skeleton"

// three.js n'est pas SSR-safe : chargement client uniquement
const AdsStats3D = dynamic(
  () => import("@/components/ads-stats-3d").then((m) => m.AdsStats3D),
  { ssr: false, loading: () => <div className="h-[400px] rounded-2xl bg-stone-950 animate-pulse" /> }
)

const FALLBACK_IMAGES = [
  "/images/house-1.jpg", "/images/house-2.jpg", "/images/house-3.jpg",
  "/images/house-4.jpg", "/images/house-5.jpg", "/images/house-6.jpg",
]

export default function MesAnnoncesPage() {
  const router = useRouter()
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchAds = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const json = await listMyAds()
      const data = json.data || json || []
      setAds(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAds()
  }, [fetchAds])

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette annonce ?")) return
    setDeleting(id)
    try {
      await deleteAd(id)
      setAds((prev) => prev.filter((a) => a.id !== id))
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Mes annonces</h1>
          <span className="text-sm text-muted-foreground">({ads.length})</span>
        </div>
        <button
          onClick={() => router.push("/annonce/publier")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Publier
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats globales : vues cumulées, visiteurs uniques, likes */}
        {!loading && !error && ads.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-2xl bg-card border border-border p-4 text-center">
              <Eye className="w-5 h-5 mx-auto text-foreground mb-1.5" />
              <p className="text-xl font-bold text-foreground">
                {ads.reduce((s, a) => s + (a.view_count || 0), 0).toLocaleString("fr-FR")}
              </p>
              <p className="text-[11px] text-muted-foreground">Vues totales</p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-4 text-center">
              <Users className="w-5 h-5 mx-auto text-foreground mb-1.5" />
              <p className="text-xl font-bold text-foreground">
                {ads.reduce((s, a) => s + (a.unique_viewers || 0), 0).toLocaleString("fr-FR")}
              </p>
              <p className="text-[11px] text-muted-foreground">Visiteurs uniques</p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-4 text-center">
              <Heart className="w-5 h-5 mx-auto text-foreground mb-1.5" />
              <p className="text-xl font-bold text-foreground">
                {ads.reduce((s, a) => s + (a.likes_count || 0), 0).toLocaleString("fr-FR")}
              </p>
              <p className="text-[11px] text-muted-foreground">Likes reçus</p>
            </div>
          </div>
        )}

        {/* Graphe 3D : X = annonces · Y = valeurs · Z = vues/visiteurs/likes */}
        {!loading && !error && ads.length > 0 && (
          <div className="mb-6">
            <AdsStats3D
              stats={ads.map((a) => ({
                id: a.id,
                title: a.title,
                views: a.view_count || 0,
                viewers: a.unique_viewers || 0,
                likes: a.likes_count || 0,
              }))}
            />
          </div>
        )}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-2xl bg-card border border-border">
                <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-semibold text-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-1">Connectez-vous en tant qu'agent pour voir vos annonces</p>
            <button onClick={fetchAds} className="mt-4 px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium">
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && ads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Home size={40} className="text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-foreground">Aucune annonce publiée</p>
            <p className="text-xs text-muted-foreground mt-1">Publiez votre première annonce</p>
            <button
              onClick={() => router.push("/annonce/publier")}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Publier une annonce
            </button>
          </div>
        )}

        {!loading && !error && ads.length > 0 && (
          <div className="space-y-3">
            {ads.map((ad, i) => (
              <div
                key={ad.id}
                className="flex gap-4 p-3 rounded-2xl bg-card border border-border anim-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]}
                    alt={ad.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-foreground line-clamp-1">{ad.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ad.price?.toLocaleString("fr-FR")} FCFA
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        ad.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                        ad.status === "EN_ATTENTE" ? "bg-amber-100 text-amber-700" :
                        "bg-stone-100 text-stone-500"
                      }`}>
                        {ad.status}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground" title="Vues de la page annonce">
                        <Eye className="w-3 h-3" />
                        {ad.view_count || 0} vues
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground" title="Personnes différentes ayant visité">
                        <Users className="w-3 h-3" />
                        {ad.unique_viewers || 0} visiteurs
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-red-500" title="Ajouté en favoris">
                        <Heart className="w-3 h-3" />
                        {ad.likes_count || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => router.push(`/annonce/${ad.id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      Voir
                    </button>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      disabled={deleting === ad.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deleting === ad.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
