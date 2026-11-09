import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.0.0.140'],
  async headers() {
    return [
      {
        source: "/edit/:path*", 
        headers: [
          { key: "Referrer-Policy", value: "no-referrer"}, 
          { key: "Cache-Control", value: "no-store" }, 
          { key: "X-Robots-Tag", value: "noindex, nofollow"}, 
        ]
      }
    ]
  }
};

export default nextConfig;
