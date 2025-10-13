// src/content/config.ts
import { defineCollection, z } from "astro:content";

export const collections = {
    experience: defineCollection({
        type: "content",
        schema: z.object({
            title: z.string(),                // e.g. "Digital Marketing"
            company: z.string().optional(),   // e.g. "Kobil Inc."
            dates: z.string().optional(),     // e.g. "Dec 2021 – Apr 2023"
            category: z.string().default("General"),
            summary: z.string().optional(),
            bullets: z.array(z.string()).nonempty(),
            order: z.number().optional(),
            draft: z.boolean().optional(),
        }),
    }),

    projects: defineCollection({
        type: "content",
        schema: z.object({
            title: z.string(),
            // Example: "Astro React Portfolio"

            slug: z.string().optional(),
            // Optional explicit slug (otherwise auto-generated from folder name)
            // Example: "astro-portfolio"

            categories: z.array(z.string()).min(1),
            // High-level grouping — can have multiple values.
            // Example: ["Web", "Design"]

            tags: z.array(z.string()).optional(),
            // Finer-grained keywords.
            // Example: ["astro", "react", "islands"]

            summary: z.string().optional(),
            // Short text shown on the project card.
            // Example: "Minimal, fast Astro + React islands portfolio site."

            status: z.enum(["in_progress", "shipped", "archived"]).default("shipped"),
            // Current project state.

            visibility: z.enum(["public", "private"]).default("public"),
            // Whether it's safe to link externally (private = hide links, still show card).

            started: z.string().optional(),
            ended: z.string().optional(),
            // Example: started: "2024-05", ended: "2024-08"

            featured: z.boolean().default(false),
            // True → can highlight on homepage, etc.

            order: z.number().optional(),
            // Manual sort order (lower = higher priority)

            draft: z.boolean().optional(),
            // If true, hidden from normal lists (useful for WIP entries)

            /* ------------------------------------------------------------
               Media
            ------------------------------------------------------------ */

            thumb: z.string().optional(),
            // Path to thumbnail image (content asset or /src/images/...).
            // Example: "./thumb.webp"

            gallery: z.array(z.string()).optional(),
            // Optional extra images.
            // Example: ["./gallery-1.webp", "./gallery-2.webp"]

            video: z.string().url().optional(),
            // Optional demo video.
            // Example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

            ogImage: z.string().optional(),
            // Override Open Graph image.

            /* ------------------------------------------------------------
               Links & Downloads
            ------------------------------------------------------------ */

            links: z
                .object({
                    demo: z.string().url().optional(),   // "https://example.com/demo"
                    repo: z.string().url().optional(),   // "https://github.com/e8lau/project"
                    writeup: z.string().url().optional(),// "https://medium.com/@e8lau/project-article"
                    external: z.string().url().optional()// "https://press-coverage.com/article"
                })
                .optional(),

            downloads: z
                .array(
                    z.object({
                        label: z.string(),        // "Case Study (PDF)"
                        path: z.string(),         // "/archive/project/case-study.pdf"
                        size: z.string().optional() // "2.3 MB"
                    })
                )
                .optional(),

            /* ------------------------------------------------------------
               Team & Role
            ------------------------------------------------------------ */

            role: z.string().optional(),
            // Example: "Lead Developer & Designer"

            collaborators: z
                .array(
                    z.object({
                        name: z.string(),              // "Jane Doe"
                        link: z.string().url().optional() // "https://linkedin.com/in/janedoe"
                    })
                )
                .optional(),

            /* ------------------------------------------------------------
               Metrics & Relationships
            ------------------------------------------------------------ */

            metrics: z
                .array(
                    z.object({
                        key: z.string(),  // "Users"
                        value: z.string() // "1K+"
                    })
                )
                .optional(),

            demoAuth: z
                .object({
                    user: z.string(),                 // "demo@project.com"
                    note: z.string().optional()       // "Password: demo123 (read-only)"
                })
                .optional(),

            related: z.array(z.string()).optional(),
            // Slugs of related projects (for "Related Projects" section).
            // Example: ["ml-alumni-model", "astro-portfolio"]
        }),
    }),
};

