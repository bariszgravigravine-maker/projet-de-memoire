"use client"

import { useMemo, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Html, Line } from "@react-three/drei"
import { BarChart3 } from "lucide-react"

/**
 * Visualisation 3D des stats des annonces (style repère vectoriel x/y/z) :
 *  - axe X : une position par annonce
 *  - axe Y : la valeur (hauteur des barres)
 *  - axe Z : les 3 métriques (vues / visiteurs uniques / likes)
 * Glisser pour tourner, molette pour zoomer.
 */

export type AdStat = {
  id: string
  title: string
  views: number
  viewers: number
  likes: number
}

const METRICS = [
  { key: "views" as const, label: "Vues", color: "#a8a29e", z: -0.9 },
  { key: "viewers" as const, label: "Visiteurs", color: "#10b981", z: 0 },
  { key: "likes" as const, label: "Likes", color: "#ef4444", z: 0.9 },
]

const BAR_H_MAX = 6 // hauteur max d'une barre en unités 3D
const X_STEP = 2.4 // espacement entre deux annonces sur l'axe X

interface BarProps {
  x: number
  z: number
  height: number
  color: string
  tip: string
}

function StatBar({ x, z, height, color, tip }: BarProps) {
  const [hovered, setHovered] = useState(false)
  const h = Math.max(height, 0.15) // barre visible même à 0
  return (
    <group>
      <mesh
        position={[x, h / 2, z]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.7, h, 0.7]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 0.55 : 0.08} />
      </mesh>
      {hovered && (
        <Html position={[x, h + 0.4, z]} center style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[11px] font-semibold text-white border border-white/20">
            {tip}
          </div>
        </Html>
      )}
    </group>
  )
}

function AxisLabel({ position, text, color }: { position: [number, number, number]; text: string; color: string }) {
  return (
    <Html position={position} center style={{ pointerEvents: "none" }}>
      <div className="text-[11px] font-bold" style={{ color }}>{text}</div>
    </Html>
  )
}

function Scene({ stats }: { stats: AdStat[] }) {
  const n = stats.length
  const xSpan = Math.max(n * X_STEP, 4)
  const maxVal = Math.max(1, ...stats.flatMap((s) => [s.views, s.viewers, s.likes]))
  const scale = (v: number) => (v / maxVal) * BAR_H_MAX
  const gridSize = Math.max(10, xSpan + 6)

  const bars = useMemo(
    () =>
      stats.flatMap((s, i) => {
        const x = -xSpan / 2 + X_STEP / 2 + i * X_STEP
        return METRICS.map((m) => ({
          x,
          z: m.z,
          height: scale(s[m.key]),
          color: m.color,
          tip: `${s.title} — ${m.label} : ${s[m.key].toLocaleString("fr-FR")}`,
        }))
      }),
    [stats, xSpan]
  )

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 12, 10]} intensity={1} />
      <directionalLight position={[-8, 10, -5]} intensity={0.4} />

      {/* Sol quadrillé (plan X-Z) */}
      <gridHelper args={[gridSize, gridSize, "#44403c", "#292524"]} position={[0, -0.01, 0]} />

      {/* Axe X — annonces (rouge) */}
      <Line points={[[-xSpan / 2 - 1, 0, 0], [xSpan / 2 + 1, 0, 0]]} color="#ff6b6b" lineWidth={2} />
      <AxisLabel position={[xSpan / 2 + 1.4, 0, 0]} text="Annonces" color="#ff6b6b" />

      {/* Axe Y — valeurs (vert) */}
      <Line points={[[-xSpan / 2 - 1, 0, 0], [-xSpan / 2 - 1, BAR_H_MAX + 1.2, 0]]} color="#51cf66" lineWidth={2} />
      <AxisLabel position={[-xSpan / 2 - 1, BAR_H_MAX + 1.6, 0]} text="Valeurs" color="#51cf66" />

      {/* Axe Z — métriques (bleu) */}
      <Line points={[[-xSpan / 2 - 1, 0, 0], [-xSpan / 2 - 1, 0, 3.4]]} color="#4dabf7" lineWidth={2} />
      <AxisLabel position={[-xSpan / 2 - 1, 0, 3.8]} text="Métriques" color="#4dabf7" />

      {/* Barres : 3 métriques par annonce */}
      {bars.map((b, i) => (
        <StatBar key={i} {...b} />
      ))}

      {/* Noms des annonces sous l'axe X */}
      {stats.map((s, i) => {
        const x = -xSpan / 2 + X_STEP / 2 + i * X_STEP
        return (
          <Html key={s.id} position={[x, -0.05, 2.1]} center style={{ pointerEvents: "none" }}>
            <div className="text-[10px] text-stone-400 max-w-[90px] truncate text-center">{s.title}</div>
          </Html>
        )
      })}
    </>
  )
}

export function AdsStats3D({ stats }: { stats: AdStat[] }) {
  if (!stats.length) return null
  const camZ = Math.max(9, stats.length * 2.2 + 6)
  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-stone-950">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-stone-300" />
          <p className="text-xs font-semibold text-stone-200">Statistiques 3D — vues · visiteurs · likes</p>
        </div>
        <p className="text-[10px] text-stone-500">Glisser : pivoter · Molette : zoom</p>
      </div>
      {/* Légende */}
      <div className="flex items-center gap-3 px-4 pb-1">
        {METRICS.map((m) => (
          <span key={m.key} className="flex items-center gap-1.5 text-[10px] text-stone-300">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: m.color }} />
            {m.label}
          </span>
        ))}
      </div>
      <div className="h-[340px]">
        <Canvas camera={{ position: [6, 7, camZ], fov: 55 }} style={{ background: "#0c0a09" }}>
          <Scene stats={stats} />
          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.6}
            zoomSpeed={0.8}
            minDistance={4}
            maxDistance={40}
            maxPolarAngle={Math.PI / 2.05}
          />
        </Canvas>
      </div>
    </div>
  )
}
