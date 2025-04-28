/* ============================================================================
 * projects.js
 * Build Luther-style “Works” grid + lightbox from /data/projects.json
 * Adds:
 *   – dynamic category buttons
 *   – live search bar
 *   – ESC-dismissable BasicLightbox pop-ups
 * -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    fetch('../projects/projects.json')
        .then(r => {
            if (!r.ok) throw new Error('Could not load projects.json');
            return r.json();
        })
        .then(initProjects)
        .catch(console.error);
});

/* ---------------------------------------------------------------------------
 * helpers
 * ------------------------------------------------------------------------ */
const slug = str => str.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const fmtDate = iso => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
};

/* ---------------------------------------------------------------------------
 * main
 * ------------------------------------------------------------------------ */
function initProjects(data) {

    /* --------- DOM targets ------------------------------------------------ */
    const list = document.getElementById('project-list');      // <ul>
    const modalBox = document.getElementById('modal-container');   // wrapper
    const nav = document.getElementById('project-filter');    // <nav>
    const searchInput = document.getElementById('project-search');    // <input>

    /* --------- 1. build category buttons --------------------------------- */
    const categories = Array.from(
        new Set(data.flatMap(p => p.category || []))
    ).sort();

    nav.innerHTML =
        ['All', ...categories].map(c =>
            `<button class="filter-btn" data-cat="${c}">${c}</button>`
        ).join('');

    nav.querySelector('.filter-btn').classList.add('is-active'); /* highlight “All” */

    /* --------- 2. build cards + pop-ups ---------------------------------- */
    data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));   // newest first

    data.forEach((p, i) => {

        const modalID = `modal-${i}-${slug(p.title)}`;
        const thumb = p.thumbnail || 'images/portfolio/default-thumb.jpg';
        const tagsStr = (p.category || []).join('|');

        /* ---------- helpers ------------------------------------------------ */
        const catHTML = (p.category && p.category.length)
            ? `<ul class="modal-popup__cat">
                    ${p.category.map(c => `<li>${c}</li>`).join('')}
                </ul>`
            : '';

        const dateHTML = p.date
            ? `<ul class="modal-popup__date">
                    <li>${fmtDate(p.date)}</li>
                </ul>`
            : '';

        const descHTML = p.description
            ? `<p>${p.description}</p>`
            : '';

        /* ---------- card (unchanged except first-category line) ------------ */
        list.insertAdjacentHTML('beforeend', `
            <li class="folio-list__item column"
                data-cat="${tagsStr}"
                data-title="${p.title.toLowerCase()}"
                data-desc ="${(p.description || '').toLowerCase()}"
                data-date ="${(p.date || '').toLowerCase()}">

                <a class="folio-list__item-link" href="#${modalID}">
                <div class="folio-list__item-pic">
                    <img src="${thumb}" alt="${p.title}">
                </div>
                <div class="folio-list__item-text">
                    ${(p.category && p.category.length)
                ? `<div class="folio-list__item-cat">${p.category[0]}</div>`
                : ''}
                    <div class="folio-list__item-title">${p.title}</div>
                </div>
                </a>

                <a class="folio-list__proj-link"
                    href="${p.file}" target="_blank" title="project link">
                    <svg width="15" height="15"><use href="#icon-link"/></svg>
                </a>
            </li>`);

        /* ---------- modal -------------------------------------------------- */
        modalBox.insertAdjacentHTML('beforeend', `
            <div id="${modalID}" hidden>
                <div class="modal-popup">
                    <img src="${thumb}" alt="">
                    <div class="modal-popup__desc">
                        <h5>${p.title}</h5>
                        ${descHTML}
                        ${catHTML}
                        ${dateHTML}
                    </div>
                    <a href="${p.file}" class="modal-popup__details" target="_blank">
                        Project link
                    </a>
                </div>
            </div>`);
    });

    const iso = new Isotope(list, {
        itemSelector: '.folio-list__item',
        layoutMode: 'masonry',
        percentPosition: true,
        transitionDuration: '0.5s'
    });

    /* --------- 3. BasicLightbox wiring ---------------------------------- */
    const links = list.querySelectorAll('.folio-list__item-link');
    const modals = [];

    links.forEach(link => {
        const id = link.getAttribute('href');
        modals.push(
            basicLightbox.create(
                document.querySelector(id),
                {
                    onShow: inst =>
                        document.addEventListener('keydown',
                            e => (e.key === 'Escape') && inst.close())
                }
            )
        );
    });

    links.forEach((link, idx) =>
        link.addEventListener('click', e => {
            e.preventDefault();
            modals[idx].show();
        })
    );

    /* --------- 4. filtering (category + search) ------------------------- */
    let activeCat = 'All';
    let searchQuery = '';

    /* category clicks */
    nav.addEventListener('click', e => {
        if (!e.target.matches('.filter-btn')) return;
        activeCat = e.target.dataset.cat;

        nav.querySelectorAll('.filter-btn')
            .forEach(b => b.classList.toggle('is-active', b === e.target));

        // Tell Isotope to filter:
        if (activeCat === 'All') {
            iso.arrange({ filter: '*' });
        } else {
            iso.arrange({
                filter: itemElem => {
                    const tags = itemElem.dataset.cat.split('|');
                    return tags.includes(activeCat);
                }
            });
        }
    });

    /* live search (300 ms debounce) */
    if (searchInput) {
        let debounce;
        const handle = () => {
            searchQuery = searchInput.value.trim().toLowerCase();

            iso.arrange({
                filter: itemElem => {
                    const tags = itemElem.dataset.cat.split('|');
                    const matchCat = (activeCat === 'All') || tags.includes(activeCat);

                    const title = itemElem.dataset.title || '';
                    const desc = itemElem.dataset.desc || '';
                    const date = itemElem.dataset.date || '';

                    const matchSearch =
                        !searchQuery ||
                        title.includes(searchQuery) ||
                        desc.includes(searchQuery) ||
                        date.includes(searchQuery);

                    return matchCat && matchSearch;
                }
            });
        };

        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(handle, 300);
        });
        searchInput.addEventListener('search', handle);
    }
}
