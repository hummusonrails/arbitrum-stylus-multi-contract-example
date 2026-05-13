import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin Turbopack to the workspace root so Next stops warning about
  // ambient lockfiles. We live inside a pnpm monorepo, so the canonical
  // root is two levels up from apps/frontend.
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
};

export default nextConfig;
