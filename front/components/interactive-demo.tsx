"use client"

import { useState } from "react"
import { MapPin, Star, Heart, BedDouble, Bath, Wifi, ChevronRight, Search } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

const DEMO_PROPERTIES = [
  { id: 1, name: "Villa Estivale", location: "Bastos, Yaoundé", price: 400, img: "/images/house-1.jpg", rating: 4.8, beds: 4, baths: 2, tag: "Villa" },
  { id: 2, name: "Résidence Bonapriso", location: "Bonapriso, Douala", price: 300, img: "/images/house-2.jpg", rating: 5.0, beds: 5, baths: 3, tag: "Confort" },
  { id: 3, name: "Zenith", location: "Bonanjo, Douala", price: 500, img: "/images/house-3.jpg", rating: 4.7, beds: 6, baths: 4, tag: "Luxe" },
  { id: 4, name: "Maison Lumin", location: "Mvan, Yaoundé", price: 200, img: "/images/house-4.jpg", rating: 4.5, beds: 3, baths: 2, tag: "Collines" },
]

const FILTERS = ["Tous", "Villa", "Confort", "Luxe", "Collines", "Plage"]

export function InteractiveDemo() {
  const [activeFilter, setActiveFilter] = useState("All")
  const [liked, setLiked] = useState<Set<number>>(new Set([2]))
  const [selected, setSelected] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [hovered, setHovered] = useState<number | null>(null)

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setLiked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = DEMO_PROPERTIES.filter(p => {
    const tagMatch = activeFilter === "Tous" || p.tag === activeFilter
    const searchMatch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase())
    return tagMatch && searchMatch
  })

  const selectedProp = DEMO_PROPERTIES.find(p => p.id === selected)

  return (
    <section className="w-full py-16 px-4 bg-gradient-to-b from-[var(--app-bg)] to-background">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10 anim-fade-up">
          <h2 className="text-[28px] sm:text-[36px] font-bold text-foreground leading-tight text-balance">
            Essayez avant de vous engager
          </h2>
          <p className="text-[14px] text-muted-foreground mt-2 max-w-md mx-auto text-pretty">
            Filtrez, explorez et sélectionnez des biens en temps réel — sans compte requis.
          </p>
        </div>

        {/* Demo panel */}
        <div
          className="rounded-3xl border border-border bg-background shadow-2xl overflow-hidden anim-fade-up"
          style={{ animationDelay: "120ms", boxShadow: "0 32px 80px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.06)" }}
        >
          {/* Demo top bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex items-center gap-2 bg-background rounded-full px-3 py-1.5 border border-border flex-1 mx-6 max-w-xs">
              <Search size={11} className="text-muted-foreground" />
              <input
                className="flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground outline-none"
                placeholder="Rechercher des biens..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span className="text-[11px] text-muted-foreground font-medium hidden sm:block">Démo NestFind</span>
          </div>

          <div className="flex h-[420px]">
            {/* Left: filter + cards */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-border">
              {/* Filter chips */}
              <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-border shrink-0">
                {FILTERS.map((f, i) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={cn(
                      "shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border anim-fade-up",
                      activeFilter === f
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    )}
                    style={{
                      animationDelay: `${i * 40}ms`,
                      transition: "all 0.18s cubic-bezier(0.34,1.56,0.64,1)",
                    }}
                    onMouseDown={e => (e.currentTarget.style.transform = "scale(0.9)")}
                    onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Property cards */}
              <div className="flex-1 overflow-y-auto p-4 scrollbar-hide scroll-smooth-momentum">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center anim-scale-in">
                    <Search size={28} className="text-muted-foreground mb-2" />
                    <p className="text-[13px] font-semibold text-foreground">Aucun résultat</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Essayez un autre filtre</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filtered.map((prop, i) => (
                      <div
                        key={prop.id}
                        onClick={() => setSelected(selected === prop.id ? null : prop.id)}
                        onMouseEnter={() => setHovered(prop.id)}
                        onMouseLeave={() => setHovered(null)}
                        className={cn(
                          "rounded-2xl overflow-hidden border cursor-pointer anim-fade-up",
                          selected === prop.id
                            ? "border-foreground ring-2 ring-foreground/10 shadow-lg"
                            : "border-border"
                        )}
                        style={{
                          animationDelay: `${i * 60}ms`,
                          transition: "transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease, border-color 0.18s ease",
                          transform: hovered === prop.id && selected !== prop.id ? "translateY(-3px)" : "translateY(0)",
                          boxShadow: hovered === prop.id && selected !== prop.id ? "0 10px 28px rgba(0,0,0,0.10)" : selected === prop.id ? "0 8px 24px rgba(0,0,0,0.10)" : "none",
                        }}
                      >
                        {/* Image */}
                        <div className="relative overflow-hidden" style={{ height: 100 }}>
                          <Image
                            src={prop.img}
                            alt={prop.name}
                            fill
                            sizes="220px"
                            className="object-cover"
                            style={{
                              transition: "transform 0.4s ease",
                              transform: hovered === prop.id ? "scale(1.06)" : "scale(1)",
                            }}
                          />
                          <button
                            onClick={e => toggleLike(prop.id, e)}
                            className="absolute top-2 right-2 w-6 h-6 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center"
                            style={{ transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}
                            onMouseDown={e => { e.stopPropagation(); (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.75)" }}
                            onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.2)"; setTimeout(() => { if (e.currentTarget) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)" }, 180) }}
                          >
                            <Heart size={11} className={cn(liked.has(prop.id) ? "fill-red-500 text-red-500" : "text-foreground/50")} style={{ transition: "fill 0.2s ease, color 0.2s ease" }} />
                          </button>
                          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                            <Star size={8} fill="white" />
                            <span>{prop.rating}</span>
                          </div>
                        </div>
                        {/* Info */}
                        <div className="p-2.5 bg-background">
                          <p className="text-[12px] font-bold text-foreground leading-tight">{prop.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin size={9} className="text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{prop.location}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-0.5"><BedDouble size={10} />{prop.beds}</span>
                              <span className="flex items-center gap-0.5"><Bath size={10} />{prop.baths}</span>
                              <span className="flex items-center gap-0.5"><Wifi size={10} />Wifi</span>
                            </div>
                            <span className="text-[11px] font-bold text-foreground">{prop.price}k<span className="text-[9px] font-normal text-muted-foreground"> FCFA/mois</span></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: detail preview panel */}
            <div
              className={cn(
                "w-[220px] shrink-0 flex-col hidden sm:flex",
                "transition-all duration-300"
              )}
            >
              {selectedProp ? (
                <div className="flex flex-col h-full anim-slide-right">
                  {/* Hero */}
                  <div className="relative overflow-hidden shrink-0" style={{ height: 130 }}>
                    <Image src={selectedProp.img} alt={selectedProp.name} fill sizes="220px" className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white text-[13px] font-bold leading-tight">{selectedProp.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={9} fill="rgba(255,255,255,0.8)" className="text-white/80" />
                        <span className="text-white/80 text-[9px]">{selectedProp.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto scrollbar-hide">
                    {/* Rating + price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={10} className={i <= Math.round(selectedProp.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"} />
                        ))}
                      </div>
                      <span className="text-[12px] font-bold text-foreground">{selectedProp.price}k<span className="text-[9px] font-normal text-muted-foreground"> FCFA/mois</span></span>
                    </div>

                    {/* Amenities */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { icon: BedDouble, label: `${selectedProp.beds} Chambres` },
                        { icon: Bath, label: `${selectedProp.baths} Douches` },
                        { icon: Wifi, label: "Wifi gratuit" },
                        { icon: Star, label: "Top noté" },
                      ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-1.5 bg-muted rounded-lg px-2 py-1.5">
                          <Icon size={10} className="text-foreground shrink-0" />
                          <span className="text-[9.5px] text-foreground font-medium truncate">{label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Agent */}
                    <div className="flex items-center gap-2 pt-1 border-t border-border">
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                        <Image src="/images/agent.jpg" alt="Agent" width={28} height={28} className="object-cover w-full h-full" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-foreground">Wade Warren</p>
                        <p className="text-[9px] text-muted-foreground">Agent partenaire</p>
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      className="w-full bg-foreground text-background text-[11px] font-bold py-2.5 rounded-full flex items-center justify-center gap-1.5 mt-auto"
                      style={{ transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), opacity 0.15s ease" }}
                      onMouseDown={e => (e.currentTarget.style.transform = "scale(0.96)")}
                      onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      Réserver une visite
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-3 anim-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                    <Search size={20} className="text-muted-foreground" />
                  </div>
                  <p className="text-[12px] font-semibold text-foreground">Sélectionnez un bien</p>
                  <p className="text-[10.5px] text-muted-foreground leading-relaxed">Cliquez sur une annonce pour voir les détails ici</p>
                </div>
              )}
            </div>
          </div>

          {/* Demo footer */}
          <div className="px-5 py-3 bg-muted/30 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{filtered.length} biens disponibles</span>
            <button
              className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground hover:opacity-70 transition-opacity"
            >
              Ouvrir l'application complète <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
