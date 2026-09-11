"use client"

import { useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { MapPin, BedDouble, Bath, Heart, MoreVertical, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

const FALLBACK_IMAGES = [
  "/images/house-1.jpg",
  "/images/house-2.jpg",
  "/images/house-3.jpg",
  "/images/house-4.jpg",
  "/images/house-5.jpg",
  "/images/house-6.jpg",
]

interface ImagePosition {
  x: number
  rotate: number
}

interface PropertyPackageCardProps {
  ad: any
  index: number
  liked?: boolean
  onLike?: (e: React.MouseEvent) => void
  compact?: boolean
}

export function PropertyPackageCard({
  ad,
  index,
  liked = false,
  onLike,
  compact = false,
}: PropertyPackageCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const adId = ad.ad_id || ad.id
  const title = ad.title || "Bien immobilier"
  const price = ad.price
  const city = ad.city || ad.address || "Cameroun"
  const district = ad.district
  const bedrooms = ad.bedrooms ?? 0
  const bathrooms = ad.bathrooms ?? 0
  const viewCount = ad.view_count ?? 0
  const propertyType = ad.property_type || ""

  // Collect up to 5 images (photos from API or fallback)
  const images = useMemo(() => {
    if (ad.photos && ad.photos.length > 0) {
      const urls = ad.photos.map((p: any) => p.url || p).filter(Boolean)
      if (urls.length >= 5) return urls.slice(0, 5)
      // Fill remaining with fallbacks
      return [...urls, ...FALLBACK_IMAGES.slice(0, 5 - urls.length)]
    }
    // Use fallback images, offset by index for variety
    return Array.from({ length: 5 }, (_, i) => FALLBACK_IMAGES[(index + i) % FALLBACK_IMAGES.length])
  }, [ad.photos, index])

  // Image positions: fan spread like the gallery
  const imagePositions = useMemo<ImagePosition[]>(() => {
    const count = 5
    const positions: ImagePosition[] = []
    const totalSpread = compact ? 120 : 160
    const step = totalSpread / (count - 1)
    const startX = -totalSpread / 2

    for (let i = 0; i < count; i++) {
      const x = startX + step * i
      const normalizedPos = (i / (count - 1)) * 2 - 1
      const rotate = normalizedPos * 10
      positions.push({ x, rotate })
    }
    return positions
  }, [compact])

  const handleClick = () => {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 500)
    router.push(`/annonce/${adId}`)
  }

  const isActive = isHovered

  const cardWidth = compact ? "w-full max-w-[260px]" : "w-full max-w-[288px]"
  const backHeight = compact ? "180px" : "224px"
  const imageHeight = compact ? "130px" : "160px"
  const imageWidth = compact ? "82px" : "100px"

  return (
    <div
      ref={containerRef}
      className={cn("relative", isShaking && "animate-shake")}
      style={{
        transformOrigin: "center center",
        zIndex: isShaking ? 100 : "auto",
      }}
    >
      <div
        className={cn("relative mx-auto", cardWidth)}
        style={{ perspective: "1200px" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* Back panel — images area */}
        <div
          className="relative z-0 rounded-2xl transition-all duration-500 ease-out cursor-pointer"
          style={{
            height: backHeight,
            backgroundColor: "var(--card, #1e1e1e)",
            border: "1px solid var(--border, rgba(255,255,255,0.06))",
            transformStyle: "preserve-3d",
            transformOrigin: "center bottom",
            transform: isActive ? "rotateX(15deg)" : "rotateX(0deg)",
          }}
        >
          {/* Like button */}
          {onLike && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLike(e)
              }}
              className="absolute top-3 right-3 z-30 w-8 h-8 flex items-center justify-center bg-background/85 backdrop-blur-sm rounded-full shadow-sm transition-transform hover:scale-110"
            >
              <Heart
                size={14}
                className={liked ? "fill-red-500 text-red-500" : "text-foreground/60"}
              />
            </button>
          )}

          {/* Property type badge */}
          {propertyType && (
            <div className="absolute top-3 left-3 z-30 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-background/85 backdrop-blur-sm text-foreground border border-border">
              {propertyType}
            </div>
          )}

          {/* Fanned images */}
          <div
            className="absolute inset-0"
            style={{
              transformStyle: "flat",
              transformOrigin: "center bottom",
              transform: isActive ? "rotateX(-15deg)" : "rotateX(0deg)",
              transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {[...Array(5)].map((_, imgIndex) => {
              const pos = imagePositions[imgIndex]
              const imageUrl = images[imgIndex % images.length]
              const centerIndex = 2
              const distanceFromCenter = Math.abs(imgIndex - centerIndex)
              const zIndex = 10 - distanceFromCenter

              const brightness = distanceFromCenter === 0 ? 1 : distanceFromCenter === 1 ? 0.55 : 0.3
              const blurAmount = distanceFromCenter === 0 ? 0 : distanceFromCenter === 1 ? 0.5 : 1.5
              const yOffset = -16 * (1 - distanceFromCenter / centerIndex) || 0
              const scale = distanceFromCenter === 0 ? 1.05 : distanceFromCenter === 1 ? 0.95 : 0.88

              const xPos = isActive ? pos.x * 1.4 : pos.x
              const yPos = isActive ? -8 + yOffset : 8 + yOffset
              const rotation = isActive ? pos.rotate * 1.3 : pos.rotate
              const finalScale = isActive ? scale * 1.02 : scale

              return (
                <div
                  key={imgIndex}
                  className="absolute left-1/2 top-0 transition-all duration-500 ease-out"
                  style={{
                    transform: `translateX(calc(-50% + ${xPos}px)) translateY(${yPos}px) rotate(${rotation}deg) scale(${finalScale})`,
                    zIndex,
                  }}
                >
                  <div
                    className={cn("overflow-hidden rounded-lg", `h-[${imageHeight}]`)}
                    style={{ height: imageHeight, width: imageWidth }}
                  >
                    <img
                      src={imageUrl}
                      alt={`${title} ${imgIndex + 1}`}
                      className="h-full w-full object-cover transition-all duration-500"
                      style={{
                        filter: `brightness(${isActive ? Math.min(1, brightness + 0.2) : brightness}) contrast(1.08) saturate(${1 - distanceFromCenter * 0.2}) blur(${isActive ? 0 : blurAmount}px)`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Front panel — title + info */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 rounded-2xl overflow-hidden transition-all duration-500 ease-out cursor-pointer"
          style={{
            backgroundColor: "color-mix(in srgb, var(--card, #1a1a1a) 80%, transparent)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid var(--border, rgba(255,255,255,0.06))",
            transformStyle: "preserve-3d",
            transformOrigin: "center bottom",
            transform: isActive ? "rotateX(-25deg)" : "rotateX(0deg)",
          }}
        >
          {/* Title row */}
          <div className="relative py-4 px-4">
            <h3
              className={cn(
                "font-semibold text-base leading-snug line-clamp-2 min-h-[2.75rem] transition-colors duration-200",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {title}
            </h3>
          </div>

          {/* Footer row */}
          <div className="relative h-[48px]">
            <div
              className="absolute inset-x-0 top-0 h-[1px]"
              style={{ backgroundColor: "color-mix(in srgb, var(--foreground, #fff) 4%, transparent)" }}
            />

            <div className="relative h-full flex items-center justify-between px-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold text-foreground">
                  {price?.toLocaleString("fr-FR")}
                </span>
                <span className="text-[11px] text-muted-foreground">FCFA</span>
              </div>

              <div className="flex items-center gap-2">
                {!compact && (
                  <>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <BedDouble size={12} />
                      {bedrooms}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Bath size={12} />
                      {bathrooms}
                    </span>
                  </>
                )}
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin size={12} />
                  {city}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
