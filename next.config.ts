import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  transpilePackages: ["fabric"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/products", destination: "/", permanent: false },
      { source: "/products/:path*", destination: "/", permanent: false },
      { source: "/design/:path*", destination: "/", permanent: false },
      { source: "/editor/:path*", destination: "/", permanent: false },
      { source: "/preview/:path*", destination: "/", permanent: false },
      { source: "/share/:path*", destination: "/", permanent: false },
      { source: "/saved-designs", destination: "/", permanent: false },
      { source: "/cart", destination: "/", permanent: false },
      { source: "/checkout", destination: "/", permanent: false },
      { source: "/orders", destination: "/", permanent: false },
      { source: "/orders/:path*", destination: "/", permanent: false },
      { source: "/account", destination: "/", permanent: false },
      { source: "/login", destination: "/", permanent: false },
      { source: "/register", destination: "/", permanent: false },
      { source: "/forgot-password", destination: "/", permanent: false },
      { source: "/reset-password", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
