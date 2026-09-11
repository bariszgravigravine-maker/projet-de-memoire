"use client"

import { useState, useRef, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, MoreVertical, Phone, Video, Search, Send, LayoutDashboard } from "lucide-react"
import { UserChatComposer } from "@/components/user-chat-composer"
import { Skeleton } from "@/components/skeleton"
import { cn } from "@/lib/utils"
import {
  listConversations, getMessages, sendMessage as apiSendMessage, countUnreadMessages, getUser
} from "@/lib/api"

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

  const fetchConversations = useCallback(async () => {
    setLoadingConvs(true)
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
        online: false,
        targetUserId: c.other_user_id || c.target_user_id,
      }))
      setConversations(mapped)
      setUnreadTotal(unreadRes.data?.count || 0)
      // Si un conversationId est dans l'URL, le sélectionner en priorité
      if (initialConvId) {
        setSelectedId(initialConvId)
      } else if (mapped.length > 0 && !selectedId) {
        setSelectedId(mapped[0].id)
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des conversations")
    } finally {
      setLoadingConvs(false)
    }
  }, [selectedId, initialConvId])

  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true)
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
    } catch (err: any) {
      setMessages([])
    } finally {
      setLoadingMsgs(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId)
      setShowList(false)
    }
  }, [selectedId, fetchMessages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const handleSend = useCallback(async (content: string) => {
    if (!selectedId || !content.trim()) return
    setSending(true)
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "me",
      content,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages((prev) => [...prev, tempMsg])
    try {
      await apiSendMessage(selectedId, content)
      // Refresh messages to get the real message with ID
      fetchMessages(selectedId)
    } catch (err: any) {
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
      alert(err.message || "Erreur lors de l'envoi")
    } finally {
      setSending(false)
    }
  }, [selectedId, fetchMessages])

  const selected = conversations.find((c) => c.id === selectedId)

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
                {conv.online && (
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
                {selected.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-foreground truncate">{selected.name}</h2>
                <p className="text-xs text-stone-500">{selected.online ? "En ligne" : "Hors ligne"}</p>
              </div>

              <div className="flex items-center gap-1">
                <button className="p-2 rounded-full hover:bg-stone-100 text-stone-600">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-stone-100 text-stone-600">
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
