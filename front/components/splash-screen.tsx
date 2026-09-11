"use client"

import Image from "next/image"

interface SplashScreenProps {
  onGetStarted: () => void
}

export function SplashScreen({ onGetStarted }: SplashScreenProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-foreground anim-fade-in">
      {/* Background image — subtle scale-in */}
      <Image
        src="/images/hero-house.jpg"
        alt="Luxury home"
        fill
        className="object-cover object-center anim-scale-in"
        style={{ animationDuration: "1.2s" }}
        priority
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/85" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end pb-10 px-6">
        <h1
          className="text-white text-[28px] font-bold leading-tight text-balance mb-3 anim-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          Trouvez votre bien<br />le plus rapidement
        </h1>
        <p
          className="text-white/75 text-[13px] leading-relaxed mb-8 text-pretty anim-fade-up"
          style={{ animationDelay: "350ms" }}
        >
          Parcourez les biens immobiliers intuitivement, sans le tracas d'organiser une visite.
        </p>
        <button
          onClick={onGetStarted}
          className="w-full bg-white text-foreground font-semibold text-[15px] py-4 rounded-full anim-slide-up"
          style={{
            animationDelay: "500ms",
            transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(255,255,255,0.25)"
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = "none"
          }}
          onMouseDown={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)"
          }}
          onMouseUp={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"
          }}
        >
          Commencer
        </button>
      </div>
    </div>
  )
}
