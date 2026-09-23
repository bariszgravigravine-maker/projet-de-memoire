"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, X, Plus, Home, Loader2, Sparkles, MapPin } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createAd, getToken, generateDescription, detectProximity, geocodePlace } from "@/lib/api"
import { LocationPickerMap } from "@/components/location-picker-map"

interface DetectedPref {
  code: string
  note: string | null
  distance_m: number
}

const PROPERTY_TYPES = [
  "maison", "appartement", "studio", "villa", "terrain",
  "bureau", "magasin", "entrepôt", "hôtel", "résidence"
]

const CITIES = [
  "Yaoundé", "Douala", "Bafoussam", "Bamenda", "Garoua",
  "Maroua", "Buea", "Limbe", "Kribi", "Ebolowa", "Ngaoundéré", "Dschang"
]

export default function PublierAnnoncePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [generatingDesc, setGeneratingDesc] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    type: "maison",
    area: "",
    bedrooms: "",
    bathrooms: "",
    address: "",
    district: "",
    city: "Yaoundé",
  })

  // Coordonnées du pin posé sur la mini-map + proximités détectées
  // automatiquement par le backend (Overpass) à partir de ce point.
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [detectedPrefs, setDetectedPrefs] = useState<DetectedPref[]>([])
  const [locating, setLocating] = useState(false)

  // Pin posé automatiquement quand le quartier/adresse est géocodé
  const [geoPin, setGeoPin] = useState<{ lat: number; lon: number } | null>(null)
  // Nom de quartier auto-rempli par le géocodage inversé : évite de relancer
  // une recherche en boucle quand on écrit nous-mêmes dans le champ.
  const autoDistrictRef = useRef<string | null>(null)

  const token = typeof window !== "undefined" ? getToken() : null

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  // Clic sur la mini-map : récupère le vrai nom du quartier/ville/adresse
  // (géocodage inversé) et les équipements proches détectés automatiquement.
  const handleMapPick = async (lat: number, lon: number) => {
    setCoords({ lat, lon })
    setLocating(true)
    try {
      const json = await detectProximity(lat, lon)
      const data = json?.data || json
      setDetectedPrefs(Array.isArray(data.preferences) ? data.preferences : [])
      const loc = data.location
      if (loc) {
        // Le quartier détecté remplace la saisie : c'est le nom officiel
        // OSM du lieu, garantissant des données de recherche fiables.
        autoDistrictRef.current = loc.district || null
        setForm((prev) => ({
          ...prev,
          district: loc.district || prev.district,
          address: prev.address || loc.address || "",
          city: loc.city && CITIES.includes(loc.city) ? loc.city : prev.city,
        }))
      }
    } catch {
      setDetectedPrefs([])
    } finally {
      setLocating(false)
    }
  }

  // Géocodage automatique : taper le quartier (ou l'adresse) positionne la
  // carte et pose le pin tout seul — plus besoin de chercher à la main.
  useEffect(() => {
    const district = form.district.trim()
    const address = form.address.trim()
    // Ne pas relancer quand le champ vient d'être auto-rempli par le
    // géocodage inversé (clic carte / pin auto).
    if (district && district === autoDistrictRef.current) return
    if (district.length < 3 && address.length < 5) return
    const q = [address, district, form.city].filter(Boolean).join(", ")
    const t = setTimeout(async () => {
      try {
        const res = await geocodePlace(q)
        const geo = res?.data || res
        if (geo?.latitude != null && geo?.longitude != null) {
          setGeoPin({ lat: geo.latitude, lon: geo.longitude })
          handleMapPick(geo.latitude, geo.longitude)
        }
      } catch {}
    }, 800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.district, form.address, form.city])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return
      const reader = new FileReader()
      reader.onload = (event) => {
        setPhotos((prev) => [...prev, event.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ""
  }

  const removePhoto = (idx: number) => setPhotos((prev) => prev.filter((_, i) => i !== idx))

  const handleGenerateDescription = async () => {
    setGeneratingDesc(true)
    try {
      const data: any = {
        type: form.type,
        city: form.city,
      }
      if (form.area) data.area = Number(form.area)
      if (form.bedrooms) data.bedrooms = Number(form.bedrooms)
      if (form.bathrooms) data.bathrooms = Number(form.bathrooms)
      if (form.district) data.district = form.district
      if (form.price) data.price = Number(form.price)

      const res = await generateDescription(data)
      const desc = res.data?.description || res.description || ""
      if (desc) update("description", desc)
    } catch (err: any) {
      alert(err.message || "Erreur lors de la génération")
    } finally {
      setGeneratingDesc(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError("Veuillez vous connecter pour publier une annonce.")
      return
    }
    if (!form.title || !form.price || !form.type || !form.city) {
      setError("Titre, prix, type et ville sont obligatoires.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      await createAd({
        title: form.title,
        description: form.description,
        price: Number(form.price),
        type: form.type,
        area: form.area ? Number(form.area) : undefined,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        address: form.address,
        district: form.district,
        city: form.city,
        // Coordonnées du pin posé sur la mini-map : le backend détecte
        // automatiquement les équipements de proximité à partir d'elles.
        latitude: coords?.lat,
        longitude: coords?.lon,
        photos,
      })
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Erreur lors de la publication")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/dashboard")} className="p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Publier une annonce</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Titre de l&apos;annonce</label>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Ex: Villa moderne à Bastos"
              className="w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={generatingDesc}
                className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:bg-muted px-2 py-1 rounded-full transition-colors disabled:opacity-50"
              >
                {generatingDesc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Générer avec IA
              </button>
            </div>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={4}
              placeholder="Décrivez le bien..."
              className="w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Prix (FCFA)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="250000"
                className="w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Type de bien</label>
              <Select value={form.type} onValueChange={(v) => update("type", v)}>
                <SelectTrigger className="w-full h-12 rounded-xl px-4 text-sm capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Superficie (m²) <span className="text-muted-foreground font-normal">(optionnel)</span>
              </label>
              <input
                type="number"
                value={form.area}
                onChange={(e) => update("area", e.target.value)}
                placeholder="180"
                className="w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Chambres</label>
              <input
                type="number"
                value={form.bedrooms}
                onChange={(e) => update("bedrooms", e.target.value)}
                placeholder="4"
                className="w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Douches</label>
              <input
                type="number"
                value={form.bathrooms}
                onChange={(e) => update("bathrooms", e.target.value)}
                placeholder="2"
                className="w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Localisation : ville → quartier/adresse (géocodage auto) → carte */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Ville</label>
            <Select value={form.city} onValueChange={(v) => update("city", v)}>
              <SelectTrigger className="w-full h-12 rounded-xl px-4 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Quartier</label>
              <input
                value={form.district}
                onChange={(e) => update("district", e.target.value)}
                placeholder="Ex: Bastos — localise la carte"
                className="w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Adresse <span className="text-muted-foreground font-normal">(optionnel)</span>
              </label>
              <input
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Rue, repère..."
                className="w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Localisation sur la carte
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Le quartier saisi ci-dessus positionne la carte automatiquement.
              Vous pouvez aussi cliquer pour affiner le pin, ou utiliser « Ma position ».
            </p>
            <LocationPickerMap city={form.city} pin={geoPin} onPick={handleMapPick} />
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              {locating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Détection du quartier et des proximités…
                </>
              ) : coords ? (
                <>
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Position : {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  Aucun pin posé — la position sera approximative
                </>
              )}
            </div>
          </div>

          {/* Proximités détectées automatiquement (lecture seule) */}
          {detectedPrefs.length > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <p className="text-xs font-semibold text-emerald-800 mb-2">
                À proximité — détecté automatiquement
              </p>
              <div className="flex flex-wrap gap-2">
                {detectedPrefs.map((p) => (
                  <span
                    key={p.code}
                    className="px-2.5 py-1 rounded-full bg-white border border-emerald-200 text-xs text-emerald-800"
                    title={p.note || undefined}
                  >
                    {p.note || p.code}
                    {p.distance_m != null && ` · ${p.distance_m >= 1000 ? `${(p.distance_m / 1000).toFixed(1)} km` : `${p.distance_m} m`}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Photos</label>
            <div className="flex flex-wrap gap-3">
              {photos.map((photo, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border">
                  <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/70 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-6 h-6 mb-1" />
                <span className="text-[10px]">Ajouter</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Home className="w-4 h-4" />}
            {loading ? "Publication..." : "Publier l'annonce"}
          </button>
        </form>
      </main>
    </div>
  )
}
