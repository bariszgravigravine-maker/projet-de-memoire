"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { io, Socket } from "socket.io-client"
import { SOCKET_URL } from "@/lib/api"

interface RealtimeContextValue {
  unreadMessages: number
  unreadNotifs: number
  setUnreadMessages: (n: number) => void
  setUnreadNotifs: (n: number) => void
  incrementMessages: () => void
  incrementNotifs: () => void
  connected: boolean
  socket: Socket | null
  onlineUsers: string[]
}

const RealtimeContext = createContext<RealtimeContextValue>({
  unreadMessages: 0,
  unreadNotifs: 0,
  setUnreadMessages: () => {},
  setUnreadNotifs: () => {},
  incrementMessages: () => {},
  incrementNotifs: () => {},
  connected: false,
  socket: null,
  onlineUsers: [],
})

export function useRealtime() {
  return useContext(RealtimeContext)
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [connected, setConnected] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  useEffect(() => {
    // Get token from localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("immo_token") : null
    if (!token) return

    // En production sur Vercel, les rewrites HTTP peuvent proxier le transport
    // "polling" de socket.io vers le VPS, mais PAS les websockets (wss://).
    // On force donc "polling" en production ; en local le websocket fonctionne.
    const isProd = process.env.NODE_ENV === "production"
    const s = io(SOCKET_URL, {
      auth: { token },
      path: "/socket.io",
      transports: isProd ? ["polling"] : ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      timeout: 8000,
    })

    setSocket(s)

    s.on("connect", () => {
      console.log("[WS] Connecté")
      setConnected(true)
    })

    s.on("disconnect", () => {
      console.log("[WS] Déconnecté")
      setConnected(false)
    })

    // Évite le spam console quand le serveur socket est injoignable
    s.on("connect_error", () => {
      setConnected(false)
    })

    // Real-time notification
    s.on("notification", () => {
      setUnreadNotifs((prev) => prev + 1)
    })

    // Real-time message
    s.on("message", () => {
      setUnreadMessages((prev) => prev + 1)
    })

    // Présence : liste initiale puis mises à jour en ligne/hors ligne
    s.on("online_users", (ids: string[]) => {
      setOnlineUsers(ids)
    })
    s.on("presence", ({ userId, online }: { userId: string; online: boolean }) => {
      setOnlineUsers((prev) =>
        online ? (prev.includes(userId) ? prev : [...prev, userId]) : prev.filter((id) => id !== userId)
      )
    })

    return () => {
      s.disconnect()
    }
  }, [])

  const incrementMessages = useCallback(() => {
    setUnreadMessages((prev) => prev + 1)
  }, [])

  const incrementNotifs = useCallback(() => {
    setUnreadNotifs((prev) => prev + 1)
  }, [])

  return (
    <RealtimeContext.Provider
      value={{
        unreadMessages,
        unreadNotifs,
        setUnreadMessages,
        setUnreadNotifs,
        incrementMessages,
        incrementNotifs,
        connected,
        socket,
        onlineUsers,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}
