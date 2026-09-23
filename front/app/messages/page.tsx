"use client"

import { useState, useRef, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, MoreVertical, Phone, Video, Search, Send, LayoutDashboard, X } from "lucide-react"
import { UserChatComposer } from "@/components/user-chat-composer"
import { Skeleton } from "@/components/skeleton"
import { cn } from "@/lib/utils"
import {
  listConversations, getMessages, sendMessage as apiSendMessage, countUnreadMessages, getUser,
  openConversation, searchUsers
} from "@/lib/api"
import { useRealtime } from "@/components/realtime-provider"

type Message = {
  id: string
  role: "me" | "other"
  content: string
  time: string
  attachment_url?: string
  attachment_type?: string
  attachment_name?: string
}

type Conversation = {
  id: string
  name: string
  photo?: string
  lastMessage?: string
  time?: string
  unread?: number
  online?: boolean
  targetUserId?: string
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialConvId = searchParams.get("conversationId")
  const scrollRef = useRef<HTMLDivElement>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showList, setShowList] = useState(true)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const { socket, setUnreadMessages, onlineUsers, startCall } = useRealtime()

  // Recherche d'utilisateurs (nouvelle conversation — même sans annonce publiée)
  type FoundUser = { id: string; first_name?: string; last_name?: string; profile_photo_url?: string; role?: string }
  const [userQuery, setUserQuery] = useState("")
  const [userResults, setUserResults] = useState<FoundUser[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)

  // Appels LiveKit : gérés globalement dans RealtimeProvider (modale + overlay
  // sur toutes les pages — plus de listener local ici).
  const isOnline = useCallback((userId?: string) => !!userId && onlineUsers.includes(userId), [onlineUsers])

  const refreshUnread = useCallback(async () => {
    try {
      const res = await countUnreadMessages()
      const count = res.data?.count || 0
      setUnreadTotal(count)
      setUnreadMessages(count)
    } catch {}
  }, [setUnreadMessages])

  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingConvs(true)
    try {
      const [convRes, unreadRes] = await Promise.all([
        listConversations(),
        countUnreadMessages().catch(() => ({ data: { count: 0 } })),
      ])
      const data = convRes.data || convRes || []
      const mapped: Conversation[] = (Array.isArray(data) ? data : []).map((c: any) => ({
        id: c.id,
        name: c.other_first_name
          ? `${c.other_first_name} ${c.other_last_name || ""}`.trim()
          : c.other_user_name || c.target_name || `User ${c.other_user_id || ""}`,
        photo: c.other_photo,
        lastMessage: c.last_message || "",
        time: c.last_message_at ? formatTime(c.last_message_at) : "",
        unread: c.unread_count || 0,
        targetUserId: c.other_user_id || c.target_user_id,
      }))
      setConversations(mapped)
      const unreadCount = unreadRes.data?.count || 0
      setUnreadTotal(unreadCount)
      setUnreadMessages(unreadCount)
      // Si un conversationId est dans l'URL, le sélectionner en priorité ;
      // sinon sélectionner la première conversation uniquement si aucune n'est ouverte
      setSelectedId((prev) => prev ?? (initialConvId || mapped[0]?.id || null))
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des conversations")
    } finally {
      setLoadingConvs(false)
    }
  }, [initialConvId, setUnreadMessages])

  const fetchMessages = useCallback(async (convId: string, silent = false) => {
    if (!silent) setLoadingMsgs(true)
    try {
      const res = await getMessages(convId)
      const data = res.data || res || []
      const currentUser = getUser()
      const myId = currentUser?.id || currentUser?.user_id
      const mapped: Message[] = (Array.isArray(data) ? data : []).map((m: any) => ({
        id: m.id,
        role: m.sender_id === myId ? "me" : "other",
        content: m.content,
        time: m.sent_at ? formatTime(m.sent_at) : (m.created_at ? formatTime(m.created_at) : ""),
        attachment_url: m.attachment_url,
        attachment_type: m.attachment_type,
        attachment_name: m.attachment_name,
      }))
      setMessages(mapped)
      // Le backend marque les messages reçus comme lus : on recalcule le compteur
      refreshUnread()
    } catch (err: any) {
      setMessages([])
    } finally {
      setLoadingMsgs(false)
    }
  }, [refreshUnread])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Recherche d'utilisateurs avec debounce (300 ms)
  useEffect(() => {
    const q = userQuery.trim()
    if (q.length < 2) {
      setUserResults([])
      setSearchingUsers(false)
      return
    }
    setSearchingUsers(true)
    const t = setTimeout(async () => {
      try {
        const res = await searchUsers(q)
        setUserResults(res.data || res || [])
      } catch {
        setUserResults([])
      } finally {
        setSearchingUsers(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [userQuery])

  // Démarre une conversation avec un utilisateur trouvé (publié ou non)
  const handleStartConversation = useCallback(async (user: FoundUser) => {
    try {
      const res = await openConversation(user.id)
      const conv = res.data || res
      const convId = conv.id || conv.conversation_id
      setUserQuery("")
      setUserResults([])
      await fetchConversations()
      if (convId) {
        setSelectedId(convId)
        setShowList(false)
      }
    } catch (err: any) {
      setError(err?.message || "Impossible d'ouvrir la conversation")
    }
  }, [fetchConversations])

  // Un conversationId dans l'URL prend toujours la priorité
  useEffect(() => {
    if (initialConvId) setSelectedId(initialConvId)
  }, [initialConvId])

  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId)
      setShowList(false)
    }
  }, [selectedId, fetchMessages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  // Réception temps réel via Socket.IO
  useEffect(() => {
    if (!socket) return
    const onMessage = (payload: { conversationId?: string }) => {
      if (payload?.conversationId === selectedId) {
        fetchMessages(selectedId, true)
      } else {
        refreshUnread()
      }
      fetchConversations(true)
    }
    socket.on("message", onMessage)
    return () => {
      socket.off("message", onMessage)
    }
  }, [socket, selectedId, fetchMessages, fetchConversations, refreshUnread])

  const handleSend = useCallback(async (content: string, imageData?: string) => {
    if (!selectedId || (!content.trim() && !imageData)) return
    setSending(true)
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "me",
      content,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      attachment_url: imageData,
      attachment_type: imageData ? "image" : undefined,
    }
    setMessages((prev) => [...prev, tempMsg])
    try {
      const attachment = imageData ? { url: imageData, type: "image", name: "photo.jpg" } : undefined
      const res = await apiSendMessage(selectedId, content, attachment)
      // Remplace le message optimiste par le vrai message renvoyé par l'API — aucun rechargement
      const m = res?.data || res
      if (m?.id) {
        setMessages((prev) => prev.map((msg) =>
          msg.id === tempMsg.id
            ? {
                id: m.id,
                role: "me" as const,
                content: m.content,
                time: m.sent_at ? formatTime(m.sent_at) : tempMsg.time,
                attachment_url: m.attachment_url,
                attachment_type: m.attachment_type,
                attachment_name: m.attachment_name,
              }
            : msg
        ))
      }
      fetchConversations(true)
    } catch (err: any) {
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
      alert(err.message || "Erreur lors de l'envoi")
    } finally {
      setSending(false)
    }
  }, [selectedId, fetchMessages, fetchConversations])

  const selected = conversations.find((c) => c.id === selectedId)

  // ── Appels LiveKit : la modale d'appel entrant et l'overlay sont rendus
  // globalement par RealtimeProvider ; ici on ne fait que démarrer l'appel.
  const handleStartCall = useCallback(async (video: boolean) => {
    if (!selected) return
    try {
      await startCall(selected.id, video, selected.name)
    } catch (err: any) {
      alert(err.message || "Impossible de démarrer l'appel")
    }
  }, [selected, startCall])

  return (
    <div className="h-screen flex bg-stone-50 overflow-hidden">
      {/* Sidebar conversations */}
      <aside
        className={cn(
          "w-full md:w-80 flex-shrink-0 bg-white border-r border-stone-200 flex flex-col z-10",
          showList ? "flex" : "hidden md:flex"
        )}
      >
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 rounded-full hover:bg-stone-100 transition-colors"
              title="Retour au tableau de bord"
            >
              <LayoutDashboard className="w-5 h-5 text-stone-600" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Messages</h1>
          </div>
          {unreadTotal > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
              {unreadTotal}
            </span>
          )}
        </div>

        {/* Recherche d'utilisateur : nouvelle conversation même sans annonce */}
        <div className="px-4 py-3 border-b border-stone-200 relative">
          <div className="flex items-center gap-2 bg-stone-100 rounded-full px-3 py-2">
            <Search className="w-4 h-4 text-stone-400 shrink-0" />
            <input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Rechercher un utilisateur…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400"
            />
            {userQuery && (
              <button onClick={() => { setUserQuery(""); setUserResults([]) }} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Résultats de recherche */}
          {userQuery.trim().length >= 2 && (
            <div className="absolute left-4 right-4 top-full mt-1 z-20 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
              {searchingUsers && (
                <p className="px-4 py-3 text-xs text-stone-400">Recherche…</p>
              )}
              {!searchingUsers && userResults.length === 0 && (
                <p className="px-4 py-3 text-xs text-stone-400">Aucun utilisateur trouvé</p>
              )}
              {!searchingUsers && userResults.map((u) => {
                const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Utilisateur"
                return (
                  <button
                    key={u.id}
                    onClick={() => handleStartConversation(u)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 text-left border-b border-stone-50 last:border-0"
                  >
                    {u.profile_photo_url ? (
                      <img src={u.profile_photo_url} alt={name} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
                        {getInitials(name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{name}</p>
                      <p className="text-[11px] text-stone-400">
                        {u.role === "AGENT" ? "Agent" : u.role === "ADMIN" ? "Admin" : "Utilisateur"}
                      </p>
                    </div>
                    <Send className="w-4 h-4 text-stone-300" />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs && (
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 border-b border-stone-100">
                  <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingConvs && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Send size={32} className="text-stone-300 mb-2" />
              <p className="text-sm font-medium text-stone-600">Aucune conversation</p>
              <p className="text-xs text-stone-400 mt-1">Contactez un annonceur pour démarrer</p>
            </div>
          )}

          {!loadingConvs && conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={cn(
                "w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-stone-50 border-b border-stone-100",
                selectedId === conv.id && "bg-stone-100"
              )}
            >
              <div className="relative">
                {conv.photo ? (
                  <img src={conv.photo} alt={conv.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">
                    {getInitials(conv.name)}
                  </div>
                )}
                {isOnline(conv.targetUserId) && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground truncate">{conv.name}</p>
                  {conv.time && <span className="text-xs text-stone-400">{conv.time}</span>}
                </div>
                <p className="text-sm text-stone-500 truncate">{conv.lastMessage || "Aucun message"}</p>
              </div>
              {conv.unread && conv.unread > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
                  {conv.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <main className={cn("flex-1 flex flex-col min-w-0", !showList ? "flex" : "hidden md:flex")}>
        {selected ? (
          <>
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-stone-200 px-4 py-3 flex items-center gap-3">
              <button onClick={() => setShowList(true)} className="md:hidden p-2 rounded-full hover:bg-stone-100 transition-colors">
                <ArrowLeft className="w-5 h-5 text-stone-600" />
              </button>

              <div className="relative">
                {selected.photo ? (
                  <img src={selected.photo} alt={selected.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">
                    {getInitials(selected.name)}
                  </div>
                )}
                {isOnline(selected.targetUserId) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-foreground truncate">{selected.name}</h2>
                <p className="text-xs text-stone-500">{isOnline(selected.targetUserId) ? "En ligne" : "Hors ligne"}</p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleStartCall(false)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
                  title="Appel audio"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleStartCall(true)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
                  title="Appel vidéo"
                >
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-stone-100 text-stone-600">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6 pb-32 space-y-4">
              {loadingMsgs && (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : "flex-row"}`}>
                      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                      <Skeleton className="h-16 w-1/2 rounded-2xl" />
                    </div>
                  ))}
                </div>
              )}

              {!loadingMsgs && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-stone-500">Aucun message. Dites bonjour !</p>
                </div>
              )}

              {!loadingMsgs && messages.map((msg) => (
                // Trace d'appel (audio/vidéo) — ligne centrée style WhatsApp
                msg.attachment_type === "call" ? (
                  <div key={msg.id} className="flex justify-center">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-200/70 text-[11px] text-stone-600">
                      {msg.content?.includes("vidéo") ? (
                        <Video size={11} className="shrink-0" />
                      ) : (
                        <Phone size={11} className="shrink-0" />
                      )}
                      <span>{msg.content}</span>
                      <span className="text-stone-400">· {msg.time}</span>
                    </span>
                  </div>
                ) : (
                <div
                  key={msg.id}
                  className={cn("flex gap-3 anim-fade-up", msg.role === "me" ? "flex-row-reverse" : "flex-row")}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      msg.role === "me" ? "bg-foreground text-background" : "bg-stone-200 text-foreground"
                    )}
                  >
                    {msg.role === "me" ? "M" : getInitials(selected.name)[0]}
                  </div>

                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                      msg.role === "me"
                        ? "bg-foreground text-background rounded-br-none"
                        : "bg-white border border-stone-200 text-stone-700 rounded-bl-none"
                    )}
                  >
                    {msg.attachment_url && msg.attachment_type === "image" && (
                      <div className="mb-2 rounded-xl overflow-hidden">
                        <img src={msg.attachment_url} alt={msg.attachment_name || "Pièce jointe"} className="w-full max-h-48 object-cover" />
                      </div>
                    )}
                    {msg.attachment_url && msg.attachment_type === "pdf" && (
                      <a
                        href={msg.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center gap-2 mb-2 p-2 rounded-lg text-xs font-medium",
                          msg.role === "me" ? "bg-background/10" : "bg-stone-100"
                        )}
                      >
                        <span className="text-base">📄</span>
                        <span className="truncate">{msg.attachment_name || "Document PDF"}</span>
                      </a>
                    )}
                    {msg.content && <div>{msg.content}</div>}
                    <div className={cn("text-[10px] mt-1 opacity-70", msg.role === "me" ? "text-right" : "text-left")}>
                      {msg.time}
                    </div>
                  </div>
                </div>
                )
              ))}
            </div>

            {/* Composer */}
            <UserChatComposer onSend={handleSend} disabled={sending} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <Send size={48} className="text-stone-300 mb-3" />
            <p className="text-lg font-semibold text-stone-600">Sélectionnez une conversation</p>
            <p className="text-sm text-stone-400 mt-1">Choisissez une conversation dans la liste</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse bg-muted w-10 h-10 rounded-full" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
