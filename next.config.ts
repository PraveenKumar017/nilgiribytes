import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/shop.html", destination: "/shop", permanent: true },
      { source: "/cart.html", destination: "/cart", permanent: true },
      { source: "/about.html", destination: "/about", permanent: true },
      { source: "/blog.html", destination: "/blog", permanent: true },
      { source: "/admin.html", destination: "/admin", permanent: true },
      { source: "/privacy_policy.html", destination: "/policies/privacy", permanent: true },
      { source: "/store_policy.html", destination: "/policies/store", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
