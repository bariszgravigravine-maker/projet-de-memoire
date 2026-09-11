"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  MapPin, Bell, Search, Heart, Star, BedDouble, Bath,
  Flame, Wifi, Dices, Phone, MessageSquare, Trees, SlidersHorizontal,
  ChevronLeft, User, Calendar, Home, Grid2X2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NestFindLogo } from "@/components/nestfind-logo"
import { ProfileView } from "@/components/profile-view"

const TAGS = ["All", "Hills", "Comfy", "Resort", "Beach", "Villa", "Housing", "Forest"]
const ACTIVE_TAG_DEFAULT = "All"

const PROPERTIES = [
  { id: 1, name: "Summer Villa", location: "Batam, Indonesia", price: 400, img: "/images/house-1.jpg", liked: false, rating: 4.8, beds: 4, baths: 2 },
  { id: 2, name: "Solstice", location: "Lambak, Indonesia", price: 300, img: "/images/house-2.jpg", liked: true, rating: 5.0, beds: 5, baths: 3 },
  { id: 3, name: "Zenith", location: "Bali, Indonesia", price: 500, img: "/images/house-3.jpg", liked: false, rating: 4.7, beds: 6, baths: 4 },
  { id: 4, name: "Lumin House", location: "Bali, Indonesia", price: 200, img: "/images/house-4.jpg", liked: false, rating: 4.5, beds: 3, baths: 2 },
  { id: 5, name: "The Monolith", location: "Banten, Indonesia", price: 350, img: "/images/house-5.jpg", liked: false, rating: 4.6, beds: 4, baths: 3 },
  { id: 6, name: "Crestwood", location: "Bali, Indonesia", price: 280, img: "/images/house-6.jpg", liked: false, rating: 4.9, beds: 5, baths: 3 },
]

const AMENITIES = [
  { icon: BedDouble, label: "5 Room" },
  { icon: Bath, label: "3 Toilets" },
  { icon: Flame, label: "BBQ Area" },
  { icon: Trees, label: "Spa" },
  { icon: Wifi, label: "Free Wifi" },
  { icon: Dices, label: "Board Games" },
]

type NavItem = "home" | "liked" | "calendar" | "search" | "profile"

const NAV_ROUTES: Record<NavItem, string> = {
  home: "/dashboard",
  liked: "/dashboard/saved",
  calendar: "/dashboard/tours",
  search: "/dashboard/search",
  profile: "/dashboard/profile",
}

