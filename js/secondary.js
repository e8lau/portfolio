/* ============================================================================
 * secondary.js
 * (modularized loader for flexible use across all pages)
 * -------------------------------------------------------------------------- */

/* ────────────── NAVIGATION DYNAMIC LOADING ────────────────────────── */
const NAV_ITEMS = [
    /* ─ internal pages ─ */
    { url: '', title: 'Home', footer: true },
    { url: 'about/', title: 'About', footer: false },
    { url: 'experience/', title: 'Experience', footer: false },
    { url: 'portfolio/', title: 'Portfolio', footer: false },
    { url: 'contact/', title: 'Contact', footer: false }
];

const SOCIAL_ITEMS = [
    {
        label: 'LinkedIn',
        url: 'https://www.linkedin.com/in/ethan-lau-e8lau/',
        svg: `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
             viewBox="0 0 50 50"><path d="M41,4H9C6.24,4,4,6.24,4,9v32c0,2.76,
             2.24,5,5,5h32c2.76,0,5-2.24,5-5V9C46,6.24,43.76,4,41,4z M17,20v19h-6V20H17z
             M11,14.47c0-1.4,1.2-2.47,3-2.47s2.93,1.07,3,2.47c0,1.4-1.12,2.53-3,2.53
             C12.2,17,11,15.87,11,14.47z M39,39h-6c0,0,0-9.26,0-10 c0-2-1-4-3.5-4.04h-0.08
             C27,24.96,26,27.02,26,29c0,0.91,0,10,0,10h-6V20h6v2.56c0,0,1.93-2.56,
             5.81-2.56 c3.97,0,7.19,2.73,7.19,8.26V39z"></path></svg>`
    },
    {
        label: 'GitHub',
        url: 'https://github.com/e8lau',
        svg: `
        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 50 50">
            <path d="M17.791,46.836C18.502,46.53,19,45.823,19,45v-5.4c0-0.197,0.016-0.402,0.041-0.61C19.027,38.994,19.014,38.997,19,39 c0,0-3,0-3.6,0c-1.5,0-2.8-0.6-3.4-1.8c-0.7-1.3-1-3.5-2.8-4.7C8.9,32.3,9.1,32,9.7,32c0.6,0.1,1.9,0.9,2.7,2c0.9,1.1,1.8,2,3.4,2 c2.487,0,3.82-0.125,4.622-0.555C21.356,34.056,22.649,33,24,33v-0.025c-5.668-0.182-9.289-2.066-10.975-4.975 c-3.665,0.042-6.856,0.405-8.677,0.707c-0.058-0.327-0.108-0.656-0.151-0.987c1.797-0.296,4.843-0.647,8.345-0.714 c-0.112-0.276-0.209-0.559-0.291-0.849c-3.511-0.178-6.541-0.039-8.187,0.097c-0.02-0.332-0.047-0.663-0.051-0.999 c1.649-0.135,4.597-0.27,8.018-0.111c-0.079-0.5-0.13-1.011-0.13-1.543c0-1.7,0.6-3.5,1.7-5c-0.5-1.7-1.2-5.3,0.2-6.6 c2.7,0,4.6,1.3,5.5,2.1C21,13.4,22.9,13,25,13s4,0.4,5.6,1.1c0.9-0.8,2.8-2.1,5.5-2.1c1.5,1.4,0.7,5,0.2,6.6c1.1,1.5,1.7,3.2,1.6,5 c0,0.484-0.045,0.951-0.11,1.409c3.499-0.172,6.527-0.034,8.204,0.102c-0.002,0.337-0.033,0.666-0.051,0.999 c-1.671-0.138-4.775-0.28-8.359-0.089c-0.089,0.336-0.197,0.663-0.325,0.98c3.546,0.046,6.665,0.389,8.548,0.689 c-0.043,0.332-0.093,0.661-0.151,0.987c-1.912-0.306-5.171-0.664-8.879-0.682C35.112,30.873,31.557,32.75,26,32.969V33 c2.6,0,5,3.9,5,6.6V45c0,0.823,0.498,1.53,1.209,1.836C41.37,43.804,48,35.164,48,25C48,12.318,37.683,2,25,2S2,12.318,2,25 C2,35.164,8.63,43.804,17.791,46.836z"></path>
        </svg>`
    }
];

/* Treat “/” and “/index.html” as identical for active link logic */
const normalize = p => p.replace(/\/?(index\.html)?$/, '/');

/* Are we at root? (home page or folder root) */
const ARE_WE_HOME = normalize(location.pathname) === '/';

/* If we’re inside a subfolder, prepend “…/” to relative URLs */
const fixURL = u =>
    u.startsWith('http') || ARE_WE_HOME ? u : '../' + u;

