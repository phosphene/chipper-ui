import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",        // static HTML export for GitHub Pages
  trailingSlash: true,     // required for Pages routing
  images: {
    unoptimized: true,     // Pages doesn't run the Next.js image server
  },
};

export default nextConfig;
