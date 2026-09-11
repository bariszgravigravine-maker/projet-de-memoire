import type React from "react"

export function AIChatOrb({
  className,
  size = 56,
  variant = "default",
}: { className?: string; size?: number; variant?: "default" | "red" }) {
  const colors =
    variant === "red"
      ? {
          bg: "#fef2f2",
          circle1: "#ef4444",
          circle2: "#f87171",
          circle3: "#dc2626",
          circle4: "#fca5a5",
          circle5: "#fb7185",
        }
      : {
          bg: "#cff1f4",
          circle1: "#9e9fef",
          circle2: "#c471ec",
          circle3: "#9bc761",
          circle4: "#ccd4f2",
          circle5: "#f472b6",
        }

  const blurAmount = Math.max(6, size * 0.15)
  const sizes = [size * 0.45, size * 0.35, size * 0.5, size * 0.25, size * 0.3]

  return (
    <div
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: colors.bg,
        animation: "orb-hue-rotate 8s linear infinite",
        boxShadow: "rgba(17, 12, 46, 0.15) 0px 48px 100px 0px",
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          "--orb-blur": `${blurAmount}px`,
          animation: "orb-hue-rotate-blur 6s linear infinite reverse",
        } as React.CSSProperties}
      >
        {[colors.circle1, colors.circle2, colors.circle3, colors.circle4, colors.circle5].map((color, i) => (
          <div
            key={i}
            className={`orb-circle-${i + 1} absolute rounded-full`}
            style={{
              width: sizes[i],
              height: sizes[i],
              opacity: 0.85 + (i % 2) * 0.05,
              backgroundColor: color,
            }}
          />
        ))}
      </div>
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 0%, transparent 100%)",
        }}
      />
    </div>
  )
}