/* Build a single <li><a></a></li> and append to the given <ul> */
function addNavItem(listEl, item) {
    const li = document.createElement('li');
    const a = document.createElement('a');

    a.href = fixURL(item.url);
    a.textContent = item.title;

    /* External links open in a new tab */
    if (item.external || a.host !== location.host) {
        a.target = '_blank';
        a.rel = 'noopener';
    }

    /* Highlight the current page in the HEADER ONLY */
    if (!item.external &&
        normalize(a.pathname) === normalize(location.pathname) &&
        listEl.id === 'nav-menu') {
        li.classList.add('current');      // template already styles this class
        a.setAttribute('aria-current', 'page');
    }

    li.appendChild(a);
    listEl.appendChild(li);
}

function appendSocial(ul, icon) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = icon.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = `${icon.svg}<span class="u-screen-reader-text">${icon.label}</span>`;
    li.appendChild(a);
    ul.appendChild(li);
}

function loadFooter() {
    const contactEL = document.querySelector('section.s-cta');
    if (contactEL) {
        fetch(fixURL('../contact-preview.html'))  // adjust path if needed
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(html => {
                contactEL.innerHTML = html;
            })
            .catch(err => {
                console.error('Failed to load footer:', err);
                contactEL.style.display = 'none'; // hide broken footer if fetch fails
            });
    }

    const footerEl = document.querySelector('#footer-content-placeholder');
    if (footerEl) {
        fetch(fixURL('../footer.html'))  // adjust path if needed
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(html => {
                footerEl.innerHTML = html;
            })
            .catch(err => {
                console.error('Failed to load footer:', err);
                footerEl.style.display = 'none'; // hide broken footer if fetch fails
            });
    }

    setupNavAndFooter(); // re-run nav and social filling after footer loads
}

function setupNavAndFooter() {
    // Header menu
    const headerUL = document.querySelector('#nav-menu');
    if (headerUL) {
        NAV_ITEMS
            .filter(item => item.footer !== true)
            .forEach(item => addNavItem(headerUL, item));
    }

    // Footer links
    const footerUL = document.querySelector('#footer-links');
    if (footerUL) {
        NAV_ITEMS.forEach(item => addNavItem(footerUL, item));
    }

    // Social media icons
    document
        .querySelectorAll('.s-about__social.social-list, .s-footer__social.social-list, .contact-social.social-list')
        .forEach(ul => SOCIAL_ITEMS.forEach(icon => appendSocial(ul, icon)));
}

/* ────────────── EXPERIENCES DYNAMIC LOADING ────────────────────────── */

import { renderList, servicePreviewTpl, serviceFullTpl } from './custom_loaders.js'; // the generic helper

fetch('../experience/experience.json')
    .then(r => r.json())
    .then(services => {
        const previewBox = document.querySelector('#services-preview');
        if (previewBox) renderList(services.slice(0, 4), previewBox, servicePreviewTpl);

        const fullList = document.querySelector('#services-list');
        if (fullList) renderList(services, fullList, serviceFullTpl);
    });

/* ────────────── PROJECTS DYNAMIC LOADING ────────────────────────── */
import { renderProjects, limitText } from './projects.js';
const ARE_WE_PROJECTS = normalize(location.pathname).includes('/portfolio');

const homeCardTpl = (p, thumb, i) => `
    <div class="grid-list-items__item blog-card blog-card--project">
        <div class="blog-card__image-wrapper">
            <a href="portfolio/?filter=${encodeURIComponent(p.category[0] || '')}" class="blog-card__image-link">
                <img src="${thumb}" alt="${p.title}">
            </a>
        </div>
        <div class="blog-card__header">
            ${p.category?.length ? `<div class="blog-card__cat-links"><a>${p.category[0]}</a></div>` : ''}
            <h3 class="blog-card__title">${limitText(p.title, 40)}</h3>
        </div>
        <div class="blog-card__text">
            <p>${p.description || ''}</p>
        </div>
    </div>`;

/* ────────────── MAIN DYNAMIC RUNNER ────────────────────────── */
/* Main runner */
window.addEventListener('DOMContentLoaded', () => {
    const jobs = [];

    loadFooter();

    if (ARE_WE_HOME) {
        // Home page → Preview latest 3 projects
        jobs.push(
            renderProjects({
                targetUL: document.querySelector('#home-projects'),
                count: 3,
                full: false,
                cardTpl: homeCardTpl
            })
        );
    }

    if (ARE_WE_PROJECTS) {
        jobs.push(
            renderProjects({
                targetUL: document.querySelector('#project-list'),
                modalParent: document.getElementById('modal-container'),
                nav: document.getElementById('project-filter'),
                searchInput: document.getElementById('project-search'),
                full: true
            }).then(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const filterCat = urlParams.get('filter');
                if (filterCat) {
                    const nav = document.getElementById('project-filter');
                    if (nav) {
                        const button = [...nav.querySelectorAll('button')].find(btn => btn.dataset.cat === filterCat);
                        if (button) {
                            button.click();// simulate a click to filter automatically
                        }
                    }
                }
            })
        );
    }

    window.dynamicInitDone = Promise.all(jobs); // <- expose global promise
});
