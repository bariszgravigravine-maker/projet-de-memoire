"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Bell, Check, CheckCheck, Home, MapPin, MessageSquare, Trash2, ArrowLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/skeleton"
import {
  listNotifications, markNotificationRead, markAllNotificationsRead, countUnreadNotifications
} from "@/lib/api"

const TYPE_ICONS: Record<string, typeof Bell> = {
  NOUVELLE_ANNONCE: Home,
  MESSAGE: MessageSquare,
  CONTACT: MapPin,
  default: Bell,
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr)
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days} j`
  return date.toLocaleDateString("fr-FR")
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [notifRes, countRes] = await Promise.all([
        listNotifications(),
        countUnreadNotifications().catch(() => ({ data: { count: 0 } })),
      ])
      setNotifications(notifRes.data || notifRes || [])
      setUnreadCount(countRes.data?.count || 0)
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
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
          <h1 className="text-lg font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {notifications.length > 0 && unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:bg-muted px-3 py-1.5 rounded-full transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Tout lire
          </button>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-card">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-semibold text-foreground">{error}</p>
            <button onClick={fetchAll} className="mt-4 px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium">
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell size={40} className="text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-foreground">Aucune notification</p>
            <p className="text-xs text-muted-foreground mt-1">Vous serez notifié des nouvelles annonces et messages</p>
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          notifications.map((notif, i) => {
            const Icon = TYPE_ICONS[notif.type] || TYPE_ICONS.default
            return (
              <div
                key={notif.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-2xl border anim-fade-up transition-all",
                  notif.is_read
                    ? "bg-card border-border"
                    : "bg-foreground/5 border-foreground/20"
                )}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  notif.is_read ? "bg-muted text-foreground" : "bg-foreground text-background"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{notif.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(notif.created_at)}</p>
                </div>
                {!notif.is_read && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="p-2 rounded-full hover:bg-muted transition-colors shrink-0"
                    title="Marquer comme lu"
                  >
                    <Check className="w-4 h-4 text-foreground" />
                  </button>
                )}
              </div>
            )
          })
        )}
      </main>
    </div>
  )
}
