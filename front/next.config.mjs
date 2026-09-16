// Origine du backend (VPS). Surchargeable via la variable d'environnement
// API_ORIGIN pour ne pas avoir à modifier ce fichier si le VPS change.
const API_ORIGIN = process.env.API_ORIGIN || 'http://185.98.128.123:3001'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // IMPORTANT : par défaut Next redirige (308) "/socket.io/" vers "/socket.io".
  // Or le client socket.io demande TOUJOURS "/socket.io/?EIO=4&transport=..."
  // (slash final). Cette redirection 308 ne porte pas les en-têtes CORS du
  // backend, ce qui faisait échouer la connexion temps réel avec
  // "blocked by CORS policy / net::ERR_FAILED 308".
  // On désactive donc cette normalisation et on proxy explicitement les deux
  // formes d'URL vers le backend.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_ORIGIN}/api/:path*`,
      },
      // Forme exacte avec slash final (celle utilisée par socket.io)
      {
        source: '/socket.io/',
        destination: `${API_ORIGIN}/socket.io/`,
      },
      // Forme sans slash final
      {
        source: '/socket.io',
        destination: `${API_ORIGIN}/socket.io`,
      },
      // Sous-chemins éventuels
      {
        source: '/socket.io/:path*',
        destination: `${API_ORIGIN}/socket.io/:path*`,
      },
    ];
  },
}

export default nextConfig
