/* ============================================================================
 * projects.js
 * (modularized for flexible use across homepage, projects page, etc.)
 * Exports:
 *  – renderProjects(opts) : main function
 *  – utilities: getThumbnail(), limitText(), fmtDate(), slug()
 * -------------------------------------------------------------------------- */

const normalize = p => p.replace(/\/?(index\.html)?$/, '/');
const ARE_WE_HOME = normalize(location.pathname) === '/portfolio/';
const fixURL = u =>
    u.startsWith('http') || ARE_WE_HOME ? './' + u : '../' + u;

/* ---------------------------------------------------------------------------
 * Utility Functions
 * ------------------------------------------------------------------------ */
export const slug = str =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export function fmtDate(input) {
    if (!input) return '';

    const format = iso => {
        const d = new Date(iso);
        return isNaN(d) ? iso : d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    };

    if (Array.isArray(input)) {
        return input.map(format).join(' – ');
    } else {
        return format(input);
    }
}

export function limitText(text, limit = 30) {
    if (!text) return '';
    return text.length > limit ? text.slice(0, limit).trimEnd() + '…' : text;
}

/**
 * Returns a thumbnail for a given file.
 * @param {string} filePath – path to the asset
 * @param {boolean|string} useAsIs – if true or non-empty, return provided thumbnail
 * @returns {Promise<string|null>} Base64 string or image path
 */
export async function getThumbnail(filePath, useAsIs = '') {
    if (useAsIs) filePath = fixURL(useAsIs);

    const imageExt = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff", ".svg"];
    if (imageExt.some(ext => filePath.toLowerCase().endsWith(ext))) {
        return filePath;
    }

    if (filePath.toLowerCase().endsWith(".pdf")) {
        try {
            const b64 = await pdfToBase64(filePath);
            if (!b64) throw new Error("PDF conversion returned null");
            return b64;
        } catch (err) {
            console.error("Thumbnail generation failed:", err);
            return null;
        }
    }

    return null;
}

/* PDF.js library worker */
// pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

/**
 * Convert first page of a PDF into a base64 PNG thumbnail
 */
async function pdfToBase64(pdfUrl, pageNumber = 1, scale = 1) {
    try {
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport }).promise;
        return canvas.toDataURL("image/png");
    } catch (error) {
        console.error("Error converting PDF to Base64:", error);
        return null;
    }
}

/* ---------------------------------------------------------------------------
 * Main Export: renderProjects(opts)
 * ------------------------------------------------------------------------ */
export async function renderProjects(opts = {}) {
    const defaults = {
        jsonPath: fixURL('portfolio/projects.json'),
        targetUL: document.getElementById('project-list'),
        modalParent: document.getElementById('modal-container'),
        nav: document.getElementById('project-filter'),
        searchInput: document.getElementById('project-search'),
        count: Infinity,       // how many projects (Infinity = all)
        full: true,           // build modals, filters, search
        cardTpl: defaultCardTpl, // fallback card template
    };
    const cfg = { ...defaults, ...opts };

    if (!cfg.targetUL) {
        console.error('renderProjects: targetUL not found.');
        return;
    }

    const data = await fetch(cfg.jsonPath)
        .then(r => {
            if (!r.ok) throw new Error('Could not load projects.json');
            return r.json();
        })
        .catch(console.error);

    const projects = (data || [])
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, cfg.count);

    for (const [i, p] of projects.entries()) {
        const filePath = fixURL(p.file);
        const thumb = await getThumbnail(filePath, p.thumbnail) || fixURL('images/thumbnails/default_thumb.png');

        cfg.targetUL.insertAdjacentHTML('beforeend', cfg.cardTpl(p, thumb, i));

        if (cfg.full && cfg.modalParent) {
            buildModal(p, thumb, i, filePath, cfg.modalParent);
        }
    }

    if (cfg.full) {
        initIsotopeFiltering(cfg);
        initLightbox(cfg);
    }
}

/* ---------------------------------------------------------------------------
 * Templates
 * ------------------------------------------------------------------------ */
