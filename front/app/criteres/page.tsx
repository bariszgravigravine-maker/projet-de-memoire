"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Save, Loader2, Bell, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { listCriteria, updateCriteria, clearCriteria } from "@/lib/api"

const PROPERTY_TYPES = [
  "maison", "appartement", "studio", "villa", "terrain",
  "bureau", "magasin", "entrepôt", "hôtel", "résidence"
]

const CITIES = [
  "Yaoundé", "Douala", "Bafoussam", "Bamenda", "Garoua",
  "Maroua", "Buea", "Limbe", "Kribi", "Ebolowa", "Ngaoundéré", "Dschang"
]

type Critere = {
  id?: string
  type?: string
  city?: string
  district?: string
  priceMin?: number
  priceMax?: number
  bedroomsMin?: number
}

export default function CriteresPage() {
  const router = useRouter()
  const [criteria, setCriteria] = useState<Critere[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCriteria = useCallback(async () => {
    setLoading(true)
    try {
      const json = await listCriteria()
      const data = json.data || json || []
      // Map backend field names to frontend field names
      const mapped = (Array.isArray(data) ? data : []).map((c: any) => ({
        type: c.type || c.property_type || "",
        city: c.city || "",
        district: c.district || "",
        priceMin: c.priceMin ?? c.price_min ?? "",
        priceMax: c.priceMax ?? c.price_max ?? "",
        bedroomsMin: c.bedroomsMin ?? c.bedrooms_min ?? "",
      }))
      setCriteria(mapped.length > 0 ? mapped : [{}])
    } catch (err: any) {
      setError(err.message || "Erreur")
      setCriteria([{}])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCriteria()
  }, [fetchCriteria])

  const update = (idx: number, field: keyof Critere, value: any) => {
    setCriteria((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)))
  }

  const addCritere = () => setCriteria((prev) => [...prev, {}])

  const removeCritere = (idx: number) => {
    setCriteria((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const cleaned = criteria.map((c) => ({
        type: c.type || undefined,
        city: c.city || undefined,
        district: c.district || undefined,
        priceMin: c.priceMin ? Number(c.priceMin) : undefined,
        priceMax: c.priceMax ? Number(c.priceMax) : undefined,
        bedroomsMin: c.bedroomsMin ? Number(c.bedroomsMin) : undefined,
      })).filter((c) => Object.values(c).some((v) => v != null))
      await updateCriteria(cleaned)
      alert("Critères enregistrés avec succès")
    } catch (err: any) {
      alert(err.message || "Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    if (!confirm("Effacer tous les critères ?")) return
    try {
      await clearCriteria()
      setCriteria([{}])
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Critères de recherche</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Effacer
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-foreground/5 border border-foreground/10 mb-6">
          <Bell className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Alertes automatiques</p>
            <p className="text-xs text-muted-foreground mt-1">
              Définissez vos critères et recevez une notification automatique dès qu'une annonce correspondante est publiée.
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-foreground" />
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {criteria.map((c, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-card border border-border anim-fade-up">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-foreground" />
                    <span className="text-sm font-semibold text-foreground">Critère {idx + 1}</span>
                  </div>
                  {criteria.length > 1 && (
                    <button
                      onClick={() => removeCritere(idx)}
                      className="p-1.5 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Type de bien</label>
                    <Select
                      value={c.type || "all"}
                      onValueChange={(v) => update(idx, "type", v === "all" ? undefined : v)}
                    >
                      <SelectTrigger className="w-full rounded-xl px-3 text-sm capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">Tous</SelectItem>
                        {PROPERTY_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Ville</label>
                    <Select
                      value={c.city || "all"}
                      onValueChange={(v) => update(idx, "city", v === "all" ? undefined : v)}
                    >
                      <SelectTrigger className="w-full rounded-xl px-3 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">Toutes</SelectItem>
                        {CITIES.map((c2) => (
                          <SelectItem key={c2} value={c2}>{c2}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Prix min (FCFA)</label>
                    <input
                      type="number"
                      value={c.priceMin || ""}
                      onChange={(e) => update(idx, "priceMin", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0"
                      className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Prix max (FCFA)</label>
                    <input
                      type="number"
                      value={c.priceMax || ""}
                      onChange={(e) => update(idx, "priceMax", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="500000"
                      className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Quartier</label>
                    <input
                      value={c.district || ""}
                      onChange={(e) => update(idx, "district", e.target.value || undefined)}
                      placeholder="Bastos"
                      className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Chambres min</label>
                    <input
                      type="number"
                      value={c.bedroomsMin || ""}
                      onChange={(e) => update(idx, "bedroomsMin", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="2"
                      className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addCritere}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-5 h-5" />
              Ajouter un critère
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
