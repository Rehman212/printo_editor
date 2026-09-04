import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  transpilePackages: ["fabric"],
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
