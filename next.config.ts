import type { NextConfig } from "next";

// Container strategy: Next.js runs as a server in Docker/Fly.io
// No static export needed — GitHub Pages removed (2026-06-10)
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // Prevent CDN/edge caching of HTML pages — JS chunks are immutable and cached correctly
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
