"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getToken } from "@/lib/api"

/**
 * Garde d'authentification : redirige vers /auth?redirect=<page> si le
 * visiteur n'est pas connecté. À placer sur les pages privées (dashboard,
 * messages, notifications, mes-annonces, chat, admin, critères, publier).
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (getToken()) {
      setAllowed(true)
    } else {
      const target = pathname || "/dashboard"
      router.replace(`/auth?redirect=${encodeURIComponent(target)}`)
    }
  }, [router, pathname])

  if (!allowed) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          <p className="text-[12px] text-muted-foreground">Redirection vers la connexion…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
