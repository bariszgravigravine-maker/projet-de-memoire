"use client"

import { useState } from "react"
import Image from "next/image"
import {
  MapPin, Bell, Grid2X2, Search, Heart, Calendar, User, Home
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NestFindLogo } from "@/components/nestfind-logo"

const TAGS = ["Hills", "Comfy", "Resort", "Beach", "Villa", "Housing", "Forest", "Nearest", "Agriculture"]
const ACTIVE_TAGS_DEFAULT = new Set(["Comfy", "Beach", "Villa"])

export const PROPERTIES = [
  { id: 1, name: "Summer Villa", location: "Batam, Indonesia", price: "$400/day", img: "/images/house-1.jpg", liked: false },
  { id: 2, name: "Solstice", location: "Lambak, Indonesia", price: "$300/day", img: "/images/house-2.jpg", liked: true },
  { id: 3, name: "Zenith", location: "Bali, Indonesia", price: "$500/day", img: "/images/house-3.jpg", liked: false },
  { id: 4, name: "Lumin House", location: "Bali, Indonesia", price: "$200/day", img: "/images/house-4.jpg", liked: false },
  { id: 5, name: "The Monolith", location: "Banten, Indonesia", price: "$350/day", img: "/images/house-5.jpg", liked: false },
  { id: 6, name: "Crestwood", location: "Bali, Indonesia", price: "$280/day", img: "/images/house-6.jpg", liked: false },
]

type NavTab = "home" | "liked" | "calendar" | "search" | "profile"

interface ListingScreenProps {
  onSelectProperty: (id: number) => void
}

