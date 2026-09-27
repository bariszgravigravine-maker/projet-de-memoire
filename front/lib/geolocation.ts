export interface BrowserGeoPosition {
  lat: number
  lon: number
  accuracy: number | null
}

interface PrecisePositionOptions {
  timeoutMs?: number
  desiredAccuracyM?: number
  onUpdate?: (position: BrowserGeoPosition) => void
}

function toBrowserPosition(pos: GeolocationPosition): BrowserGeoPosition {
  return {
    lat: pos.coords.latitude,
    lon: pos.coords.longitude,
    accuracy: pos.coords.accuracy ?? null,
  }
}

export function getPreciseBrowserPosition({
  timeoutMs = 12000,
  desiredAccuracyM = 75,
  onUpdate,
}: PrecisePositionOptions = {}) {
  return new Promise<BrowserGeoPosition>((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Géolocalisation non supportée"))
      return
    }

    let best: GeolocationPosition | null = null
    let watchId: number | null = null
    let settled = false
    let fallbackStarted = false

    const emitBest = () => {
      if (best) onUpdate?.(toBrowserPosition(best))
    }

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
      resolve(toBrowserPosition(best))
    }

    const fail = (error: GeolocationPositionError) => {
      if (settled) return
      if (best) {
        finish()
        return
      }
      if (!fallbackStarted) {
        fallbackStarted = true
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            best = pos
            emitBest()
            finish()
          },
          fail,
          {
            enableHighAccuracy: false,
            timeout: Math.min(6000, timeoutMs),
            maximumAge: 30000,
          }
        )
        return
      }
      settled = true
      cleanup()
      reject(error)
    }

    const timer = window.setTimeout(finish, timeoutMs)

    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const accuracy = pos.coords.accuracy ?? Number.POSITIVE_INFINITY
          if (!best || accuracy < (best.coords.accuracy ?? Number.POSITIVE_INFINITY)) {
            best = pos
            emitBest()
          }
          if (accuracy <= desiredAccuracyM) finish()
        },
        fail,
        { enableHighAccuracy: true, timeout: Math.min(6000, timeoutMs), maximumAge: 0 }
      )
    } catch (error) {
      fail(error as GeolocationPositionError)
    }
  })
}

export function formatAccuracyM(accuracy: number | null | undefined) {
  if (accuracy == null || !Number.isFinite(accuracy)) return null
  if (accuracy >= 1000) return `±${(accuracy / 1000).toFixed(1)} km`
  return `±${Math.round(accuracy)} m`
}
