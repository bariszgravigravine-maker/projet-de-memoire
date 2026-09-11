"use client"

import { useState } from "react"
import Image from "next/image"
import {
  ChevronLeft, Heart, Star, BedDouble, Bath, Flame,
  Wifi, Dices, Phone, MessageSquare, Trees, Share2
} from "lucide-react"
import { PROPERTIES } from "@/components/listing-screen"

interface DetailScreenProps {
  propertyId?: number
  onBack: () => void
}

const AMENITIES = [
  { icon: BedDouble, label: "5 Room" },
  { icon: Bath, label: "3 Toilets" },
  { icon: Flame, label: "BBQ Area" },
  { icon: Trees, label: "Spa" },
  { icon: Wifi, label: "Free Wifi" },
  { icon: Dices, label: "Board Games" },
]

export function DetailScreen({ propertyId, onBack }: DetailScreenProps) {
  const [liked, setLiked] = useState(true)
  const [showToast, setShowToast] = useState(false)

  const property = PROPERTIES.find(p => p.id === propertyId) ?? PROPERTIES[1]

  const handleVirtualTour = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden relative anim-slide-up" style={{ animationDuration: "0.38s" }}>
      {/* Toast */}
      {showToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-[12px] font-medium px-4 py-2 rounded-full shadow-lg anim-slide-down">
          Virtual Tour launching...
        </div>
      )}

      {/* Hero image */}
      <div className="relative shrink-0 overflow-hidden" style={{ height: 220 }}>
        <Image
          src={property.img}
          alt={property.name}
          fill
          sizes="300px"
          className="object-cover anim-scale-in"
          style={{ animationDuration: "0.7s" }}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md anim-fade-in"
          style={{
            animationDelay: "150ms",
            transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
          }}
          onMouseDown={e => (e.currentTarget.style.transform = "scale(0.88)")}
          onMouseUp={e => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <ChevronLeft size={18} className="text-foreground" />
        </button>
        {/* Share button */}
        <button
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md anim-fade-in"
          style={{
            animationDelay: "200ms",
            transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
          }}
          onMouseDown={e => (e.currentTarget.style.transform = "scale(0.88)")}
          onMouseUp={e => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Share2 size={14} className="text-foreground" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide scroll-smooth-momentum">
        <div className="px-4 pt-4 pb-4">
          {/* Name + Like */}
          <div className="flex items-start justify-between mb-1 anim-fade-up" style={{ animationDelay: "80ms" }}>
            <h2 className="text-[20px] font-bold text-foreground leading-tight">{property.name}</h2>
            <button
              onClick={() => setLiked(!liked)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-muted mt-0.5"
              style={{ transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}
              onMouseDown={e => (e.currentTarget.style.transform = "scale(0.8)")}
              onMouseUp={e => (e.currentTarget.style.transform = "scale(1.3)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Heart
                size={16}
                className={liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}
                style={{ transition: "fill 0.2s ease, color 0.2s ease" }}
              />
            </button>
          </div>

          {/* Address + Rating */}
          <div className="flex items-center justify-between mb-4 anim-fade-up" style={{ animationDelay: "120ms" }}>
            <p className="text-[11px] text-muted-foreground">Ash Dr. San Jose, South Dakota 83475</p>
            <div className="flex items-center gap-1 bg-[var(--app-amber)] text-white text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 anim-pop-in" style={{ animationDelay: "300ms" }}>
              <Star size={9} fill="white" />
              <span>5 Star</span>
            </div>
          </div>

          {/* Amenities grid */}
          <div className="grid grid-cols-3 gap-x-2 gap-y-3 mb-4">
            {AMENITIES.map(({ icon: Icon, label }, i) => (
              <div
                key={label}
                className="flex items-center gap-1.5 anim-fade-up"
                style={{ animationDelay: `${160 + i * 45}ms` }}
              >
                <Icon size={14} className="text-muted-foreground shrink-0" />
                <span className="text-[11px] text-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* Price */}
          <div className="flex justify-end mb-4 anim-fade-up" style={{ animationDelay: "380ms" }}>
            <span className="text-[15px] font-bold text-foreground">{property.price}</span>
          </div>

          <div className="border-t border-border mb-4" />

          {/* Listing Agent */}
          <div className="mb-4 anim-fade-up" style={{ animationDelay: "420ms" }}>
            <p className="text-[13px] font-semibold text-foreground mb-3">Listing Agent</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border anim-pop-in" style={{ animationDelay: "460ms" }}>
                  <Image src="/images/agent.jpg" alt="Wade Warren" width={40} height={40} className="object-cover w-full h-full" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-foreground">Wade Warren</p>
                  <p className="text-[10px] text-muted-foreground">Partner</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[Phone, MessageSquare].map((Icon, i) => (
                  <button
                    key={i}
                    className="w-8 h-8 flex items-center justify-center border border-border rounded-full hover:bg-muted"
                    style={{ transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), background 0.15s ease" }}
                    onMouseDown={e => (e.currentTarget.style.transform = "scale(0.88)")}
                    onMouseUp={e => (e.currentTarget.style.transform = "scale(1.12)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    <Icon size={14} className="text-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Overview */}
          <div className="mb-2 anim-fade-up" style={{ animationDelay: "480ms" }}>
            <p className="text-[13px] font-semibold text-foreground mb-2">Overview</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Escape to villas where tropical charm meets modern luxury. Each residence promises spacious privacy and
              breathtaking ocean views, complemented by complete amenities for a truly unforgettable stay. Ideal for
              families and couples seeking exclusive retreats.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4 pt-2 shrink-0 bg-background anim-slide-up" style={{ animationDelay: "200ms" }}>
        <button
          onClick={handleVirtualTour}
          className="w-full bg-foreground text-background font-semibold text-[14px] py-4 rounded-full"
          style={{
            transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, background 0.15s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)"
            ;(e.currentTarget as HTMLButtonElement).style.transform = "scale(1.01)"
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"
            ;(e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"
          }}
          onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={e => (e.currentTarget.style.transform = "scale(1.01)")}
        >
          Virtual Tour
        </button>
      </div>
    </div>
  )
}