export function ListingScreen({ onSelectProperty }: ListingScreenProps) {
  const [activeNav, setActiveNav] = useState<NavTab>("home")
  const [likedProps, setLikedProps] = useState<Set<number>>(
    new Set(PROPERTIES.filter(p => p.liked).map(p => p.id))
  )
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set(ACTIVE_TAGS_DEFAULT))
  const [searchValue, setSearchValue] = useState("")
  const [tabKey, setTabKey] = useState(0)

  const switchTab = (tab: NavTab) => {
    setActiveNav(tab)
    setTabKey(k => k + 1)
  }

  const toggleLike = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setLikedProps(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleTag = (tag: string) => {
    setActiveTags(prev => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  const displayed = PROPERTIES.filter(p => {
    if (activeNav === "liked") return likedProps.has(p.id)
    if (activeNav === "search") return searchValue
      ? p.name.toLowerCase().includes(searchValue.toLowerCase()) || p.location.toLowerCase().includes(searchValue.toLowerCase())
      : true
    return true
  })

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden">
      {/* Logo — top of listing screen */}
      <div className="flex items-center justify-center py-2 shrink-0 anim-fade-in border-b border-border/40">
        <NestFindLogo size="sm" />
      </div>

      {/* Header — slides down on mount */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0 anim-slide-down">
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="text-foreground" />
          <span className="text-[12px] font-medium text-foreground">Elgin St. Celina, Delaware</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 flex items-center justify-center relative transition-transform active:scale-90 hover:scale-110"
            style={{ transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)" }}
          >
            <Bell size={17} className="text-foreground" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full anim-pop-in" />
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center"
            style={{ transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)" }}
            onMouseDown={e => (e.currentTarget.style.transform = "scale(0.88)")}
            onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Grid2X2 size={17} className="text-foreground" />
          </button>
        </div>
      </div>

      {/* Search bar — fades up */}
      <div className="px-4 pb-3 shrink-0 anim-fade-up" style={{ animationDelay: "60ms" }}>
        <div
          className="flex items-center gap-2 bg-muted rounded-full px-4 py-2.5"
          style={{ transition: "box-shadow 0.2s ease" }}
          onFocusCapture={e => (e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,0,0,0.12)")}
          onBlurCapture={e => (e.currentTarget.style.boxShadow = "none")}
        >
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            className="flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground outline-none"
            placeholder="Let's start looking for your dream home..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
          />
        </div>
      </div>

      {/* Tab content — key forces re-mount = fresh animation */}
      <div key={tabKey} className="flex-1 flex flex-col min-h-0 anim-fade-up" style={{ animationDuration: "0.32s" }}>

        {activeNav === "search" ? (
          <div className="flex-1 overflow-y-auto px-4 pb-2 scrollbar-hide scroll-smooth-momentum">
            {displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center anim-scale-in">
                <Search size={28} className="text-muted-foreground mb-2" />
                <p className="text-[13px] font-semibold text-foreground">No results found</p>
                <p className="text-[11px] text-muted-foreground mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {displayed.map((prop, i) => (
                  <PropertyCard key={prop.id} prop={prop} liked={likedProps.has(prop.id)} onLike={toggleLike} onSelect={() => onSelectProperty(prop.id)} index={i} />
                ))}
              </div>
            )}
          </div>

        ) : activeNav === "liked" ? (
          <div className="flex-1 overflow-y-auto px-4 pb-2 scrollbar-hide scroll-smooth-momentum">
            <p className="text-[13px] font-semibold text-foreground mb-3 anim-fade-in">Saved Properties</p>
            {displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center anim-scale-in">
                <Heart size={28} className="text-muted-foreground mb-2" />
                <p className="text-[13px] font-semibold text-foreground">No saved properties</p>
                <p className="text-[11px] text-muted-foreground mt-1">Tap the heart icon to save a property</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {displayed.map((prop, i) => (
                  <PropertyCard key={prop.id} prop={prop} liked={likedProps.has(prop.id)} onLike={toggleLike} onSelect={() => onSelectProperty(prop.id)} index={i} />
                ))}
              </div>
            )}
          </div>

        ) : activeNav === "calendar" ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-2 anim-scale-in">
            <Calendar size={40} className="text-muted-foreground mb-3" />
            <p className="text-[14px] font-semibold text-foreground">No Tours Scheduled</p>
            <p className="text-[12px] text-muted-foreground mt-1 text-center">Book a virtual or in-person tour from any property listing.</p>
          </div>

        ) : activeNav === "profile" ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-2 gap-3">
            <div
              className="w-16 h-16 rounded-full overflow-hidden border-2 border-border anim-pop-in"
              style={{ animationDelay: "0ms" }}
            >
              <Image src="/images/agent.jpg" alt="Profile" width={64} height={64} className="object-cover w-full h-full" />
            </div>
            <div className="text-center anim-fade-up" style={{ animationDelay: "100ms" }}>
              <p className="text-[15px] font-bold text-foreground">Wade Warren</p>
              <p className="text-[12px] text-muted-foreground">Partner Agent · Celina, DE</p>
            </div>
            <div className="w-full grid grid-cols-3 gap-3 mt-2">
              {[
                { label: "Listings", value: "24" },
                { label: "Sold", value: "18" },
                { label: "Reviews", value: "4.9★" },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="bg-muted rounded-2xl p-3 text-center anim-fade-up"
                  style={{ animationDelay: `${200 + i * 80}ms` }}
                >
                  <p className="text-[16px] font-bold text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

        ) : (
          /* Home tab */
          <>
            {/* Recent Search tags */}
            <div className="px-4 pb-2 shrink-0 anim-fade-up" style={{ animationDelay: "80ms" }}>
              <p className="text-[13px] font-semibold text-foreground mb-2">Recent Search</p>
              <div className="flex flex-wrap gap-1.5">
                {TAGS.map((tag, i) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[11px] font-medium border anim-fade-up",
                      activeTags.has(tag)
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    )}
                    style={{
                      animationDelay: `${i * 35}ms`,
                      transition: "background 0.18s ease, color 0.18s ease, transform 0.14s cubic-bezier(0.34,1.56,0.64,1)",
                    }}
                    onMouseDown={e => (e.currentTarget.style.transform = "scale(0.92)")}
                    onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Property grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-2 scrollbar-hide scroll-smooth-momentum">
              <div className="grid grid-cols-2 gap-3">
                {PROPERTIES.map((prop, i) => (
                  <PropertyCard
                    key={prop.id}
                    prop={prop}
                    liked={likedProps.has(prop.id)}
                    onLike={toggleLike}
                    onSelect={() => onSelectProperty(prop.id)}
                    index={i}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="shrink-0 px-4 pb-2 pt-2 bg-background anim-slide-up" style={{ animationDelay: "150ms" }}>
        <div className="bg-[var(--app-nav-bg)] rounded-full flex items-center justify-around py-3 px-2">
          {([
            { id: "home" as NavTab, icon: Home },
            { id: "liked" as NavTab, icon: Heart },
            { id: "calendar" as NavTab, icon: Calendar },
            { id: "search" as NavTab, icon: Search },
            { id: "profile" as NavTab, icon: User },
          ]).map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-full",
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
              )}
              style={{ transition: "color 0.2s ease" } as React.CSSProperties}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Reusable property card with stagger + hover lift ── */
function PropertyCard({
  prop, liked, onLike, onSelect, index = 0,
}: {
  prop: typeof PROPERTIES[0]
  liked: boolean
  onLike: (id: number, e: React.MouseEvent) => void
  onSelect: () => void
  index?: number
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden bg-card border border-border cursor-pointer anim-fade-up"
      style={{
        animationDelay: `${index * 60}ms`,
        transition: "transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease",
      }}
      onClick={onSelect}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px) scale(1.01)"
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0) scale(1)"
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = "none"
      }}
      onMouseDown={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "scale(0.97)"
      }}
      onMouseUp={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px) scale(1.01)"
      }}
    >
      <div className="relative overflow-hidden" style={{ height: 90 }}>
        <Image
          src={prop.img}
          alt={prop.name}
          fill
          sizes="160px"
          className="object-cover"
          style={{ transition: "transform 0.4s ease" }}
        />
        <button
          onClick={e => onLike(prop.id, e)}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-white/80 rounded-full backdrop-blur-sm"
          style={{ transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}
          onMouseDown={e => {
            e.stopPropagation()
            ;(e.currentTarget as HTMLButtonElement).style.transform = "scale(0.8)"
          }}
          onMouseUp={e => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = "scale(1.2)"
            setTimeout(() => {
              if (e.currentTarget) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"
            }, 200)
          }}
        >
          <Heart
            size={12}
            className={liked ? "fill-red-500 text-red-500" : "text-foreground/60"}
            style={{ transition: "fill 0.2s ease, color 0.2s ease" }}
          />
        </button>
      </div>
      <div className="p-2">
        <p className="text-[11.5px] font-semibold text-foreground leading-tight">{prop.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin size={9} className="text-muted-foreground" />
          <span className="text-[9.5px] text-muted-foreground">{prop.location}</span>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] font-semibold text-foreground">{prop.price}</span>
          <button
            onClick={e => { e.stopPropagation(); onSelect() }}
            className="bg-foreground text-background text-[9px] font-semibold px-2.5 py-1 rounded-full"
            style={{ transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), background 0.15s ease" }}
            onMouseDown={e => { e.stopPropagation(); (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.9)" }}
            onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)" }}
          >
            Order
          </button>
        </div>
      </div>
    </div>
  )
}
