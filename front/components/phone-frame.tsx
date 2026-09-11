"use client"

import { cn } from "@/lib/utils"

interface PhoneFrameProps {
  children: React.ReactNode
  className?: string
}

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden",
        "w-[300px] h-[620px]",
        "rounded-[48px]",
        "bg-[var(--app-phone-bg)]",
        "shadow-[0_32px_80px_rgba(0,0,0,0.22),inset_0_0_0_1.5px_rgba(0,0,0,0.12)]",
        className
      )}
      style={{ fontFamily: "var(--font-inter, system-ui, sans-serif)" }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pt-3 pb-1 z-20 shrink-0">
        <span className="text-[11px] font-semibold leading-none">9:41 AM</span>
        <div className="flex items-center gap-1">
          <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor" className="opacity-80">
            <rect x="0" y="5" width="2" height="5" rx="0.5" />
            <rect x="3.5" y="3" width="2" height="7" rx="0.5" />
            <rect x="7" y="1.5" width="2" height="8.5" rx="0.5" />
            <rect x="10.5" y="0" width="2" height="10" rx="0.5" />
          </svg>
          <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor" className="opacity-80">
            <path d="M7 2.2C9.1 2.2 11 3 12.4 4.4L13.8 3C12 1.1 9.6 0 7 0C4.4 0 2 1.1 0.2 3L1.6 4.4C3 3 4.9 2.2 7 2.2Z"/>
            <path d="M7 5.5C8.3 5.5 9.5 6 10.4 6.9L11.8 5.5C10.5 4.2 8.8 3.3 7 3.3C5.2 3.3 3.5 4.2 2.2 5.5L3.6 6.9C4.5 6 5.7 5.5 7 5.5Z"/>
            <circle cx="7" cy="9.5" r="1.5"/>
          </svg>
          <svg width="22" height="11" viewBox="0 0 22 11" fill="none" className="opacity-80">
            <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="currentColor" strokeOpacity="0.35"/>
            <rect x="1.5" y="1.5" width="14" height="8" rx="2" fill="currentColor"/>
            <path d="M20 3.5C20.8 3.8 21.5 4.5 21.5 5.5C21.5 6.5 20.8 7.2 20 7.5V3.5Z" fill="currentColor" fillOpacity="0.4"/>
          </svg>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  )
}
