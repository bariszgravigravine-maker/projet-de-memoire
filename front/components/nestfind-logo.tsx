"use client"

export function NestFindLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const iconSize = size === "sm" ? 26 : size === "lg" ? 42 : 32
  const fontSize = size === "sm" ? 13 : size === "lg" ? 20 : 15
  const gap = size === "sm" ? 6 : size === "lg" ? 10 : 8

  return (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      {/* Icon mark */}
      <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#0a0a0a" />
        {/* House roof */}
        <path
          d="M7 17L16 8.5L25 17"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* House body */}
        <path
          d="M10 15.5V23H22V15.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Door */}
        <path
          d="M13.5 23V19.5C13.5 18.67 14.17 18 15 18H17C17.83 18 18.5 18.67 18.5 19.5V23"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Chimney */}
        <path
          d="M20 14V10.5H22.5V13"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Wordmark */}
      <svg
        width={size === "sm" ? 62 : size === "lg" ? 96 : 75}
        height={size === "sm" ? 14 : size === "lg" ? 22 : 17}
        viewBox="0 0 75 17"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x="0"
          y="14"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"
          fontWeight="700"
          fontSize={fontSize}
          fill="#0a0a0a"
          letterSpacing="-0.4"
        >
          NestFind
        </text>
      </svg>
    </div>
  )
}

/* Compact icon-only version for favicon / small uses */
export function NestFindIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#0a0a0a" />
      <path d="M7 17L16 8.5L25 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 15.5V23H22V15.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 23V19.5C13.5 18.67 14.17 18 15 18H17C17.83 18 18.5 18.67 18.5 19.5V23" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 14V10.5H22.5V13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
