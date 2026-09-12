/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://185.98.128.123:3001/api/:path*',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://185.98.128.123:3001/socket.io/:path*',
      },
    ];
  },
}

export default nextConfig
