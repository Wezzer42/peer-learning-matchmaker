import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  "include": [
    "next-env.d.ts",
    "types",
    "**/*.ts",
    "**/*.tsx"
  ]
};

export default nextConfig;
