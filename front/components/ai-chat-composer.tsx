"use client"

import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from "react"
import Image from "next/image"
import { Square, Mic, MicOff, Brain, Paperclip, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { AIChatOrb } from "@/components/ai-chat-orb"
import { AIChatWaveform } from "@/components/ai-chat-waveform"

export type AIModel = "google/gemini-2.0-flash-001" | "openai/gpt-4o" | "anthropic/claude-sonnet-4"

export const AI_MODELS: { id: AIModel; name: string; icon: string }[] = [
  { id: "google/gemini-2.0-flash-001", name: "Gemini", icon: "/images/google.webp" },
  { id: "openai/gpt-4o", name: "GPT-4o", icon: "/images/gpt.png" },
  { id: "anthropic/claude-sonnet-4", name: "Claude", icon: "/images/claude.svg" },
]

interface AIChatComposerProps {
  onSend: (content: string, imageData?: string) => void
  onStop?: () => void
  isStreaming?: boolean
  disabled?: boolean
  selectedModel?: AIModel
  onModelChange?: (model: AIModel) => void
}

export function AIChatComposer({
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
  selectedModel = "google/gemini-2.0-flash-001",
  onModelChange,
}: AIChatComposerProps) {
  const [value, setValue] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [showImageBounce, setShowImageBounce] = useState(false)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const baseTextRef = useRef("")
  const finalTranscriptsRef = useRef("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "fr-FR"

        recognitionRef.current.onresult = (event: any) => {
          let newFinalText = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              newFinalText += event.results[i][0].transcript + " "
            }
          }
          if (newFinalText) {
            finalTranscriptsRef.current += newFinalText
            setValue(baseTextRef.current + finalTranscriptsRef.current)
            setTimeout(() => handleInput(), 0)
          }
        }

        recognitionRef.current.onerror = () => setIsRecording(false)
        recognitionRef.current.onend = () => setIsRecording(false)
      }
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop()
    }
  }, [])

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [])

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur.")
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop())
        setMediaStream(null)
      }
    } else {
      baseTextRef.current = value
      finalTranscriptsRef.current = ""
      recognitionRef.current.start()
      setIsRecording(true)
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => setMediaStream(stream))
        .catch((err) => console.error("[AI Chat] Microphone error:", err))
    }
  }, [isRecording, value, mediaStream])

  const handleSend = useCallback(() => {
    if ((!value.trim() && !uploadedImage) || isStreaming || disabled) return
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
    onSend(value || "Décrivez cette image", uploadedImage || undefined)
    setValue("")
    setUploadedImage(null)
    baseTextRef.current = ""
    finalTranscriptsRef.current = ""
    if (textareaRef.current) textareaRef.current.style.height = "auto"
  }, [value, uploadedImage, isStreaming, disabled, onSend, isRecording])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
        setShowImageBounce(true)
        setTimeout(() => setShowImageBounce(false), 400)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ""
  }, [])

  const currentModel = AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0]

  return (
    <div className="fixed bottom-4 left-0 right-0 px-4 pointer-events-none z-20">
      <div className="relative max-w-3xl mx-auto pointer-events-auto">
        <div
          className={cn(
            "flex flex-col gap-3 p-4 bg-white transition-all duration-200 overflow-hidden relative rounded-3xl",
            "focus-within:ring-2 focus-within:ring-stone-200"
          )}
          style={{
            boxShadow:
              "rgba(14, 63, 126, 0.06) 0px 0px 0px 1px, rgba(42, 51, 69, 0.06) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.06) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.06) 0px 6px 6px -3px, rgba(14, 63, 126, 0.06) 0px 12px 12px -6px, rgba(14, 63, 126, 0.06) 0px 24px 24px -12px",
          }}
        >
          <div className="flex gap-2 items-center">
            {uploadedImage && (
              <div className={cn("relative shrink-0", showImageBounce && "anim-pop-in")}>
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-200">
                  <Image src={uploadedImage || "/placeholder.svg"} alt="Uploaded" width={48} height={48} className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-foreground hover:bg-foreground/80 text-background rounded-full flex items-center justify-center transition-colors"
                  aria-label="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                handleInput()
              }}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "Écoute..." : "Tapez un message... (Shift+Entrée pour nouvelle ligne)"}
              disabled={isStreaming || disabled}
              rows={1}
              className={cn(
                "flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-stone-800 placeholder:text-stone-400",
                "focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
                "max-h-[120px] overflow-y-auto"
              )}
              aria-label="Message input"
            />

            {isRecording && (
              <div className="shrink-0 w-24">
                <AIChatWaveform isRecording={isRecording} stream={mediaStream} />
              </div>
            )}

            {isStreaming ? (
              <button
                onClick={onStop}
                className="relative h-9 w-9 shrink-0 transition-all rounded-full flex items-center justify-center cursor-pointer hover:scale-105"
                aria-label="Stop generating"
              >
                <AIChatOrb size={36} variant="red" />
                <Square className="w-4 h-4 absolute drop-shadow-md text-red-700" fill="currentColor" aria-hidden="true" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={(!value.trim() && !uploadedImage) || disabled}
                className={cn(
                  "relative h-9 w-9 shrink-0 transition-all rounded-full flex items-center justify-center",
                  (!value.trim() && !uploadedImage) || disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"
                )}
                aria-label="Send message"
              >
                <AIChatOrb size={36} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload image"
            />

            <Button
              onClick={toggleRecording}
              disabled={isStreaming || disabled}
              size="icon"
              className={cn(
                "h-9 w-9 shrink-0 transition-all rounded-full relative z-10",
                isRecording ? "bg-red-500 hover:bg-red-600 text-white" : "bg-zinc-100 hover:bg-zinc-200 text-stone-700"
              )}
              aria-label={isRecording ? "Stop recording" : "Start voice input"}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || disabled}
              size="icon"
              className="h-9 w-9 shrink-0 bg-zinc-100 hover:bg-zinc-200 text-stone-700 rounded-full"
              aria-label="Attach image"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isStreaming || disabled}
                  className="h-9 w-9 shrink-0 bg-zinc-100 hover:bg-zinc-200 text-stone-700 rounded-full"
                  aria-label="Select AI model"
                >
                  <Brain className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-40 px-2 py-2 rounded-2xl z-[9999]">
                  {AI_MODELS.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => onModelChange?.(model.id)}
                      className={cn(
                        "flex items-center cursor-pointer gap-3 rounded-lg",
                        selectedModel === model.id && "bg-stone-100"
                      )}
                    >
                      <Image src={model.icon || "/placeholder.svg"} alt={model.name} width={20} height={20} className="rounded-sm object-contain w-4 h-4" />
                      <span className="text-sm">{model.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>

            <span className="text-xs text-stone-400">{currentModel.name}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
