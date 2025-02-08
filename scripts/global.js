console.log('Global.js Loaded');

// Utility function for querying elements
export function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

// Fetch JSON utility function
export async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching JSON:', error);
        return [];
    }
}

// Render Project Data
export function renderProjects(projects, containerElement) {
    if (!containerElement) return;
    containerElement.innerHTML = ''; // Clear previous projects

    if (projects.length === 0) {
        containerElement.innerHTML = '<p>No projects found.</p>';
        return;
    }

    projects.forEach(project => {
        const article = document.createElement('article');
        article.innerHTML = `
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <p class="year"><i>c.</i> ${project.year}</p>
        `;
        containerElement.appendChild(article);
    });
}

// Filtering Projects via Search Bar
export function enableSearchFiltering(projects, containerElement) {
    const searchBar = document.querySelector('#search-bar');
    searchBar.addEventListener('input', () => {
        const filteredProjects = projects.filter(p =>
            p.title.toLowerCase().includes(searchBar.value.toLowerCase())
        );
        renderProjects(filteredProjects, containerElement);
    });
}
