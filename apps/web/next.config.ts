import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // En desarrollo la WebApp se abre en localhost y en 127.0.0.1; sin esto Next
  // bloquea `/_next/hmr` como origen cruzado y la página no hidrata.
  allowedDevOrigins: ["localhost", "127.0.0.1"],
};

export default nextConfig;
