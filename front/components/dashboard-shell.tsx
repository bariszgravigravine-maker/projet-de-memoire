"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import {
  MapPin, Bell, Search, Heart, User, Home,
  Grid2X2, MessageSquare, Bell as BellIcon, Shield, Plus, Filter, TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NestFindLogo } from "@/components/nestfind-logo"
import { countUnreadMessages, listNotifications } from "@/lib/api"
import { useRealtime } from "@/components/realtime-provider"

type NavItem = "home" | "liked" | "search" | "messages" | "profile"

const NAV_ROUTES: Record<NavItem, string> = {
  home: "/dashboard",
  liked: "/dashboard/saved",
  search: "/dashboard/search",
  messages: "/messages",
  profile: "/dashboard/profile",
}

const NAV_ITEMS: { id: NavItem; icon: typeof Home; label: string }[] = [
  { id: "home", icon: Home, label: "Home" },
  { id: "liked", icon: Heart, label: "Saved" },
  { id: "search", icon: Search, label: "Search" },
  { id: "messages", icon: MessageSquare, label: "Messages" },
  { id: "profile", icon: User, label: "Profile" },
]

const PATH_TO_NAV: Record<string, NavItem> = {
  "/dashboard": "home",
  "/dashboard/saved": "liked",
  "/dashboard/search": "search",
  "/messages": "messages",
  "/dashboard/profile": "profile",
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() || "/dashboard"
  const activeNav = PATH_TO_NAV[pathname] || "home"
  const [searchQuery, setSearchQuery] = useState("")

  const handleNavClick = (nav: NavItem) => {
    router.push(NAV_ROUTES[nav])
  }

  const isSearchPage = pathname === "/dashboard/search"
  const { unreadMessages: rtMessages, unreadNotifs: rtNotifs, setUnreadMessages, setUnreadNotifs } = useRealtime()

  useEffect(() => {
    if (isSearchPage) return
    let mounted = true
    async function loadBadges() {
      try {
        const [msgRes, notifRes] = await Promise.all([
          countUnreadMessages().catch(() => ({ data: { count: 0 } })),
          listNotifications().catch(() => ({ data: [] })),
        ])
        if (!mounted) return
        setUnreadMessages(msgRes.data?.count || 0)
        const notifs = notifRes.data || notifRes || []
        const unread = Array.isArray(notifs) ? notifs.filter((n: any) => !n.is_read).length : 0
        setUnreadNotifs(unread)
      } catch {
        // ignore
      }
    }
    loadBadges()
    const interval = setInterval(loadBadges, 30000)
    return () => { mounted = false; clearInterval(interval) }
  }, [isSearchPage, setUnreadMessages, setUnreadNotifs])

  return (
    <div className="w-full min-h-screen bg-background flex flex-col" style={{ fontFamily: "var(--font-inter, system-ui, sans-serif)" }}>
      {/* ── Top Nav (persistent, hidden on search full-screen) ── */}
      {!isSearchPage && (
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border anim-slide-down">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between px-6 py-3">
          <NestFindLogo size="md" />

          <div className="hidden sm:flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5">
            <MapPin size={13} className="text-muted-foreground" />
            <span className="text-[12px] text-muted-foreground font-medium">Elgin St. Celina, Delaware</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/notifications")}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors relative"
              title="Notifications"
            >
              <Bell size={18} className="text-foreground" />
              {rtNotifs > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {rtNotifs > 99 ? "99+" : rtNotifs}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push("/criteres")}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              title="Critères de recherche"
            >
              <Filter size={18} className="text-foreground" />
            </button>
            <button
              onClick={() => router.push("/estimation")}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              title="Estimation IA"
            >
              <TrendingUp size={18} className="text-foreground" />
            </button>
            <button
              onClick={() => router.push("/admin")}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              title="Administration"
            >
              <Shield size={18} className="text-foreground" />
            </button>
            <button
              onClick={() => router.push("/dashboard/profile")}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-foreground/10 hover:opacity-80 transition-opacity"
            >
              <Image src="/images/agent.jpg" alt="Profile" width={36} height={36} className="object-cover w-full h-full" />
            </button>
          </div>
        </div>
      </header>
      )}

      {/* ── Main content area ── */}
      <main className={cn(
        "max-w-screen-xl mx-auto w-full flex flex-col flex-1 relative",
        pathname === "/dashboard/search" ? "p-0" : "px-6 py-6 gap-6"
      )}>
        {children}
      </main>

      {/* ── Bottom Nav (mobile web view, hidden on search) ── */}
      {!isSearchPage && (
      <div className="sticky bottom-0 z-20 lg:hidden bg-background/95 backdrop-blur border-t border-border">
        <div className="flex items-center justify-around py-2 px-4">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
            const badge = id === "messages" ? rtMessages : id === "liked" ? 3 : 0
            return (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative",
                activeNav === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon size={20} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </button>
            )
          })}
        </div>
      </div>
      )}

      {/* ── Desktop sidebar nav (hidden on search) ── */}
      {!isSearchPage && (
      <nav className="fixed left-0 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-2 bg-background/80 backdrop-blur border border-border rounded-2xl p-2 ml-3 shadow-lg z-20">
        {NAV_ITEMS.map(({ id, icon: Icon }) => {
          const badge = id === "messages" ? rtMessages : id === "liked" ? 3 : 0
          return (
          <button
            key={id}
            onClick={() => handleNavClick(id)}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-xl transition-colors relative",
              activeNav === id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon size={18} />
            {badge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </button>
          )
        })}
        <div className="w-6 h-px bg-border my-1" />
        <button
          onClick={() => router.push("/mes-annonces")}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Mes annonces"
        >
          <Home size={18} />
        </button>
        <button
          onClick={() => router.push("/annonce/publier")}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors"
          title="Publier une annonce"
        >
          <Plus size={18} />
        </button>
      </nav>
      )}
    </div>
  )
}
