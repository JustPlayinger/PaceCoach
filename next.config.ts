import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // tesseract.js 使用 worker_threads + wasm，必须保持外部化（不参与打包）
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;
