"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Edit2, Check, Camera, Mail, Phone, MapPin, Home,
  LayoutDashboard, LogOut, User, Building2, Wallet,
  Eye, Heart, Home as HomeIcon, BadgeCheck, Loader2,
  TrendingUp, Calendar, Activity, BarChart3, Clock, Target, Award
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getProfile, updateProfile, updatePreferences, clearAuth } from "@/lib/api"

// Mock data aligned with backend users entity
const MOCK_USER = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "ndongo@immo.cm",
  first_name: "Ndongo",
  last_name: "Fotso",
  phone: "+237 6 98 76 54 32",
  role: "AGENT",
  status: "ACTIF",
  budget_max: 500000,
  preferred_types: ["maison", "villa", "appartement"],
  preferred_zones: ["Yaoundé", "Douala"],
  active_ads_count: 12,
  total_views: 248,
  total_contacts: 36,
  bio: "Agent immobilier spécialisé dans la location et la vente de biens au Cameroun. À votre écoute pour trouver le logement idéal.",
  created_at: "2025-09-01T10:30:00Z",
}

const ROLE_LABELS: Record<string, string> = {
  USER: "Utilisateur",
  AGENT: "Agent immobilier",
  ADMIN: "Administrateur",
}

const ROLE_ICONS: Record<string, typeof User> = {
  USER: User,
  AGENT: Building2,
  ADMIN: BadgeCheck,
}

const ALL_PROPERTY_TYPES = [
  "maison", "appartement", "studio", "villa", "terrain",
  "bureau", "magasin", "entrepôt", "hôtel", "résidence"
]

const ALL_CITIES = [
  "Yaoundé", "Douala", "Bafoussam", "Bamenda", "Garoua",
  "Maroua", "Buea", "Limbe", "Kribi", "Ebolowa", "Ngaoundéré", "Dschang"
]

