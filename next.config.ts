import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Removed to enable API Routes on Vercel
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
