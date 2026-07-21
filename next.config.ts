import type { NextConfig } from "next";

// GitHub Pages serves this repo as a project site under /sustain-U (not at
// the domain root), so root-relative links and asset URLs need that prefix
// when building for GitHub Pages. The Capacitor (iOS/Android) build serves
// the static export from the root of its own webDir, so it must NOT have a
// basePath. The GitHub Pages workflow sets GITHUB_PAGES=true before
// `npm run build`; all other builds (local dev, Capacitor, Codemagic) are
// unaffected and keep basePath "".
const isGithubPagesBuild = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPagesBuild ? "/sustain-U" : "";

const nextConfig: NextConfig = {
  output: "export",
  ...(basePath && { basePath, assetPrefix: basePath }),
  env: {
    // Exposed to client code so hardcoded root-relative fetch()/register()
    // calls (which Next.js does not auto-prefix, unlike <Link>/<Image>) can
    // still resolve correctly when deployed under the /sustain-U subpath.
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
