"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  MapPin, Bell, Search, Heart, User, Home,
  Grid2X2, MessageSquare, Shield, Plus, Filter, TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NestFindLogo } from "@/components/nestfind-logo"
import { countUnreadMessages, listNotifications, getUser } from "@/lib/api"
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
  const pathname = usePathname() || "/dashboard"
  const activeNav = PATH_TO_NAV[pathname] || "home"

  const handleNavClick = (nav: NavItem) => {
    window.location.href = NAV_ROUTES[nav]
  }

  const isSearchPage = pathname === "/dashboard/search"
  const { unreadMessages: rtMessages, unreadNotifs: rtNotifs, setUnreadMessages, setUnreadNotifs } = useRealtime()

  // Avatar réel de l'utilisateur (photo choisie à l'onboarding / profil)
  const [avatar, setAvatar] = useState("/images/agent.jpg")
  useEffect(() => {
    const u = getUser()
    if (u?.profile_photo_url) setAvatar(u.profile_photo_url)
  }, [])

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
      } catch {}
    }
    loadBadges()
    const interval = setInterval(loadBadges, 30000)
    return () => { mounted = false; clearInterval(interval) }
  }, [isSearchPage, setUnreadMessages, setUnreadNotifs])

  return (
    <div className="w-full min-h-screen bg-background flex flex-col" style={{ fontFamily: "var(--font-inter, system-ui, sans-serif)" }}>

      {/* ── Top Nav — demo mobile style ── */}
      {!isSearchPage && (
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/40 anim-slide-down">
        {/* Logo row */}
        <div className="flex items-center justify-center py-2 border-b border-border/40">
          <NestFindLogo size="sm" />
        </div>
        {/* Location + actions row */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-foreground" />
            <span className="text-[12px] font-medium text-foreground">Yaoundé, Cameroun</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.href = "/notifications"}
              className="w-8 h-8 flex items-center justify-center relative transition-transform active:scale-90 hover:scale-110"
            >
              <Bell size={17} className="text-foreground" />
              {rtNotifs > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center anim-pop-in">
                  {rtNotifs > 99 ? "99+" : rtNotifs}
                </span>
              )}
            </button>
            <button
              onClick={() => window.location.href = "/criteres"}
              className="w-8 h-8 flex items-center justify-center"
              style={{ transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)" }}
              onMouseDown={e => (e.currentTarget.style.transform = "scale(0.88)")}
              onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Grid2X2 size={17} className="text-foreground" />
            </button>
            <button
              onClick={() => window.location.href = "/dashboard/profile"}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-foreground/10 hover:opacity-80 transition-opacity"
            >
              <Image src={avatar} alt="Profile" width={32} height={32} className="object-cover w-full h-full" />
            </button>
          </div>
        </div>
      </header>
      )}

      {/* ── Main content ── */}
      <main className={cn(
        "max-w-screen-xl mx-auto w-full flex flex-col flex-1 relative",
        isSearchPage ? "p-0" : "px-4 py-4 xl:pl-20 gap-4"
      )}>
        {children}
      </main>

      {/* ── Bottom Nav — demo mobile style (pill dark bar, circular icons) ── */}
      {!isSearchPage && (
      <div className="sticky bottom-0 z-20 xl:hidden px-4 pb-3 pt-1 bg-background">
        <div className="bg-[var(--app-nav-bg)] rounded-full flex items-center justify-around py-3 px-2">
          {NAV_ITEMS.map(({ id, icon: Icon }) => {
            const badge = id === "messages" ? rtMessages : 0
            return (
              <button
                key={id}
                onClick={() => handleNavClick(id)}
                className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-full relative",
                  activeNav === id ? "bg-white" : ""
                )}
                style={{
                  transition: "background 0.22s cubic-bezier(0.22,1,0.36,1), transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
                }}
                onMouseDown={e => (e.currentTarget.style.transform = "scale(0.86)")}
                onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                <Icon size={17} className={cn(
                  activeNav === id ? "text-foreground" : "text-white/60",
                )} />
                {badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center bg-red-500 text-white text-[8px] font-bold rounded-full">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      )}

      {/* ── Desktop sidebar — same icons/style, vertical ── */}
      {!isSearchPage && (
      <nav className="fixed left-0 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-1 bg-[var(--app-nav-bg)] rounded-full p-2 ml-3 shadow-lg z-20">
        {NAV_ITEMS.map(({ id, icon: Icon }) => {
          const badge = id === "messages" ? rtMessages : 0
          return (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-full relative",
                activeNav === id ? "bg-white" : ""
              )}
              style={{
                transition: "background 0.22s cubic-bezier(0.22,1,0.36,1), transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseDown={e => (e.currentTarget.style.transform = "scale(0.86)")}
              onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Icon size={18} className={cn(
                activeNav === id ? "text-foreground" : "text-white/60",
              )} />
              {badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center bg-red-500 text-white text-[8px] font-bold rounded-full">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </button>
          )
        })}
        <div className="w-5 h-px bg-white/10 my-1" />
        <button
          onClick={() => window.location.href = "/annonce/publier"}
          className="w-10 h-10 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10"
          title="Publier une annonce"
          style={{
            transition: "background 0.22s cubic-bezier(0.22,1,0.36,1), color 0.22s ease, transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
          }}
          onMouseDown={e => (e.currentTarget.style.transform = "scale(0.86)")}
          onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Plus size={18} />
        </button>
      </nav>
      )}
    </div>
  )
}