export function WebApp({ initialNav = "home" }: { initialNav?: NavItem }) {
  const router = useRouter()
  const [activeTag, setActiveTag] = useState(ACTIVE_TAG_DEFAULT)
  const [likedProps, setLikedProps] = useState<Set<number>>(
    new Set(PROPERTIES.filter(p => p.liked).map(p => p.id))
  )
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detailLiked, setDetailLiked] = useState(true)
  const [activeNav, setActiveNav] = useState<NavItem>(initialNav)
  const [searchQuery, setSearchQuery] = useState("")

  const handleNavClick = (nav: NavItem) => {
    setActiveNav(nav)
    router.push(NAV_ROUTES[nav])
  }

  const toggleLike = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setLikedProps(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selected = PROPERTIES.find(p => p.id === selectedId)

  const filtered = PROPERTIES.filter(p => {
    const tagMatch = activeTag === "All" || p.name.toLowerCase().includes(activeTag.toLowerCase()) || p.location.toLowerCase().includes(activeTag.toLowerCase())
    const searchMatch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.location.toLowerCase().includes(searchQuery.toLowerCase())
    return tagMatch && searchMatch
  }).filter(p => activeNav === "liked" ? likedProps.has(p.id) : true)

  return (
    <div className="w-full min-h-screen bg-background flex flex-col" style={{ fontFamily: "var(--font-inter, system-ui, sans-serif)" }}>
      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border anim-slide-down">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <NestFindLogo size="md" />

          {/* Location */}
          <div className="hidden sm:flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5">
            <MapPin size={13} className="text-muted-foreground" />
            <span className="text-[12px] text-muted-foreground font-medium">Elgin St. Celina, Delaware</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors relative">
              <Bell size={18} className="text-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
              <Grid2X2 size={18} className="text-foreground" />
            </button>
            <button className="w-9 h-9 rounded-full overflow-hidden border-2 border-foreground/10">
              <Image src="/images/agent.jpg" alt="Profile" width={36} height={36} className="object-cover w-full h-full" />
            </button>
          </div>
        </div>
      </header>

      {activeNav === "profile" ? (
        <div className="flex-1 w-full">
          <ProfileView />
        </div>
      ) : (
        <div className="max-w-screen-xl mx-auto w-full flex flex-col flex-1 px-6 py-6 gap-6">
          {/* ── Search + Filter row ── */}
        <div className="flex items-center gap-3 anim-fade-up" style={{ animationDelay: "60ms" }}>
          <div className="flex-1 flex items-center gap-3 bg-muted rounded-full px-4 py-3">
            <Search size={15} className="text-muted-foreground shrink-0" />
            <input
              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
              placeholder="Search your dream home..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 bg-foreground text-background text-[13px] font-semibold px-4 py-3 rounded-full hover:bg-foreground/90 transition-colors">
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

          {/* ── Tag filters ── */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 anim-fade-up" style={{ animationDelay: "120ms" }}>
          {TAGS.map((tag, i) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-[12.5px] font-medium border anim-fade-up",
                activeTag === tag
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-border hover:bg-muted"
              )}
              style={{
                animationDelay: `${120 + i * 30}ms`,
                transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.14s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseDown={e => (e.currentTarget.style.transform = "scale(0.92)")}
              onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* ── Main content: list + detail panel ── */}
        <div className="flex gap-6 flex-1">
          {/* Left column: property grid */}
          <div className={cn("flex-1 min-w-0", selected ? "lg:max-w-[60%]" : "")}>
            {/* Section label */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-foreground">
                {activeNav === "liked" ? "Saved Properties" : "Recent Listings"}
                <span className="ml-2 text-[12px] font-normal text-muted-foreground">{filtered.length} found</span>
              </h2>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Heart size={36} className="text-muted-foreground mb-3" />
                <p className="text-[14px] font-semibold text-foreground">No properties found</p>
                <p className="text-[12px] text-muted-foreground mt-1">Try adjusting your filters or search</p>
              </div>
            ) : (
              <div className={cn(
                "grid gap-4",
                selected ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
              )}>
                {filtered.map((prop, i) => (
                  <div
                    key={prop.id}
                    onClick={() => setSelectedId(selectedId === prop.id ? null : prop.id)}
                    className={cn(
                      "group rounded-2xl overflow-hidden bg-card border cursor-pointer anim-fade-up",
                      selectedId === prop.id ? "border-foreground shadow-lg ring-2 ring-foreground/10" : "border-border"
                    )}
                    style={{
                      animationDelay: `${i * 55}ms`,
                      transition: "transform 0.24s cubic-bezier(0.22,1,0.36,1), box-shadow 0.24s ease, border-color 0.2s ease",
                    }}
                    onMouseEnter={e => {
                      if (selectedId !== prop.id) {
                        ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"
                        ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)"
                      }
                    }}
                    onMouseLeave={e => {
                      ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
                      ;(e.currentTarget as HTMLDivElement).style.boxShadow = selectedId === prop.id ? "" : "none"
                    }}
                    onMouseDown={e => (e.currentTarget.style.transform = "translateY(-1px) scale(0.99)")}
                    onMouseUp={e => (e.currentTarget.style.transform = "translateY(-4px)")}
                  >
                    <div className="relative overflow-hidden" style={{ height: 176 }}>
                      <Image
                        src={prop.img}
                        alt={prop.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <button
                        onClick={e => toggleLike(prop.id, e)}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/85 backdrop-blur-sm rounded-full shadow-sm transition-transform hover:scale-110"
                      >
                        <Heart
                          size={14}
                          className={likedProps.has(prop.id) ? "fill-red-500 text-red-500" : "text-foreground/60"}
                        />
                      </button>
                      {/* Rating badge */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                        <Star size={9} fill="white" />
                        <span>{prop.rating}</span>
                      </div>
                    </div>
                    <div className="p-3.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[13.5px] font-bold text-foreground leading-tight">{prop.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground">{prop.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><BedDouble size={12} />{prop.beds} beds</span>
                        <span className="flex items-center gap-1"><Bath size={12} />{prop.baths} baths</span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[14px] font-bold text-foreground">${prop.price}<span className="text-[11px] font-normal text-muted-foreground">/day</span></span>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedId(prop.id) }}
                          className="bg-foreground text-background text-[11px] font-semibold px-3 py-1.5 rounded-full hover:bg-foreground/90 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column: detail panel */}
          {selected && (
            <div className="hidden lg:flex w-[360px] shrink-0 flex-col rounded-2xl overflow-hidden border border-border bg-card shadow-xl h-fit sticky top-24 anim-slide-right">
              {/* Hero */}
              <div className="relative overflow-hidden" style={{ height: 208 }}>
                <Image src={selected.img} alt={selected.name} fill sizes="360px" className="object-cover" priority />
                <button
                  onClick={() => setSelectedId(null)}
                  className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-white/90 transition-colors"
                >
                  <ChevronLeft size={18} className="text-foreground" />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-4">
                {/* Title row */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[18px] font-bold text-foreground leading-tight">{selected.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Ash Dr. San Jose, South Dakota 83475</p>
                  </div>
                  <button
                    onClick={() => setDetailLiked(l => !l)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors shrink-0"
                  >
                    <Heart size={15} className={detailLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
                  </button>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={13} className="fill-[var(--app-amber)] text-[var(--app-amber)]" />
                    ))}
                    <span className="text-[11px] text-muted-foreground ml-1">(5 Star Rating)</span>
                  </div>
                  <span className="text-[16px] font-bold text-foreground">${selected.price}<span className="text-[11px] font-normal text-muted-foreground">/Day</span></span>
                </div>

                <div className="border-t border-border" />

                {/* Amenities */}
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
                  {AMENITIES.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Icon size={13} className="text-foreground" />
                      </div>
                      <span className="text-[12px] text-foreground">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border" />

                {/* Agent */}
                <div>
                  <p className="text-[12px] font-semibold text-foreground mb-3">Listing Agent</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-border shrink-0">
                        <Image src="/images/agent.jpg" alt="Wade Warren" width={40} height={40} className="object-cover w-full h-full" />
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-foreground">Wade Warren</p>
                        <p className="text-[10px] text-muted-foreground">Partner Agent</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="w-8 h-8 flex items-center justify-center border border-border rounded-full hover:bg-muted transition-colors">
                        <Phone size={13} className="text-foreground" />
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center border border-border rounded-full hover:bg-muted transition-colors">
                        <MessageSquare size={13} className="text-foreground" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Overview */}
                <div>
                  <p className="text-[12px] font-semibold text-foreground mb-1.5">Overview</p>
                  <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                    Escape to villas where tropical charm meets modern luxury. Each residence promises spacious privacy and breathtaking ocean views, complemented by complete amenities for a truly unforgettable stay.
                  </p>
                </div>

                {/* CTA */}
                <button className="w-full bg-foreground text-background font-semibold text-[13.5px] py-3.5 rounded-full hover:bg-foreground/90 transition-opacity">
                  Virtual Tour
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* ── Bottom Nav (mobile web view) ── */}
      <div className="sticky bottom-0 z-20 lg:hidden bg-background/95 backdrop-blur border-t border-border">
        <div className="flex items-center justify-around py-2 px-4">
          {([
            { id: "home" as NavItem, icon: Home, label: "Home" },
            { id: "liked" as NavItem, icon: Heart, label: "Saved" },
            { id: "calendar" as NavItem, icon: Calendar, label: "Tours" },
            { id: "search" as NavItem, icon: Search, label: "Search" },
            { id: "profile" as NavItem, icon: User, label: "Profile" },
          ]).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors",
                activeNav === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Desktop sidebar nav ── */}
      <nav className="fixed left-0 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-2 bg-background/80 backdrop-blur border border-border rounded-2xl p-2 ml-3 shadow-lg z-20">
        {([
          { id: "home" as NavItem, icon: Home },
          { id: "liked" as NavItem, icon: Heart },
          { id: "calendar" as NavItem, icon: Calendar },
          { id: "search" as NavItem, icon: Search },
          { id: "profile" as NavItem, icon: User },
        ]).map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleNavClick(id)}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-xl transition-colors",
              activeNav === id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon size={18} />
          </button>
        ))}
      </nav>
    </div>
  )
}
