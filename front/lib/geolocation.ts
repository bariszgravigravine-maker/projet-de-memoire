export interface BrowserGeoPosition {
  lat: number
  lon: number
  accuracy: number | null
}

interface PrecisePositionOptions {
  timeoutMs?: number
  desiredAccuracyM?: number
}

export function getPreciseBrowserPosition({
  timeoutMs = 12000,
  desiredAccuracyM = 75,
}: PrecisePositionOptions = {}) {
  return new Promise<BrowserGeoPosition>((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Géolocalisation non supportée"))
      return
    }

    let best: GeolocationPosition | null = null
    let watchId: number | null = null
    let settled = false

    const cleanup = () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId)
      window.clearTimeout(timer)
    }

    const finish = () => {
      if (settled) return
      settled = true
      cleanup()
      if (!best) {
        reject(new Error("Position indisponible"))
        return
      }
      resolve({
        lat: best.coords.latitude,
        lon: best.coords.longitude,
        accuracy: best.coords.accuracy ?? null,
      })
    }

    const fail = (error: GeolocationPositionError) => {
      if (best) {
        finish()
        return
      }
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }

    const timer = window.setTimeout(finish, timeoutMs)

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const accuracy = pos.coords.accuracy ?? Number.POSITIVE_INFINITY
        if (!best || accuracy < (best.coords.accuracy ?? Number.POSITIVE_INFINITY)) {
          best = pos
        }
        if (accuracy <= desiredAccuracyM) finish()
      },
      fail,
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
    )
  })
}

export function formatAccuracyM(accuracy: number | null | undefined) {
  if (accuracy == null || !Number.isFinite(accuracy)) return null
  if (accuracy >= 1000) return `±${(accuracy / 1000).toFixed(1)} km`
  return `±${Math.round(accuracy)} m`
}
