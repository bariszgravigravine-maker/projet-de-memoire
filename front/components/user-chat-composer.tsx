"use client"

import type React from "react"
import { useState, useRef, useCallback, type KeyboardEvent } from "react"
import Image from "next/image"
import { Send, Mic, MicOff, Paperclip, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserChatComposerProps {
  onSend: (content: string, imageData?: string) => void
  disabled?: boolean
}

export function UserChatComposer({ onSend, disabled = false }: UserChatComposerProps) {
  const [value, setValue] = useState("")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [showImageBounce, setShowImageBounce] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const baseTextRef = useRef("")
  const finalTranscriptsRef = useRef("")

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
    }
  }, [])

  const handleSend = useCallback(() => {
    if ((!value.trim() && !uploadedImage) || disabled) return
    onSend(value || "Image", uploadedImage || undefined)
    setValue("")
    setUploadedImage(null)
    baseTextRef.current = ""
    finalTranscriptsRef.current = ""
    if (textareaRef.current) textareaRef.current.style.height = "auto"
  }, [value, uploadedImage, disabled, onSend])

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

  const toggleRecording = useCallback(() => {
    if (typeof window === "undefined") return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur.")
      return
    }

    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
    } else {
      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "fr-FR"
        recognitionRef.current.onresult = (event: any) => {
          let newFinalText = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) newFinalText += event.results[i][0].transcript + " "
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
      baseTextRef.current = value
      finalTranscriptsRef.current = ""
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }, [isRecording, value, handleInput])

  return (
    <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 z-20 bg-white/80 backdrop-blur-sm">
      <div
        className={cn(
          "relative max-w-3xl mx-auto flex flex-col gap-3 p-4 bg-white rounded-3xl transition-all",
          "border border-stone-200 focus-within:ring-2 focus-within:ring-stone-200"
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
                <Image src={uploadedImage} alt="Preview" width={48} height={48} className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => setUploadedImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-foreground hover:bg-foreground/80 text-background rounded-full flex items-center justify-center"
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
            placeholder="Écrivez un message..."
            disabled={disabled}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-stone-800 placeholder:text-stone-400",
              "focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed max-h-[120px] overflow-y-auto"
            )}
          />

          <button
            onClick={handleSend}
            disabled={(!value.trim() && !uploadedImage) || disabled}
            className={cn(
              "w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center transition-all",
              (!value.trim() && !uploadedImage) || disabled ? "opacity-40 cursor-not-allowed" : "hover:scale-105"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

          <button
            onClick={toggleRecording}
            disabled={disabled}
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center transition-colors",
              isRecording ? "bg-red-500 text-white" : "bg-zinc-100 hover:bg-zinc-200 text-stone-700"
            )}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="h-9 w-9 rounded-full bg-zinc-100 hover:bg-zinc-200 text-stone-700 flex items-center justify-center transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
