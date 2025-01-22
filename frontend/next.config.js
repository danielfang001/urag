/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*' // Added /api/ to match backend routes
      }
    ]
  }
}

module.exports = nextConfig 