// types/projects.ts
export type ProjectFrontmatter = {
    title: string;
    slug?: string;
    categories: string[];
    tags?: string[];
    description?: string;
    status?: "in_progress" | "shipped" | "archived";
    visibility?: "public" | "private";
    started?: string;  // "YYYY-MM"
    ended?: string;    // "YYYY-MM"
    featured?: boolean;
    order?: number;
    draft?: boolean;
    thumb?: string;
    gallery?: string[];
    video?: string;
    ogImage?: string;
    links?: {
        demo?: string;
        repo?: string;
        writeup?: string;
        external?: string;
    };
    downloads?: Array<{ label: string; path: string; size?: string }>;
    role?: string;
    collaborators?: Array<{ name: string; link?: string }>;
    metrics?: Array<{ key: string; value: string }>;
    demoAuth?: { user: string; note?: string };
    related?: string[];
};

export type ProjectCardProps = {
    href: string;
    title: string;
    excerpt?: string;        // maps from description
    cover?: string;          // maps from thumb
    categories: string[];
    tags?: string[];
    started?: string;
    ended?: string;
    status?: "in_progress" | "shipped" | "archived";
    visibility?: "public" | "private";
};
