"use client"

import Image from "next/image"

export function NestFindLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const iconSize = size === "sm" ? 28 : size === "lg" ? 44 : 34
  const fontSize = size === "sm" ? 14 : size === "lg" ? 21 : 16

  return (
    <div style={{ display: "flex", alignItems: "center", gap: size === "sm" ? 6 : size === "lg" ? 10 : 8 }}>
      <Image
        src="/logo-192.png"
        alt="NestFind"
        width={iconSize}
        height={iconSize}
        style={{ borderRadius: 8, objectFit: "cover" }}
        unoptimized
      />
      <span
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
          fontWeight: 700,
          fontSize,
          letterSpacing: "-0.4px",
          color: "currentColor",
          lineHeight: 1,
        }}
      >
        NestFind
      </span>
    </div>
  )
}

export function NestFindIcon({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/logo-192.png"
      alt="NestFind"
      width={size}
      height={size}
      style={{ borderRadius: size / 4, objectFit: "cover" }}
      unoptimized
    />
  )
}
