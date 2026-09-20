"use client"

import "@livekit/components-styles"
import { LiveKitRoom, VideoConference } from "@livekit/components-react"
import { PhoneOff } from "lucide-react"

interface CallOverlayProps {
  token: string
  serverUrl: string
  video: boolean
  peerName: string
  onLeave: () => void
}

/**
 * Plein écran d'appel audio/vidéo via LiveKit (self-hosted sur le VPS).
 * VideoConference fournit la grille vidéo, le mute, le partage d'écran.
 */
export function CallOverlay({ token, serverUrl, video, peerName, onLeave }: CallOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-stone-950 flex flex-col">
      <div className="px-4 py-3 flex items-center justify-between bg-stone-900/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-sm font-medium text-white">
            {video ? "Appel vidéo" : "Appel audio"} — {peerName}
          </p>
        </div>
        <button
          onClick={onLeave}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
        >
          <PhoneOff className="w-4 h-4" />
          Raccrocher
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          video={video}
          audio={true}
          onDisconnected={onLeave}
          className="h-full"
        >
          <VideoConference />
        </LiveKitRoom>
      </div>
    </div>
  )
}
