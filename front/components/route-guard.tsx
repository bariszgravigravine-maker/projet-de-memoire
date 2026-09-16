"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getToken } from "@/lib/api"

// Routes accessibles sans compte : landing, auth, détail d'une annonce.
// Tout le reste (dashboard, messages, notifications, mes-annonces, chat,
// admin, critères, estimation, publier…) exige une connexion.
const PUBLIC_EXACT = ["/", "/auth"]
const PUBLIC_PREFIX = ["/annonce/"] // la consultation d'un bien reste publique

function isPublic(pathname: string) {
  if (PUBLIC_EXACT.includes(pathname)) return true
  // /annonce/publier est PRIVÉ (création d'annonce) : on l'exclut du préfixe public
  if (pathname === "/annonce/publier") return false
  return PUBLIC_PREFIX.some((p) => pathname.startsWith(p))
}

/**
 * Garde de routage globale : redirige vers /auth?redirect=<page> si le
 * visiteur tente d'accéder à une page privée sans être connecté.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() || "/"
  const [allowed, setAllowed] = useState(isPublic(pathname))

  useEffect(() => {
    if (isPublic(pathname) || getToken()) {
      setAllowed(true)
      return
    }
    setAllowed(false)
    router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`)
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
