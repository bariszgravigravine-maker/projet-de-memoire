"use client"

import { useRouter, usePathname } from "next/navigation"
import { AIChatOrb } from "@/components/ai-chat-orb"

export function AIChatFab() {
  const router = useRouter()
  const pathname = usePathname()

  // Hide on chat pages
  if (pathname === "/chat" || pathname === "/messages") return null

  return (
    <button
      onClick={() => router.push("/chat")}
      className="fixed bottom-6 right-6 z-50 group flex items-center gap-2 pl-1 pr-4 py-1 bg-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-border hover:scale-105 transition-transform duration-300"
      aria-label="Open AI assistant"
    >
      <AIChatOrb size={44} />
      <span className="text-sm font-semibold text-foreground hidden sm:inline">Assistant IA</span>
    </button>
  )
}
