"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Check, X, Users, Home, BarChart3,
  Shield, Ban, Trash2, AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/skeleton"
import {
  adminListPendingAds, adminValidateAd, adminRejectAd,
  adminListUsers, adminUpdateUserStatus, adminDeleteUser, adminStats
} from "@/lib/api"

type Tab = "pending" | "users" | "stats"

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("pending")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingAds, setPendingAds] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [adsRes, usersRes, statsRes] = await Promise.all([
        adminListPendingAds().catch(() => ({ data: [] })),
        adminListUsers().catch(() => ({ data: [] })),
        adminStats().catch(() => ({ data: null })),
      ])
      setPendingAds(adsRes.data || adsRes || [])
      setUsers(usersRes.data || usersRes || [])
      setStats(statsRes.data || statsRes)
    } catch (err: any) {
      setError(err.message || "Accès refusé. Rôle admin requis.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleValidate = async (id: string) => {
    setActionLoading(id)
    try {
      await adminValidateAd(id)
      setPendingAds((prev) => prev.filter((a) => a.id !== id))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm("Rejeter cette annonce ?")) return
    setActionLoading(id)
    try {
      await adminRejectAd(id)
      setPendingAds((prev) => prev.filter((a) => a.id !== id))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    setActionLoading(`user-${id}`)
    try {
      await adminUpdateUserStatus(id, status)
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Supprimer définitivement cet utilisateur ?")) return
    setActionLoading(`user-${id}`)
    try {
      await adminDeleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/dashboard")} className="p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <Shield className="w-5 h-5 text-foreground" />
        <h1 className="text-lg font-bold text-foreground">Panneau d'administration</h1>
      </header>

      {/* Tabs */}
      <div className="sticky top-[57px] z-20 bg-background/95 backdrop-blur border-b border-border px-4">
        <div className="max-w-4xl mx-auto flex gap-1">
          {[
            { id: "pending" as Tab, label: "Annonces en attente", icon: Home, count: pendingAds.length },
            { id: "users" as Tab, label: "Utilisateurs", icon: Users, count: users.length },
            { id: "stats" as Tab, label: "Statistiques", icon: BarChart3, count: 0 },
          ].map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                tab === id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
              {count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-foreground text-background text-[10px] font-bold">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-2xl bg-card border border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-7 w-16 rounded-full" />
                    <Skeleton className="h-7 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle size={40} className="text-red-500 mb-3" />
            <p className="text-sm font-semibold text-foreground">{error}</p>
          </div>
        )}

        {!loading && !error && tab === "pending" && (
          <div className="space-y-3">
            {pendingAds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Check size={40} className="text-green-500 mb-3" />
                <p className="text-sm font-semibold text-foreground">Aucune annonce en attente</p>
                <p className="text-xs text-muted-foreground mt-1">Toutes les annonces ont été traitées</p>
              </div>
            ) : (
              pendingAds.map((ad) => (
                <div key={ad.id} className="p-4 rounded-2xl bg-card border border-border anim-fade-up">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground">{ad.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {ad.price?.toLocaleString("fr-FR")} FCFA
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {ad.description || "Aucune description"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleValidate(ad.id)}
                        disabled={actionLoading === ad.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === ad.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Valider
                      </button>
                      <button
                        onClick={() => handleReject(ad.id)}
                        disabled={actionLoading === ad.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <X className="w-3 h-3" />
                        Rejeter
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && !error && tab === "users" && (
          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Users size={40} className="text-muted-foreground mb-3" />
                <p className="text-sm font-semibold text-foreground">Aucun utilisateur</p>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="p-4 rounded-2xl bg-card border border-border anim-fade-up">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm shrink-0">
                        {(user.first_name || user.email || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground">
                            {user.role}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                            user.status === "ACTIF" && "bg-green-100 text-green-700",
                            user.status === "SUSPENDU" && "bg-amber-100 text-amber-700",
                            user.status === "SUPPRIME" && "bg-red-100 text-red-700",
                          )}>
                            {user.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {user.status !== "SUSPENDU" && (
                        <button
                          onClick={() => handleStatusChange(user.id, "SUSPENDU")}
                          disabled={actionLoading === `user-${user.id}`}
                          className="p-2 rounded-full hover:bg-amber-50 text-amber-600 transition-colors disabled:opacity-50"
                          title="Suspendre"
                        >
                          {actionLoading === `user-${user.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                        </button>
                      )}
                      {user.status === "SUSPENDU" && (
                        <button
                          onClick={() => handleStatusChange(user.id, "ACTIF")}
                          disabled={actionLoading === `user-${user.id}`}
                          className="p-2 rounded-full hover:bg-green-50 text-green-600 transition-colors disabled:opacity-50"
                          title="Réactiver"
                        >
                          {actionLoading === `user-${user.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={actionLoading === `user-${user.id}`}
                        className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && !error && tab === "stats" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats ? (
              Object.entries(stats).map(([key, value]: [string, any]) => (
                <div key={key} className="p-6 rounded-2xl bg-card border border-border text-center anim-fade-up">
                  <p className="text-3xl font-bold text-foreground">{typeof value === "number" ? value.toLocaleString("fr-FR") : String(value)}</p>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">{key.replace(/_/g, " ")}</p>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <BarChart3 size={40} className="text-muted-foreground mb-3" />
                <p className="text-sm font-semibold text-foreground">Statistiques non disponibles</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
