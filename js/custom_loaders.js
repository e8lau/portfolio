/**
 * Render an array of objects into a container.
 * @param {Array}  items            – your JSON objects (services, projects, …)
 * @param {HTMLElement} el          – empty wrapper in the DOM
 * @param {Function} templateFn     – function(item) => HTML string
 * @param {Function|null} onClick   – optional handler receives item
 */
export function renderList(items, el, templateFn, onClick = null) {

    //─ safety checks ────────────────────────────────────────────
    if (!el || !(el instanceof HTMLElement)) {
        console.error('renderList: invalid container element');
        return;
    }
    if (!Array.isArray(items)) {
        console.error('renderList: items is not an array');
        return;
    }

    el.innerHTML = '';                         // clear leftovers
    if (!items.length) {
        el.innerHTML = '<p>No items to display.</p>';
        return;
    }

    //─ build & insert ───────────────────────────────────────────
    const frag = document.createDocumentFragment();

    items.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = templateFn(item).trim();
        const node = wrapper.firstChild;

        if (onClick) node.addEventListener('click', e => {
            e.preventDefault();
            onClick(item, node);
        });

        frag.appendChild(node);
    });

    el.appendChild(frag);
}

/*  preview card for index.html  */
export const servicePreviewTpl = s => `
  <div class="grid-list-items__item list-items__item">
    <div class="grid-list-items__title list-items__item-header">
      <h3 class="list-items__item-title">${s.title}</h3>
    </div>
    <div class="grid-list-items__text list-items__item-text">
      <p>${s.excerpt || s.description.slice(0, 150)}…</p>
    </div>
  </div>`;

/*  full card for services.html  */
export const serviceFullTpl = s => `
<div class="grid-list-items__item list-items__item">
  <div class="list-items__item-header">
    <h3 class="list-items__item-title">${s.title}</h3>
  </div>
  <div class="list-items__item-text">
    ${s.company ? `<div class="company-name">${s.company}</div>` : ''}
    ${s.date ? `<div class="date-range">${s.date}</div>` : ''}
    <p>${s.description}</p>
    ${s.bullets?.length
        ? `<ul class="list-services">${s.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`
        : ''}
  </div>
</div>`;

