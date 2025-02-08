console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

//// Create Naviation in JS ////

// create pages
let pages = [
    { url: '../', title: 'Home'},
    { url: 'pages/projects.html', title: 'Projects'},
    //{ url: 'pages/resume.html', title: 'Resume'},
    { url: 'pages/contact.html', title: 'Contact'},
    { url: 'https://github.com/e8lau', title: 'Github'},
]

// add nav element to the body of page
let nav = document.createElement('nav');
document.body.prepend(nav);

// create constant variable that checks for home class in page
const ARE_WE_HOME = document.documentElement.classList.contains('home');

// Create links and add attributes as needed
for (let p of pages) {
    let url = p.url;
    let title = p.title;
    // Adjust URLs based on the new pages/ folder structure
    url = !ARE_WE_HOME && !url.startsWith('http') ? './' + url : url;
    // Create link and add it to nav
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);
    // Add 'current' class to highlight active page
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }
    // Open external links in a new tab
    if (a.host !== location.host) {
        a.target = "_blank";
    }
}

//// Add Light and Dark Mode Toggle Button (Preserving Original Functionality) ////
document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <button id="theme-toggle" class="theme-button">Loading...</button>
    `
);

let themeButton = document.getElementById('theme-toggle');
let currentTheme = localStorage.colorScheme || 'light dark'; // Default to Auto mode

// Function to apply the selected theme
function applyTheme(theme) {
    document.documentElement.style.setProperty('color-scheme', theme);
    localStorage.colorScheme = theme;

    // Update button text to reflect the current mode
    if (theme === 'dark') {
        themeButton.textContent = '🌙 Dark Mode';
    } else if (theme === 'light') {
        themeButton.textContent = '🌞 Light Mode';
    } else {
        themeButton.textContent = '🌓 Auto Mode';
    }
}

// Function to cycle through themes
function toggleTheme() {
    if (currentTheme === 'light dark') {
        currentTheme = 'light';  // Auto → Light
    } else if (currentTheme === 'light') {
        currentTheme = 'dark';  // Light → Dark
    } else {
        currentTheme = 'light dark';  // Dark → Auto
    }

    applyTheme(currentTheme);
}

// Apply the saved theme on page load
applyTheme(currentTheme);

// Attach event listener to toggle button
themeButton.addEventListener('click', toggleTheme);

//// Contact Form ////

let form = document.querySelector('form');

form?.addEventListener('submit', function (event) {
    event.preventDefault();

    let data = new FormData(form);
    let url = form.action
    let queryParams = [];

    // Iterate over each form field and build the query parameters
    for (let [name, value] of data) {
        // TODO build URL parameters here
        queryParams.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
      }

    // Join the parameters with "&"
    if (queryParams.length > 0) {
        url += "?" + queryParams.join("&");
    }

    console.log("Generated URL:", url); // Log the generated URL for inspection
    
    location.href = url;
    console.log('Form submitted');
});

//// Importing Project Data into Projects Page ////
export async function fetchJSON(url) {
  try {
      // Fetch the JSON file from the given URL
      const response = await fetch(url);
      // Check if fetch request was successful
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data; 


  } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
      return [];// Return an empty array to prevent undefined errors
  }
}

/// dynamically generate and display project content throughout site func
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!containerElement || !(containerElement instanceof HTMLElement)) {
    console.error("Invalid container element provided.");
    return;
  }
  // Validate heading level
  const validHeadings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  if (!validHeadings.includes(headingLevel)) {
      console.warn(`Invalid heading level "${headingLevel}". Defaulting to "h2".`);
      headingLevel = 'h2';
  }
  // Clear previous content
  containerElement.innerHTML = '';

  if (projects.length === 0) {
    const placeholderMessage = document.createElement('p');
    placeholderMessage.textContent = 'No projects available at the moment.';
    containerElement.appendChild(placeholderMessage);
    return;
  }
  projects.forEach(project => {
    if (!project || !project.title || !project.description || !project.file) {
        console.warn("Skipping invalid project:", project);
        return;
    }
    const article = document.createElement('article');
    article.classList.add('project-item');
    // Create project heading
    const heading = document.createElement(headingLevel);
    heading.textContent = project.title;
    article.appendChild(heading);
    // Add project year
    const yearElement = document.createElement('p');
    yearElement.classList.add('project-year');
    yearElement.textContent = `Year: ${project.year}`;
    article.appendChild(yearElement);
    // Add project description
    const description = document.createElement('p');
    description.textContent = project.description;
    article.appendChild(description);
    // Detect file type and create appropriate preview
    const fileExtension = project.file.split('.').pop().toLowerCase();
    const figure = document.createElement('figure');

    if (['png', 'jpg', 'jpeg', 'gif'].includes(fileExtension)) {
      // Image preview
      const img = document.createElement('img');
      img.src = encodeURI(project.file);
      img.alt = `Preview of ${project.title}`;
      img.classList.add('project-image');
      figure.appendChild(img);
    } else if (fileExtension === 'pdf') {
      // PDF Thumbnail Preview (Click to Open Full PDF)
      const img = document.createElement('img');
      const previewPath = project.file.replace('.pdf', '.jpg'); // Assumes preview images are generated
      img.src = encodeURI(previewPath);
      img.alt = `Preview of ${project.title}`;
      img.classList.add('pdf-preview');
      // Clicking opens full PDF
      img.addEventListener('click', () => {
          window.open(project.file, '_blank');
      });
      figure.appendChild(img);
    } else {
      // Generic file download link
      const fileLink = document.createElement('a');
      fileLink.href = encodeURI(project.file);
      fileLink.textContent = 'Download File';
      fileLink.target = '_blank';
      figure.appendChild(fileLink);
    }
    // Add preview figure
    const caption = document.createElement('figcaption');
    caption.textContent = `Preview of ${project.title}`;
    figure.appendChild(caption);
    
    article.appendChild(figure);
    containerElement.appendChild(article);
  });
}

//// Loading data from Github API ////
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
