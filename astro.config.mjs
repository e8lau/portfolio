import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

// ✅ set your actual repo name here
const REPO_NAME = "portfolio";

export default defineConfig({
    // 🔹 the base path Astro will prepend to asset and link URLs
    base: `/${REPO_NAME}/`,

    // 🔹 used by sitemap, canonical URLs, and social meta
    site: `https://ethanlau8.github.io/${REPO_NAME}/`,

    integrations: [react(), sitemap()],
    output: "static", // ✅ ensures a fully static build (works with GitHub Pages)
    trailingSlash: "ignore",

    vite: {
        build: {
            // optional, ensures relative paths in the final HTML
            assetsInlineLimit: 0,
        },
    },
});
