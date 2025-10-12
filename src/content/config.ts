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
            // Core (MD frontmatter)
            title: z.string(),
            categories: z.array(z.string()).min(1), // multi-category ready
            summary: z.string().optional(),

            // Keep these for later (not rendered yet, but future-proof)
            tags: z.array(z.string()).optional(),
            status: z.enum(["in_progress", "shipped", "archived"]).default("shipped"),
            visibility: z.enum(["public", "private"]).default("public"),
            started: z.string().optional(),
            ended: z.string().optional(),
            featured: z.boolean().default(false),
            order: z.number().optional(),
            draft: z.boolean().optional(),
            thumb: z.string().optional(),
            gallery: z.array(z.string()).optional(),
            links: z.object({
                demo: z.string().url().optional(),
                repo: z.string().url().optional(),
                external: z.string().url().optional(),
            }).optional(),
            downloads: z.array(z.object({
                label: z.string(),
                path: z.string(),
                size: z.string().optional(),
            })).optional(),
            role: z.string().optional(),
            collaborators: z.array(z.object({
                name: z.string(),
                link: z.string().url().optional(),
            })).optional(),
            metrics: z.array(z.object({
                key: z.string(),
                value: z.string(),
            })).optional(),
            demoAuth: z.object({
                user: z.string(),
                note: z.string().optional(),
            }).optional(),
            related: z.array(z.string()).optional(),
        }),
    }),
};
