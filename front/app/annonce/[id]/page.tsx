"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Heart, MapPin, BedDouble, Bath, Maximize, Phone, Mail,
  MessageSquare, Share2, MoreHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getAdDetail, contactAd, openConversation, getToken } from "@/lib/api"
import { Skeleton } from "@/components/skeleton"

const FALLBACK_IMAGES = [
  "/images/house-1.jpg",
  "/images/house-2.jpg",
  "/images/house-3.jpg",
  "/images/house-4.jpg",
  "/images/house-5.jpg",
  "/images/house-6.jpg",
]

export default function AnnonceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [ad, setAd] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [showPhone, setShowPhone] = useState(false)

  useEffect(() => {
    if (!id) return
    async function fetchDetail() {
      try {
        setLoading(true)
        const json = await getAdDetail(id)
        const data = json.data || json
        setAd(data)
      } catch (err: any) {
        setError(err.message || "Impossible de charger l'annonce")
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])

  const handleContact = async () => {
    // Vérifier si l'utilisateur est connecté
    const token = getToken()
    if (!token) {
      router.push("/auth?redirect=/annonce/" + id)
      return
    }

    if (!ad?.owner_id) {
      alert("Impossible de contacter cet annonceur")
      return
    }

    try {
      // Créer ou récupérer la conversation avec l'annonceur
      const res = await openConversation(ad.owner_id)
      const conv = res.data || res
      const convId = conv.id || conv.conversation_id
      if (convId) {
        // Rediriger vers la messagerie avec la conversation sélectionnée
        router.push(`/messages?conversationId=${convId}`)
      } else {
        // Fallback : aller à la liste des messages
        router.push("/messages")
      }
    } catch (err: any) {
      // Si l'API échoue, fallback : afficher le téléphone si disponible
      if (ad.owner_phone) {
        setShowPhone(true)
      } else {
        alert(err.message || "Veuillez vous connecter pour contacter l'annonceur")
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-1">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="w-9 h-9 rounded-full" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <Skeleton className="w-full rounded-2xl" style={{ height: 320 }} />
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <p className="text-lg font-semibold text-foreground">{error || "Annonce introuvable"}</p>
        <button onClick={() => router.push("/dashboard")} className="mt-4 px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium">
          Retour aux annonces
        </button>
      </div>
    )
  }

  const photos = ad.photos?.length > 0 ? ad.photos.map((p: any) => p.url || p) : FALLBACK_IMAGES
  const ownerName = `${ad.owner_first_name || ""} ${ad.owner_last_name || ""}`.trim() || "Annonceur"
  const location = [ad.district, ad.city].filter(Boolean).join(", ") || "Cameroun"

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    if (!img.dataset.fallback) {
      img.dataset.fallback = "1"
      img.src = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)]
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      {/* Header mobile */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.push("/dashboard")} className="p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-sm font-semibold text-foreground truncate max-w-[50%]">{ad.title}</h1>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Share2 className="w-5 h-5 text-foreground" />
          </button>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <MoreHorizontal className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-border" style={{ height: 320 }}>
            <img src={photos[activeImage]} alt={ad.title} className="w-full h-full object-cover" onError={handleImgError} />
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((photo: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-colors",
                    activeImage === i ? "border-foreground" : "border-transparent hover:border-border"
                  )}
                >
                  <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" onError={handleImgError} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title + price */}
        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{ad.title}</h2>
            <div className="flex items-center gap-1 mt-1 text-muted-foreground">
              <MapPin size={14} />
              <span className="text-sm">{location}</span>
            </div>
          </div>
          <button
            onClick={() => setLiked(!liked)}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0"
          >
            <Heart className={cn("w-5 h-5", liked ? "fill-red-500 text-red-500" : "text-foreground")} />
          </button>
        </div>

        <p className="mt-4 text-3xl font-bold text-foreground">
          {ad.price?.toLocaleString("fr-FR")} <span className="text-base font-normal text-muted-foreground">FCFA</span>
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/40 border border-border">
            <BedDouble className="w-5 h-5 text-foreground mb-1" />
            <span className="text-sm font-semibold text-foreground">{ad.bedrooms ?? 0}</span>
            <span className="text-[10px] text-muted-foreground">Chambres</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/40 border border-border">
            <Bath className="w-5 h-5 text-foreground mb-1" />
            <span className="text-sm font-semibold text-foreground">{ad.bathrooms ?? 0}</span>
            <span className="text-[10px] text-muted-foreground">Douches</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/40 border border-border">
            <Maximize className="w-5 h-5 text-foreground mb-1" />
            <span className="text-sm font-semibold text-foreground">{ad.area ?? "—"}</span>
            <span className="text-[10px] text-muted-foreground">m²</span>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Description</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {ad.description || "Aucune description fournie."}
          </p>
        </div>

        {/* Owner */}
        <div className="mt-6 p-4 rounded-2xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Annonceur</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm">
                {ownerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-foreground">{ownerName}</p>
                <p className="text-xs text-muted-foreground">{ad.property_type} • {ad.city}</p>
              </div>
            </div>
            {showPhone && ad.owner_phone ? (
              <a href={`tel:${ad.owner_phone}`} className="flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium">
                <Phone className="w-4 h-4" />
                {ad.owner_phone}
              </a>
            ) : (
              <button
                onClick={handleContact}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Contacter
              </button>
            )}
          </div>
          {ad.owner_email && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>{ad.owner_email}</span>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="fixed md:hidden bottom-0 left-0 right-0 bg-white border-t border-border p-4 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLiked(!liked)}
              className="w-12 h-12 rounded-full border border-border flex items-center justify-center"
            >
              <Heart className={cn("w-5 h-5", liked ? "fill-red-500 text-red-500" : "text-foreground")} />
            </button>
            <button
              onClick={handleContact}
              className="flex-1 h-12 rounded-full bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 transition-colors"
            >
              Contacter l'annonceur
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