export function ProfileView() {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<any>(MOCK_USER)
  const [form, setForm] = useState<any>(MOCK_USER)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileImage, setProfileImage] = useState("/images/agent.jpg")

  const fetchProfile = useCallback(async () => {
    try {
      const json = await getProfile()
      const data = json.data || json
      const normalized = {
        ...MOCK_USER,
        ...data,
        preferred_types: data.preferred_types || [],
        preferred_zones: data.preferred_zones || [],
        budget_max: data.budget_max ?? 0,
      }
      setUser(normalized)
      setForm(normalized)
    } catch (err) {
      // Keep mock data if not authenticated
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // 3D tilt state
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setProfileImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditing) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      setPosition({ x: newX, y: newY, z: Math.abs(newX) * 0.1 + Math.abs(newY) * 0.1 })
      const rotateXValue = (newY / window.innerHeight) * 20
      const rotateYValue = (newX / window.innerWidth) * 20
      setRotateX(rotateXValue)
      setRotateY(rotateYValue)
    } else if (!isEditing) {
      const card = e.currentTarget
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateXValue = ((y - centerY) / centerY) * -10
      const rotateYValue = ((x - centerX) / centerX) * 10
      setRotateX(rotateXValue)
      setRotateY(rotateYValue)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setPosition({ x: 0, y: 0, z: 0 })
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    setRotateX(0)
    setRotateY(0)
    setPosition({ x: 0, y: 0, z: 0 })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({
        firstName: form.first_name,
        lastName: form.last_name,
        phone: form.phone,
      })
      await updatePreferences({
        preferredTypes: form.preferred_types,
        preferredZones: form.preferred_zones,
        budgetMax: form.budget_max,
      })
      setUser({ ...form })
      setIsEditing(false)
    } catch (err: any) {
      alert(err.message || "Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    clearAuth()
    router.push("/")
  }

  const toggleArrayValue = (field: "preferred_types" | "preferred_zones", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }))
  }

  const fullName = `${user.first_name} ${user.last_name}`
  const RoleIcon = ROLE_ICONS[user.role] || User

  // Compute analytics stats
  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "short" }) : "—"
  const memberDays = user.created_at ? Math.max(1, Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000)) : 0
  const conversionRate = user.total_contacts && user.total_views ? Math.round((user.total_contacts / user.total_views) * 100) : 0
  const avgViewsPerAd = user.active_ads_count ? Math.round((user.total_views / user.active_ads_count) * 10) / 10 : 0

  return (
    <div className="relative flex-1 w-full flex flex-col items-center justify-center bg-background p-4 lg:p-8">
      {/* Back to dashboard */}
      <button
        onClick={() => router.push("/dashboard")}
        className="absolute top-4 left-4 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <LayoutDashboard className="w-4 h-4" />
        Tableau de bord
      </button>

      {/* 3-column layout: left stats | profile card | right stats */}
      <div className="w-full max-w-7xl flex items-center justify-center gap-6">
        {/* Left analytics column */}
        <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
          <div className="p-5 rounded-2xl bg-card border border-border anim-fade-up">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-foreground" />
              <h3 className="text-sm font-bold text-foreground">Activité</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" /> Vues totales</span>
                  <span className="text-sm font-bold text-foreground">{user.total_views}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (user.total_views / Math.max(1, user.total_views)) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Heart className="w-3 h-3" /> Contacts reçus</span>
                  <span className="text-sm font-bold text-foreground">{user.total_contacts}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (user.total_contacts / Math.max(1, user.total_views)) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Home className="w-3 h-3" /> Annonces actives</span>
                  <span className="text-sm font-bold text-foreground">{user.active_ads_count}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (user.active_ads_count / Math.max(1, user.active_ads_count + 3)) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border anim-fade-up" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-foreground" />
              <h3 className="text-sm font-bold text-foreground">Performance</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Taux de conversion</span>
                <span className="text-sm font-bold text-foreground">{conversionRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Vues / annonce</span>
                <span className="text-sm font-bold text-foreground">{avgViewsPerAd}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Budget max</span>
                <span className="text-sm font-bold text-foreground">{Number(user.budget_max).toLocaleString("fr-FR")}</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-foreground text-background anim-fade-up" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4" />
              <h3 className="text-sm font-bold">Niveau</h3>
            </div>
            <p className="text-2xl font-black">{user.role === "AGENT" ? "Agent Pro" : user.role === "ADMIN" ? "Admin" : "Membre"}</p>
            <p className="text-xs opacity-70 mt-1">{memberDays} jours d'activité</p>
          </div>
        </aside>

        {/* Center: Profile card */}
        <div
          className="perspective-[2000px] cursor-grab active:cursor-grabbing w-full max-w-md"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
        >
        <div
          ref={cardRef}
          onMouseDown={handleMouseDown}
          className="relative w-full transition-all duration-500 ease-out"
          style={{
            transform: `
              perspective(2000px)
              translate3d(${position.x}px, ${position.y}px, ${position.z}px)
              rotateX(${rotateX}deg)
              rotateY(${isEditing ? 180 : rotateY}deg)
            `,
            transformStyle: "preserve-3d",
          }}
        >
          {/* FRONT */}
          <Card
            className="w-full overflow-hidden transition-all duration-700 ease-out hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-border bg-card backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-xl hover:bg-muted border border-border shadow-sm rounded-full transition-all duration-300"
              onClick={() => { setForm(user); setIsEditing(true) }}
            >
              <Edit2 className="w-4 h-4" />
            </Button>

            <div className="relative mt-12 flex justify-center px-6">
              <div
                className="relative"
                style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }}
              >
                <div className="relative h-32 w-32 rounded-full border-4 border-background shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden bg-background ring-1 ring-border">
                  <Image
                    src={profileImage || "/images/agent.jpg"}
                    alt={fullName}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-foreground rounded-full p-1.5 shadow-[0_4px_12px_rgb(0,0,0,0.15)] ring-2 ring-background">
                  <BadgeCheck className="w-5 h-5 text-background" />
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 pt-6 space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-semibold text-foreground tracking-tight">{fullName}</h2>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-border rounded-full text-sm font-medium text-muted-foreground">
                    <RoleIcon className="w-4 h-4" />
                    {ROLE_LABELS[user.role]}
                  </div>
                  <div className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold border",
                    user.status === "ACTIF" && "bg-green-100 text-green-700 border-green-200",
                    user.status === "SUSPENDU" && "bg-amber-100 text-amber-700 border-amber-200",
                    user.status === "SUPPRIME" && "bg-red-100 text-red-700 border-red-200"
                  )}>
                    {user.status.toLowerCase()}
                  </div>
                </div>
              </div>

              <p className="text-center text-muted-foreground text-sm leading-relaxed">
                {user.bio || "Aucune biographie renseignée."}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-3 rounded-2xl bg-muted/40 border border-border">
                  <Home className="w-4 h-4 mx-auto mb-1 text-foreground" />
                  <p className="text-lg font-bold text-foreground">{user.active_ads_count}</p>
                  <p className="text-[10px] text-muted-foreground">Annonces</p>
                </div>
                <div className="text-center p-3 rounded-2xl bg-muted/40 border border-border">
                  <Eye className="w-4 h-4 mx-auto mb-1 text-foreground" />
                  <p className="text-lg font-bold text-foreground">{user.total_views}</p>
                  <p className="text-[10px] text-muted-foreground">Vues</p>
                </div>
                <div className="text-center p-3 rounded-2xl bg-muted/40 border border-border">
                  <Heart className="w-4 h-4 mx-auto mb-1 text-foreground" />
                  <p className="text-lg font-bold text-foreground">{user.total_contacts}</p>
                  <p className="text-[10px] text-muted-foreground">Contacts</p>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-foreground">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span className="text-foreground">{user.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-foreground">{user.preferred_zones.join(", ") || "Aucune"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <span className="text-foreground">{user.budget_max.toLocaleString("fr-FR")} FCFA</span>
                </div>
              </div>

              {/* Preferred chips */}
              {user.preferred_types.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {user.preferred_types.map((type) => (
                    <span
                      key={type}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-foreground text-background"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-xl font-medium transition-all duration-300"
                  onClick={() => router.push("/dashboard")}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Annonces
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-border hover:bg-muted rounded-xl font-medium transition-all duration-300"
                  onClick={() => router.push("/mes-annonces")}
                >
                  <HomeIcon className="w-4 h-4 mr-2" />
                  Mes annonces
                </Button>
              </div>

              <Button
                variant="secondary"
                className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-xl font-medium transition-all duration-300"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </Button>
            </div>

            {/* Shine effect */}
            <div
              className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `radial-gradient(circle at ${50 + rotateY * 2}% ${50 + rotateX * 2}%, rgba(0,0,0,0.03) 0%, transparent 70%)`,
              }}
            />
          </Card>

          {/* BACK */}
          <Card
            className="absolute inset-0 w-full overflow-hidden border border-border bg-card backface-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-foreground text-background hover:bg-foreground/90 border-0 shadow-sm rounded-full transition-all duration-300"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </Button>

            <div className="px-8 py-10 space-y-5 h-full overflow-y-auto max-h-[680px]">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-semibold text-foreground">Modifier le profil</h3>
                <p className="text-sm text-muted-foreground mt-1">Mettez à jour vos informations</p>
              </div>

              <div className="flex flex-col items-center gap-3 pb-4 border-b border-border">
                <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-border">
                  <Image src={profileImage || "/images/agent.jpg"} alt="Profile" fill className="object-cover" />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="border-border rounded-xl">
                  <Camera className="w-4 h-4 mr-2" />
                  Changer la photo
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prénom</label>
                    <Input
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      className="border-border bg-transparent rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nom</label>
                    <Input
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      className="border-border bg-transparent rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="border-border bg-transparent rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Téléphone</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="border-border bg-transparent rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bio</label>
                  <Textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    rows={3}
                    className="border-border bg-transparent resize-none rounded-xl"
                    placeholder="Parlez-nous de vous..."
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Budget max (FCFA)</label>
                  <Input
                    type="number"
                    value={form.budget_max}
                    onChange={(e) => setForm({ ...form, budget_max: Number(e.target.value) })}
                    className="border-border bg-transparent rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Types de biens préférés</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_PROPERTY_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleArrayValue("preferred_types", type)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          form.preferred_types.includes(type)
                            ? "bg-foreground text-background border-foreground"
                            : "bg-transparent text-foreground border-border hover:bg-muted"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Villes préférées</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_CITIES.map((city) => (
                      <button
                        key={city}
                        onClick={() => toggleArrayValue("preferred_zones", city)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          form.preferred_zones.includes(city)
                            ? "bg-foreground text-background border-foreground"
                            : "bg-transparent text-foreground border-border hover:bg-muted"
                        )}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-xl font-medium"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Enregistrer
                </Button>
              </div>
            </div>
          </Card>
        </div>
        </div>

        {/* Right analytics column */}
        <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
          <div className="p-5 rounded-2xl bg-card border border-border anim-fade-up">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-foreground" />
              <h3 className="text-sm font-bold text-foreground">Compte</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Membre depuis</span>
                <span className="text-sm font-semibold text-foreground">{memberSince}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Jours actifs</span>
                <span className="text-sm font-semibold text-foreground">{memberDays}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Statut</span>
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  user.status === "ACTIF" && "bg-green-100 text-green-700",
                  user.status === "SUSPENDU" && "bg-amber-100 text-amber-700",
                )}>{user.status}</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border anim-fade-up" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-foreground" />
              <h3 className="text-sm font-bold text-foreground">Répartition</h3>
            </div>
            <div className="space-y-3">
              {/* Mini bar chart */}
              <div className="space-y-2">
                <div className="flex items-end gap-1.5 h-20">
                  <div className="flex-1 bg-foreground/20 rounded-t-md flex items-end" title="Annonces">
                    <div className="w-full bg-foreground rounded-t-md transition-all duration-700" style={{ height: `${Math.min(100, (user.active_ads_count / Math.max(1, user.active_ads_count + 5)) * 100)}%` }} />
                  </div>
                  <div className="flex-1 bg-foreground/20 rounded-t-md flex items-end" title="Vues">
                    <div className="w-full bg-foreground rounded-t-md transition-all duration-700" style={{ height: `${Math.min(100, (user.total_views / Math.max(1, user.total_views + 50)) * 100)}%` }} />
                  </div>
                  <div className="flex-1 bg-foreground/20 rounded-t-md flex items-end" title="Contacts">
                    <div className="w-full bg-foreground rounded-t-md transition-all duration-700" style={{ height: `${Math.min(100, (user.total_contacts / Math.max(1, user.total_contacts + 10)) * 100)}%` }} />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Annonces</span>
                  <span>Vues</span>
                  <span>Contacts</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border anim-fade-up" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-foreground" />
              <h3 className="text-sm font-bold text-foreground">Préférences</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Types de biens</p>
                <div className="flex flex-wrap gap-1">
                  {user.preferred_types.length > 0 ? user.preferred_types.slice(0, 4).map((t: string) => (
                    <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-foreground">{t}</span>
                  )) : <span className="text-xs text-muted-foreground">Aucun</span>}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Zones</p>
                <div className="flex flex-wrap gap-1">
                  {user.preferred_zones.length > 0 ? user.preferred_zones.map((z: string) => (
                    <span key={z} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-foreground">{z}</span>
                  )) : <span className="text-xs text-muted-foreground">Aucune</span>}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
