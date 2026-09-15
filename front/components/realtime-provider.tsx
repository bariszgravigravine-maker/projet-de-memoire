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
}

const RealtimeContext = createContext<RealtimeContextValue>({
  unreadMessages: 0,
  unreadNotifs: 0,
  setUnreadMessages: () => {},
  setUnreadNotifs: () => {},
  incrementMessages: () => {},
  incrementNotifs: () => {},
  connected: false,
})

export function useRealtime() {
  return useContext(RealtimeContext)
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [connected, setConnected] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    // Get token from localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("immo_token") : null
    if (!token) return

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 3000,
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

    // Real-time notification
    s.on("notification", () => {
      setUnreadNotifs((prev) => prev + 1)
    })

    // Real-time message
    s.on("message", () => {
      setUnreadMessages((prev) => prev + 1)
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
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}
