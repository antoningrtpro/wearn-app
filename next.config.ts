import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // firebase-admin pulls in jwks-rsa -> jose, which ships pure ESM — bundling
  // it (Turbopack's default) breaks with ERR_REQUIRE_ESM at runtime on
  // Vercel. Leaving it external makes Node's own require() resolve it
  // directly from node_modules instead.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
