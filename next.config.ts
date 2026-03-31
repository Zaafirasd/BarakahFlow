import type { NextConfig } from "next";

type ExtendedNextConfig = NextConfig & {
  allowedDevOrigins?: string[];
};

const nextConfig: ExtendedNextConfig = {
  // Allow phone access in dev mode
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