function defaultCardTpl(p, thumb, i) {
    const modalID = `modal-${i}-${slug(p.title)}`;
    return `
        <li class="folio-list__item"
            data-cat="${(p.category || []).join('|')}"
            data-title="${p.title.toLowerCase()}"
            data-desc="${(p.description || '').toLowerCase()}"
            data-date="${(fmtDate(p.date) || '').toLowerCase()}">
            <a class="folio-list__item-link" href="#${modalID}">
                <div class="folio-list__item-pic">
                    <img src="${thumb}" alt="${p.title}" ${p.border ? 'style="border: 1px solid var(--color-border);"' : ''}>
                </div>
                <div class="folio-list__item-text">
                    ${(p.category?.length) ? `<div class="folio-list__item-cat">${p.category[0]}</div>` : ''}
                    <div class="folio-list__item-title">${limitText(p.title, 28)}</div>
                </div>
            </a>
            <a class="folio-list__proj-link" href="${p.file}" target="_blank" title="project link">
                <svg width="15" height="15"><use href="#icon-link"/></svg>
            </a>
        </li>`;
}

function buildModal(p, thumb, i, filePath, container) {
    const modalID = `modal-${i}-${slug(p.title)}`;
    const catHTML = (p.category && p.category.length)
        ? `<ul class="modal-popup__cat">${p.category.map(c => `<li>${c}</li>`).join('')}</ul>`
        : '';

    const dateHTML = p.date
        ? `<ul class="modal-popup__date"><li>${fmtDate(p.date)}</li></ul>`
        : '';

    const descHTML = p.description
        ? `<p>${p.description}</p>`
        : '';

    container.insertAdjacentHTML('beforeend', `
        <div id="${modalID}" hidden>
            <div class="modal-popup">
                <img src="${thumb}" alt="">
                <div class="modal-popup__desc">
                    <h5>${p.title}</h5>
                    ${descHTML}
                    ${catHTML}
                    ${dateHTML}
                </div>
                <a href="${filePath}" class="modal-popup__details" target="_blank">Project link</a>
            </div>
        </div>`);
}

/* ---------------------------------------------------------------------------
 * Extra: Isotope filtering + search
 * ------------------------------------------------------------------------ */
function initIsotopeFiltering(cfg) {
    const iso = new Isotope(cfg.targetUL, {
        itemSelector: '.folio-list__item',
        layoutMode: 'fitRows',
        percentPosition: true,
        transitionDuration: '0.5s'
    });

    if (cfg.nav) {
        cfg.nav.innerHTML = `
            <button class="filter-btn is-active" data-cat="All">All</button>
            ${[...new Set((Array.from(cfg.targetUL.children))
            .flatMap(item => item.dataset.cat.split('|')))
            ].sort().map(cat =>
                `<button class="filter-btn" data-cat="${cat}">${cat}</button>`).join('')
            }
        `;

        cfg.nav.addEventListener('click', e => {
            if (!e.target.matches('.filter-btn')) return;
            const cat = e.target.dataset.cat;

            cfg.nav.querySelectorAll('.filter-btn')
                .forEach(b => b.classList.toggle('is-active', b === e.target));

            iso.arrange({
                filter: cat === 'All' ? '*' : itemElem => itemElem.dataset.cat.split('|').includes(cat)
            });
        });
    }

    if (cfg.searchInput) {
        let debounce;
        const handleSearch = () => {
            const query = cfg.searchInput.value.trim().toLowerCase();
            iso.arrange({
                filter: itemElem => {
                    const title = itemElem.dataset.title || '';
                    const desc = itemElem.dataset.desc || '';
                    const date = itemElem.dataset.date || '';
                    const tags = itemElem.dataset.cat.split('|');

                    return (
                        (!query || title.includes(query) || desc.includes(query) || date.includes(query)) &&
                        (cfg.nav && cfg.nav.querySelector('.is-active').dataset.cat === 'All' ||
                            tags.includes(cfg.nav.querySelector('.is-active').dataset.cat))
                    );
                }
            });
        };
        cfg.searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(handleSearch, 300);
        });
        cfg.searchInput.addEventListener('search', handleSearch);
    }
}

/* ---------------------------------------------------------------------------
 * Extra: BasicLightbox setup
 * ------------------------------------------------------------------------ */
function initLightbox(cfg) {
    const links = cfg.targetUL.querySelectorAll('.folio-list__item-link');
    const modals = [];

    links.forEach(link => {
        const id = link.getAttribute('href');
        const modal = basicLightbox.create(
            document.querySelector(id),
            {
                onShow: inst => document.addEventListener('keydown', e => (e.key === 'Escape') && inst.close())
            }
        );
        modals.push(modal);
    });

    links.forEach((link, idx) => {
        link.addEventListener('click', e => {
            e.preventDefault();
            modals[idx].show();
        });
    });
}
