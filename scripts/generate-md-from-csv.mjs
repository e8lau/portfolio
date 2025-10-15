#!/usr/bin/env node
/*
# macOS/Linux
node scripts/generate-md-from-csv.mjs --csv "./scripts/Portfolio MD File list.csv" --out "./src/content/projects" --overwrite --include-blanks

# Try a dry run first:
node scripts/generate-md-from-csv.mjs --csv "./scripts/Portfolio MD File list.csv" --out "./src/content/projects" --dry-run
*/

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import yaml from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------
// CLI ARGS
// ------------------------------
const args = process.argv.slice(2);
function flag(name) {
    return args.includes(`--${name}`);
}
function getArg(name, def = undefined) {
    const i = args.findIndex((a) => a === `--${name}`);
    if (i !== -1 && args[i + 1]) return args[i + 1];
    return def;
}

const csvPath = getArg("csv");
const outDir = getArg("out", "src/content/projects");
const overwrite = flag("overwrite");
const includeBlanks = flag("include-blanks");
const dryRun = flag("dry-run");

if (!csvPath) {
    console.error(
        "Usage:\n  node scripts/generate-md-from-csv.mjs --csv \"./Portfolio MD FIle list.csv\" --out ./src/content/projects [--overwrite] [--include-blanks] [--dry-run]"
    );
    process.exit(1);
}

// ------------------------------
// HELPERS
// ------------------------------
const truthy = new Set(["true", "1", "yes", "y"]);
const falsy = new Set(["false", "0", "no", "n"]);

const toBool = (val) => {
    if (val === undefined || val === null) return undefined;
    const s = String(val).trim().toLowerCase();
    if (truthy.has(s)) return true;
    if (falsy.has(s)) return false;
    return undefined; // leave undefined so we can drop if includeBlanks=false
};

const isBlank = (v) =>
    v === undefined ||
    v === null ||
    (typeof v === "string" && v.trim() === "") ||
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === "object" &&
        !Array.isArray(v) &&
        Object.keys(v).length === 0);

function ensureArray(val) {
    if (val === undefined || val === null || val === "") return [];
    if (Array.isArray(val)) return val;
    return [val];
}

function parseSemicolonList(val) {
    // for categories like: "A; B; C"
    if (!val || String(val).trim() === "") return [];
    return String(val)
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
}

function parseCommaList(val) {
    // for tags or related like: "a, b, c"
    if (!val || String(val).trim() === "") return [];
    return String(val)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

function parseDownloads(val) {
    // Accept JSON array OR "label|path|size; label2|path2"
    if (!val || String(val).trim() === "") return [];
    const text = String(val).trim();
    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
    } catch {
        // fallback to semi-structured
    }
    return text.split(";").map((chunk) => {
        const [label, p, size] = chunk.split("|").map((s) => (s ? s.trim() : ""));
        const obj = {};
        if (label) obj.label = label;
        if (p) obj.path = p;
        if (size) obj.size = size;
        return obj;
    }).filter((o) => Object.keys(o).length > 0);
}

function parseLinks(row) {
    // columns: links.demo, links.repo, links.writeup, links.external
    const demo = safeStr(row["links.demo"]);
    const repo = safeStr(row["links.repo"]);
    const writeup = safeStr(row["links.writeup"]);
    const external = safeStr(row["links.external"]);
    const obj = {};
    if (demo) obj.demo = demo;
    if (repo) obj.repo = repo;
    if (writeup) obj.writeup = writeup;
    if (external) obj.external = external;
    return obj;
}

function parseCollaborators(val) {
    // Accept JSON array OR "Name|https://link; Name2|"
    if (!val || String(val).trim() === "") return [];
    const text = String(val).trim();
    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
    } catch {
        // fallback
    }
    return text
        .split(";")
        .map((chunk) => {
            const [name, link] = chunk.split("|").map((s) => (s ? s.trim() : ""));
            const obj = {};
            if (name) obj.name = name;
            if (link) obj.link = link;
            return obj;
        })
        .filter((o) => o.name);
}

function parseMetrics(val) {
    // Accept JSON array OR "key:value; key2:value2"
    if (!val || String(val).trim() === "") return [];
    const text = String(val).trim();
    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
    } catch {
        // fallback
    }
    return text
        .split(";")
        .map((pair) => {
            const [key, value] = pair.split(":").map((s) => (s ? s.trim() : ""));
            const obj = {};
            if (key) obj.key = key;
            if (value) obj.value = value;
            return obj;
        })
        .filter((o) => o.key && o.value);
}

function parseDemoAuth(row) {
    const user = safeStr(row["demoAuth.user"]);
    const note = safeStr(row["demoAuth.note"]);
    const obj = {};
    if (user) obj.user = user;
    if (note) obj.note = note;
    return obj;
}

