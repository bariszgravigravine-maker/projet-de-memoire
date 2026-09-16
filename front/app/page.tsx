"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { MobileHomePage } from "@/components/mobile-homepage"
import { getToken } from "@/lib/api"

export default function Home() {
  const router = useRouter()

  // Déjà connecté → direct au dashboard
  useEffect(() => {
    if (getToken()) router.replace("/dashboard")
  }, [router])

  return <MobileHomePage onLaunchApp={() => router.push("/auth")} />
}
