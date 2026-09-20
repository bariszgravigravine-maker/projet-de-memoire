"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calculator, Loader2, TrendingUp, MapPin, Home } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { estimatePrice } from "@/lib/api"

const PROPERTY_TYPES = [
  "maison", "appartement", "studio", "villa", "terrain",
  "bureau", "magasin", "entrepôt", "hôtel", "résidence"
]

const CITIES = [
  "Yaoundé", "Douala", "Bafoussam", "Bamenda", "Garoua",
  "Maroua", "Buea", "Limbe", "Kribi", "Ebolowa", "Ngaoundéré", "Dschang"
]

export default function EstimationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [form, setForm] = useState({
    propertyType: "maison",
    area: "",
    bedrooms: "",
    bathrooms: "",
    city: "Yaoundé",
    district: "",
  })

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleEstimate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data: any = {
        propertyType: form.propertyType,
        city: form.city,
      }
      if (form.area) data.area = Number(form.area)
      if (form.bedrooms) data.bedrooms = Number(form.bedrooms)
      if (form.bathrooms) data.bathrooms = Number(form.bathrooms)
      if (form.district) data.district = form.district

      const json = await estimatePrice(data)
      setResult(json.data || json)
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'estimation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/dashboard")} className="p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Estimation de prix IA</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-foreground/5 border border-foreground/10 mb-6">
          <Calculator className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Estimation intelligente</p>
            <p className="text-xs text-muted-foreground mt-1">
              Notre IA analyse les caractéristiques du bien et le marché local pour estimer un prix juste avec intervalle de confiance.
            </p>
          </div>
        </div>

        <form onSubmit={handleEstimate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Type de bien</label>
              <Select value={form.propertyType} onValueChange={(v) => update("propertyType", v)}>
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
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Ville</label>
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
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Superficie (m²)</label>
              <input
                type="number"
                value={form.area}
                onChange={(e) => update("area", e.target.value)}
                placeholder="180"
                className="w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Chambres</label>
              <input
                type="number"
                value={form.bedrooms}
                onChange={(e) => update("bedrooms", e.target.value)}
                placeholder="4"
                className="w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Douches</label>
              <input
                type="number"
                value={form.bathrooms}
                onChange={(e) => update("bathrooms", e.target.value)}
                placeholder="2"
                className="w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Quartier</label>
            <input
              value={form.district}
              onChange={(e) => update("district", e.target.value)}
              placeholder="Bastos"
              className="w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            {loading ? "Estimation en cours..." : "Estimer le prix"}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-6 p-6 rounded-2xl bg-foreground text-background anim-fade-up">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5" />
              <h3 className="text-sm font-semibold">Résultat de l'estimation</h3>
            </div>

            {result.estimatedPrice && (
              <div className="mb-4">
                <p className="text-xs opacity-70 mb-1">Prix estimé</p>
                <p className="text-3xl font-bold">
                  {Number(result.estimatedPrice).toLocaleString("fr-FR")}
                  <span className="text-base font-normal opacity-70 ml-1">FCFA</span>
                </p>
              </div>
            )}

            {result.priceMin != null && result.priceMax != null && (
              <div className="mb-4">
                <p className="text-xs opacity-70 mb-1">Intervalle de confiance</p>
                <p className="text-lg font-semibold">
                  {Number(result.priceMin).toLocaleString("fr-FR")} — {Number(result.priceMax).toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            )}

            {result.confidence && (
              <div className="mb-4">
                <p className="text-xs opacity-70 mb-1">Niveau de confiance</p>
                <div className="w-full h-2 bg-background/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-background rounded-full"
                    style={{ width: `${Math.min(100, result.confidence)}%` }}
                  />
                </div>
                <p className="text-xs opacity-70 mt-1">{result.confidence}%</p>
              </div>
            )}

            {result.explanation && (
              <div className="text-sm opacity-80 leading-relaxed border-t border-background/20 pt-4">
                {result.explanation}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