function safeStr(v) {
    if (v === undefined || v === null) return "";
    const s = String(v).trim();
    return s === "" ? "" : s;
}

function slugify(s) {
    return String(s)
        .toLowerCase()
        .trim()
        .replace(/['"]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

function dropBlanksDeep(obj) {
    if (Array.isArray(obj)) {
        const arr = obj
            .map((v) => dropBlanksDeep(v))
            .filter((v) => !isBlank(v));
        return arr;
    } else if (obj && typeof obj === "object") {
        const out = {};
        for (const [k, v] of Object.entries(obj)) {
            const vv = dropBlanksDeep(v);
            if (!isBlank(vv)) out[k] = vv;
        }
        return out;
    }
    return obj;
}

// ------------------------------
// READ CSV
// ------------------------------
const csvRaw = fs.readFileSync(csvPath);
const rows = parse(csvRaw, {
    columns: true,
    skip_empty_lines: true,
});

// ------------------------------
// PROCESS ROWS
// ------------------------------
let created = 0;
let skipped = 0;
let overwritten = 0;

for (const row of rows) {
    // Required
    const title = safeStr(row.title);
    if (!title) {
        console.warn("Skipping row without 'title'. Row:", row);
        skipped++;
        continue;
    }

    // Folder name from 'folder' column (required by you)
    const folderNameRaw = safeStr(row.folder) || slugify(title);
    const folderName = folderNameRaw || slugify(title);
    const projectDir = path.join(outDir, folderName);
    const mdPath = path.join(projectDir, "index.md");

    const thumbPath = path.join(projectDir, "thumb.webp");
    const thumbExists = fs.existsSync(thumbPath);

    // Schema fields
    const frontmatter = {
        title,
        slug: safeStr(row.slug) || undefined,

        // Arrays/strings
        categories: parseSemicolonList(row.categories), // REQUIRED min(1) → ensure your CSV provides at least one
        tags: parseCommaList(row.tags),

        description: safeStr(row.description) || undefined,

        status: safeStr(row.status) || "shipped",
        visibility: safeStr(row.visibility) || "public",

        started: safeStr(row.started) || undefined,
        ended: safeStr(row.ended) || undefined,

        featured: toBool(row.featured),
        order: row.order !== undefined && row.order !== "" ? Number(row.order) : undefined,
        draft: toBool(row.draft),

        // Media
        thumb: thumbExists
            ? {
                src: "./thumb.webp",
                alt: safeStr(row["thumbAlt"]) || title, // optional CSV column
            }
            : undefined,
        gallery: parseCommaList(row.gallery),
        video: safeStr(row.video) || undefined,
        ogImage: safeStr(row.ogImage) || undefined,

        // Links & Downloads
        links: parseLinks(row),
        downloads: parseDownloads(row.downloads),

        // Team & Role
        role: safeStr(row.role) || undefined,
        collaborators: parseCollaborators(row.collaborators),

        // Metrics & Relationships
        metrics: parseMetrics(row.metrics),
        demoAuth: parseDemoAuth(row),
        related: parseCommaList(row.related),
    };

    // Optionally drop blanks
    const fm =
        includeBlanks ? frontmatter : dropBlanksDeep(frontmatter);

    // Safety: categories must have min(1)
    if (!fm.categories || fm.categories.length === 0) {
        console.error(
            `ERROR: row "${title}" has no categories. Your schema requires at least 1.`
        );
        skipped++;
        continue;
    }

    // Compose MD
    const yamlBlock = yaml.dump(fm, {
        lineWidth: 120,
        noRefs: true,
        skipInvalid: true,
    });
    const body = "";
    const mdFile = `---\n${yamlBlock}---\n\n${body}`;

    // Write
    if (!fs.existsSync(projectDir)) {
        if (dryRun) {
            console.log(`[dry-run] mkdir -p ${projectDir}`);
        } else {
            fs.mkdirSync(projectDir, { recursive: true });
        }
    }

    if (fs.existsSync(mdPath) && !overwrite) {
        console.warn(`Skipping existing file (use --overwrite): ${mdPath}`);
        skipped++;
        continue;
    }

    if (dryRun) {
        console.log(`[dry-run] write ${mdPath}\n${mdFile}`);
    } else {
        fs.writeFileSync(mdPath, mdFile, "utf8");
        if (overwrite && fs.existsSync(mdPath)) overwritten++;
        else created++;
    }
}

// ------------------------------
// REPORT
// ------------------------------
console.log(
    `Done. created=${created} overwritten=${overwritten} skipped=${skipped} (dryRun=${dryRun}, includeBlanks=${includeBlanks}, overwrite=${overwrite})`
);
