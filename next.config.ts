import type { NextConfig } from "next";
// @ts-expect-error next-pwa does not have types
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      encoding: false, // face-api.js may also ask for this
    };
    return config;
  },
};

export default withPWA(nextConfig);
