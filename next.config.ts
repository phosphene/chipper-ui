import type { NextConfig } from "next";

// Container strategy: Next.js runs as a server in Docker/Fly.io
// No static export needed — GitHub Pages removed (2026-06-10)
const nextConfig: NextConfig = {
  images: { unoptimized: true },
};

export default nextConfig;
