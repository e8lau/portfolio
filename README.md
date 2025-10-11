## Portfolio (Astro)

This is a personal portfolio site built with Astro and React components. The README documents the repository layout and basic commands to run and build the project.

### Project layout

Top-level files:

- `astro.config.mjs` - Astro configuration
- `package.json` - npm scripts and dependencies
- `tsconfig.json` - TypeScript configuration
- `site.webmanifest` - web manifest for the site
- `public/` - static assets served as-is

Source files:

- `src/` - primary source folder
  - `components/` - reusable UI components
    - `common/` - header, footer, CTA, page header
      - `CTA.astro`
      - `Footer.astro`
      - `Header.astro`
      - `PageHeader.astro`
    - `home/` - pieces used on the home page (teasers, clients, expertise, projects, testimonials)
      - `HomeAboutTeaser.astro`
      - `HomeClients.astro`
      - `HomeExpertise.astro`
      - `HomeProjects.astro`
      - `HomeTestimonials.astro`
  - `layouts/` - layout templates
    - `BaseLayout.astro`
    - `PostLayout.astro`
  - `pages/` - routes and pages
    - `index.astro` (home)
    - `about.astro`
    - `contact.astro`
    - `experience.astro`
    - `projects.astro`
    - `projects/` - projects pages
      - `[slug].astro`
  - `react/` - React components used in the site
    - `TestimonialsSlider.tsx`

- `styles/` - global CSS and vendor styles
  - `styles.css`
  - `vendor.css`

Public/static assets:

- `public/images/` - images, avatars, icons, thumbnails
  - `avatars/`
  - `clients/`
  - `icons/`
  - `thumbs/`
    - `about/`, `contact/`, `single/`

Other folders/files:

- `js/` - small frontend scripts
  - `main.js`
  - `plugins.js`

### Notable files

- `package.json` - contains dev and build scripts as well as project dependencies
- `astro.config.mjs` - tells Astro how to build the site and which integrations to use

### NPM scripts

The project exposes the following scripts (from `package.json`):

- `npm run dev` — start local dev server (Astro dev)
- `npm run build` — build static site (Astro build)
- `npm run preview` — preview a production build locally
- `npm run astro` — run the `astro` CLI

### Quick start (PowerShell)

Open PowerShell in the project root and run:

```powershell
npm install
npm run dev
```

To build and preview:

```powershell
npm run build
npm run preview
```

### Dependencies

- Astro (meta-framework)
- `@astrojs/react` for using React components inside Astro
- `@astrojs/sitemap` configured as a dev dependency for sitemap generation

### Notes & next steps

- This repository uses Astro 5.x and integrates React components via `@astrojs/react`.
- If you'd like, I can add a more detailed CONTRIBUTING guide, add development notes for VS Code, or expand the README with deployment instructions (Netlify / Vercel / GitHub Pages).

---

Completion: README added describing the project layout and basic commands.
