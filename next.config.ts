import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow phone access in dev mode
  // @ts-ignore - allowedDevOrigins is suggested by Next.js server logs
  allowedDevOrigins: ['192.168.1.194', 'localhost:3000'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
