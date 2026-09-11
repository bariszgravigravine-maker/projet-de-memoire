"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SplashScreen } from "@/components/splash-screen"
import { ListingScreen } from "@/components/listing-screen"
import { DetailScreen } from "@/components/detail-screen"
import { MobileHomePage } from "@/components/mobile-homepage"

type AppScreen = "splash" | "listing" | "detail"

export default function Home() {
  const router = useRouter()
  const [appScreen, setAppScreen] = useState<AppScreen>("splash")
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | undefined>(undefined)

  const handleStart = () => {
    router.push("/auth")
  }

  const handleSelectProperty = (id: number) => {
    setSelectedPropertyId(id)
    setAppScreen("detail")
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      <MobileHomePage onLaunchApp={handleStart} />

      {/* Phone frame demo */}
      <div className="flex flex-col items-center justify-center py-16 bg-[var(--app-bg)]" id="phone-demo">
        <div className="flex flex-col items-center gap-3 mb-10 anim-fade-up">
          <p className="text-[13px] font-medium text-muted-foreground tracking-wide uppercase">
            Demo
          </p>
        </div>
        <div className="relative anim-phone-float" style={{ width: 300, height: 650, flexShrink: 0 }}>
          {/* Buttons */}
          <div style={{ position: "absolute", left: -5, top: 96, width: 5, height: 28, borderRadius: "3px 0 0 3px", background: "linear-gradient(to right, #5c5c5e, #48484a)", boxShadow: "-2px 0 6px rgba(0,0,0,0.55)" }} />
          <div style={{ position: "absolute", left: -5, top: 148, width: 5, height: 52, borderRadius: "3px 0 0 3px", background: "linear-gradient(to right, #5c5c5e, #48484a)", boxShadow: "-2px 0 6px rgba(0,0,0,0.55)" }} />
          <div style={{ position: "absolute", left: -5, top: 214, width: 5, height: 52, borderRadius: "3px 0 0 3px", background: "linear-gradient(to right, #5c5c5e, #48484a)", boxShadow: "-2px 0 6px rgba(0,0,0,0.55)" }} />
          <div style={{ position: "absolute", right: -5, top: 170, width: 5, height: 68, borderRadius: "0 3px 3px 0", background: "linear-gradient(to left, #5c5c5e, #48484a)", boxShadow: "2px 0 6px rgba(0,0,0,0.55)" }} />

          {/* Titanium frame */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 44,
            background: "linear-gradient(160deg, #58585a 0%, #2c2c2e 30%, #1c1c1e 60%, #3a3a3c 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.4), 0 24px 70px rgba(0,0,0,0.7), 0 8px 20px rgba(0,0,0,0.4)",
          }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 44, pointerEvents: "none", background: "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)" }} />

            {/* Screen */}
            <div style={{ position: "absolute", inset: 10, borderRadius: 36, background: "#fff", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* Status bar */}
              <div style={{ position: "relative", background: "#fff", height: 50, display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 20, paddingRight: 16, flexShrink: 0 }}>
                <span style={{ color: "#000", fontSize: 13, fontWeight: 700, letterSpacing: "-0.3px" }}>9:41</span>
                <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 100, height: 30, background: "#000", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 7, paddingRight: 10, zIndex: 10 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#1a1a1a", border: "1px solid #2a2a2a" }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #1e3f6e, #080810)", border: "1.5px solid #1a2e50", boxShadow: "0 0 5px rgba(40,100,220,0.45)" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><rect x="0" y="6" width="2" height="4" rx="0.5" fill="#000" /><rect x="3.5" y="4" width="2" height="6" rx="0.5" fill="#000" /><rect x="7" y="2" width="2" height="8" rx="0.5" fill="#000" /><rect x="10.5" y="0" width="2" height="10" rx="0.5" fill="#000" fillOpacity="0.28" /></svg>
                  <svg width="13" height="10" viewBox="0 0 13 10" fill="none"><circle cx="6.5" cy="9" r="1.2" fill="#000" /><path d="M3.2 6C4.2 5 5.3 4.4 6.5 4.4S8.8 5 9.8 6" stroke="#000" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" /><path d="M1 3.8C2.8 2 4.6 1 6.5 1S10.2 2 12 3.8" stroke="#000" strokeWidth="1.4" strokeLinecap="round" opacity="0.35" /></svg>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ width: 21, height: 11, borderRadius: 3, border: "1px solid rgba(0,0,0,0.38)", position: "relative" }}>
                      <div style={{ position: "absolute", left: 1.5, top: 1.5, bottom: 1.5, right: 4, borderRadius: 1.5, background: "#000" }} />
                    </div>
                    <div style={{ width: 2, height: 5, borderRadius: "0 1px 1px 0", background: "rgba(0,0,0,0.38)", marginLeft: -0.5 }} />
                  </div>
                </div>
              </div>

              {/* App content */}
              <div style={{ flex: 1, overflow: "hidden", background: "#fff", minHeight: 0 }}>
                {appScreen === "splash" && <SplashScreen onGetStarted={() => setAppScreen("listing")} />}
                {appScreen === "listing" && <ListingScreen onSelectProperty={handleSelectProperty} />}
                {appScreen === "detail" && <DetailScreen propertyId={selectedPropertyId} onBack={() => setAppScreen("listing")} />}
              </div>

              {/* Home indicator */}
              <div style={{ background: "#fff", height: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ width: 112, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.18)" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
