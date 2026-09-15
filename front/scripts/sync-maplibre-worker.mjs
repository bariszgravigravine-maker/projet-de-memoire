// Copie les fichiers worker de maplibre-gl dans public/maplibre.
//
// Pourquoi: Turbopack (bundler par defaut de Next.js) ne reecrit pas
// correctement les imports internes du worker maplibre-gl quand celui-ci
// est charge via `new Worker(new URL(...), { type: "module" })`. Le worker
// echoue silencieusement a se charger (voir vercel/next.js#98137), ce qui
// fait que la carte reste bloquee sur "Chargement..." sans jamais afficher
// de tuiles, aussi bien en dev qu'en production (Vercel).
//
// Contournement recommande par les mainteneurs: vendoriser le worker (et
// son import "shared") dans public/, hors du pipeline de bundling, et
// pointer maplibregl.setWorkerUrl() dessus au runtime.
import { copyFileSync, mkdirSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgDist = join(__dirname, "..", "node_modules", "maplibre-gl", "dist")
const outDir = join(__dirname, "..", "public", "maplibre")

const files = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]

if (!existsSync(pkgDist)) {
  console.warn("[sync-maplibre-worker] maplibre-gl introuvable, etape ignoree.")
  process.exit(0)
}

mkdirSync(outDir, { recursive: true })

for (const file of files) {
  const src = join(pkgDist, file)
  const dest = join(outDir, file)
  if (!existsSync(src)) {
    console.warn(`[sync-maplibre-worker] fichier manquant: ${src}`)
    continue
  }
  copyFileSync(src, dest)
  console.log(`[sync-maplibre-worker] copie ${file} -> public/maplibre/${file}`)
}
