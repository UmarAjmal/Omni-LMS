import type { NextConfig } from "next";
import path from "path";

const isMobileBuild = process.env.BUILD_TARGET === "mobile";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_TARGET: process.env.BUILD_TARGET || "",
  },
  ...(isMobileBuild
    ? {
        output: "export",
        images: {
          unoptimized: true,
        },
      }
    : {}),
  allowedDevOrigins: [
    '192.168.100.198',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
  // Lock Turbopack root to client directory to prevent parent directory indexing
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Exclude native Android build folders from file tracing
  outputFileTracingExcludes: {
    '*': [
      './android/**',
      './ios/**',
      './www/**',
      '**/.gradle/**',
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/.git/**',
          '**/node_modules/**',
          '**/android/**',
          '**/ios/**',
          '**/.gradle/**',
          '**/www/**',
          '**/.next/**',
        ],
      };
    }
    return config;
  },
};

export default nextConfig;