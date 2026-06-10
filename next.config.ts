import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // GitHub Pages serves from /chipper-ui/ subdirectory
  basePath: isProd ? "/chipper-ui" : "",
  assetPrefix: isProd ? "/chipper-ui/" : "",
};

export default nextConfig;
