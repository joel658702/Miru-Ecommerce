import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // En desarrollo la WebApp se abre en localhost y en 127.0.0.1; sin esto Next
  // bloquea `/_next/hmr` como origen cruzado y la página no hidrata.
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  // Cabeceras de seguridad para producción (panel privado).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
