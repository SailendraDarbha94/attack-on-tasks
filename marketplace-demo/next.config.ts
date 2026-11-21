import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // The demo keeps its data in browser storage, so most pages cannot be
    // rendered on the server, and Next's dev-time "instant navigation" check
    // reports that as an error on every page. Only check pages that opt in.
    // Remove this once the data comes from a real backend.
    instantInsights: { validationLevel: "manual-warning" },
  },
  turbopack: {
    // This site lives in a subfolder of another project. Without this, Next
    // picks the parent folder (and its lockfile) as the workspace root.
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
