"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { io, Socket } from "socket.io-client"
import { PhoneIncoming, PhoneOff } from "lucide-react"
import { SOCKET_URL, startCall as apiStartCall, joinCall as apiJoinCall, endCall as apiEndCall, countUnreadMessages, countUnreadNotifications } from "@/lib/api"
import { CallOverlay } from "@/components/call-overlay"

type ActiveCall = { token: string; url: string; video: boolean; conversationId: string; peerName: string }
type IncomingCall = { conversationId: string; video: boolean; callerId: string; callerName: string; callerPhoto?: string }

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
  incomingCall: IncomingCall | null
  activeCall: ActiveCall | null
  startCall: (conversationId: string, video: boolean, peerName: string) => Promise<void>
  acceptCall: () => Promise<void>
  declineCall: () => void
  leaveCall: () => void
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
  incomingCall: null,
  activeCall: null,
  startCall: async () => {},
  acceptCall: async () => {},
  declineCall: () => {},
  leaveCall: () => {},
})

export function useRealtime() {
  return useContext(RealtimeContext)
}

function getInitials(name: string): string {
  return (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?"
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [connected, setConnected] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)
  const [token, setToken] = useState<string | null>(null)

  // Le token n'existe pas au premier rendu (landing → login). Sans ce watcher,
  // le socket ne se connectait JAMAIS après la connexion → pas de notifications
  // temps réel, pas d'appels entrants. On observe localStorage jusqu'au login.
  useEffect(() => {
    const read = () => setToken(localStorage.getItem("immo_token"))
    read()
    const t = setInterval(read, 2000)
    window.addEventListener("storage", read)
    return () => { clearInterval(t); window.removeEventListener("storage", read) }
  }, [])

  useEffect(() => {
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
      // Compteurs initiaux : la cloche/badge reflètent l'état réel dès la
      // connexion, sans attendre un nouvel événement.
      countUnreadMessages()
        .then((r) => setUnreadMessages(r?.data?.count ?? 0))
        .catch(() => {})
      countUnreadNotifications()
        .then((r) => setUnreadNotifs(r?.data?.count ?? r?.data ?? 0))
        .catch(() => {})
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

    // ── Appels audio/vidéo : écoutés GLOBALEMENT (pas seulement sur /messages)
    // sinon le destinataire ne recevait rien s'il était sur une autre page.
    s.on("call:incoming", (payload: IncomingCall) => {
      setIncomingCall(payload)
    })
    s.on("call:ended", (payload: { conversationId?: string }) => {
      setIncomingCall((prev) => (prev?.conversationId === payload?.conversationId ? null : prev))
      setActiveCall((prev) => (prev?.conversationId === payload?.conversationId ? null : prev))
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
  }, [token])

  const incrementMessages = useCallback(() => {
    setUnreadMessages((prev) => prev + 1)
  }, [])

  const incrementNotifs = useCallback(() => {
    setUnreadNotifs((prev) => prev + 1)
  }, [])

  // ── Appels ──
  const startCall = useCallback(async (conversationId: string, video: boolean, peerName: string) => {
    const res = await apiStartCall(conversationId, video)
    const d = res?.data || res
    setActiveCall({ token: d.token, url: d.url, video, conversationId, peerName })
  }, [])

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return
    try {
      const res = await apiJoinCall(incomingCall.conversationId)
      const d = res?.data || res
      setActiveCall({
        token: d.token, url: d.url, video: incomingCall.video,
        conversationId: incomingCall.conversationId, peerName: incomingCall.callerName,
      })
    } finally {
      setIncomingCall(null)
    }
  }, [incomingCall])

  const declineCall = useCallback(() => {
    if (incomingCall) apiEndCall(incomingCall.conversationId, "declined").catch(() => {})
    setIncomingCall(null)
  }, [incomingCall])

  const leaveCall = useCallback(() => {
    if (activeCall) apiEndCall(activeCall.conversationId, "ended").catch(() => {})
    setActiveCall(null)
  }, [activeCall])

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
        incomingCall,
        activeCall,
        startCall,
        acceptCall,
        declineCall,
        leaveCall,
      }}
    >
      {children}

      {/* Appel entrant — affiché quelle que soit la page */}
      {incomingCall && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-72 text-center shadow-2xl anim-pop-in">
            {incomingCall.callerPhoto ? (
              <img src={incomingCall.callerPhoto} alt="" className="w-16 h-16 rounded-full object-cover mx-auto" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-bold mx-auto">
                {getInitials(incomingCall.callerName || "?")}
              </div>
            )}
            <p className="mt-3 font-semibold text-foreground">{incomingCall.callerName}</p>
            <p className="text-xs text-stone-500 mt-1">
              {incomingCall.video ? "Appel vidéo entrant" : "Appel audio entrant"}
            </p>
            <div className="mt-5 flex items-center justify-center gap-6">
              <button
                onClick={declineCall}
                className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                title="Refuser"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
              <button
                onClick={acceptCall}
                className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors animate-bounce"
                title="Décrocher"
              >
                <PhoneIncoming className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appel actif (LiveKit) — global */}
      {activeCall && (
        <CallOverlay
          token={activeCall.token}
          serverUrl={activeCall.url}
          video={activeCall.video}
          peerName={activeCall.peerName}
          onLeave={leaveCall}
        />
      )}
    </RealtimeContext.Provider>
  )
}
