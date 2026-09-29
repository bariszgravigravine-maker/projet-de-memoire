// Redimensionne une image côté client avant envoi (avatars, photos d'annonces).
// Réduit drastiquement le payload : une photo de téléphone fait 3-10 Mo,
// une fois redimensionnée en JPEG max 1024px elle passe sous ~200 Ko.
export function fileToResizedDataURL(file: File, maxSize = 1024, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject(new Error("Canvas non disponible"))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
