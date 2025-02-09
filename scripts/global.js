console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

//// Create Naviation in JS ////

// create pages
let pages = [
    { url: '', title: 'Home'},
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
    url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;
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
export async function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Ensure containerElement is a valid DOM element
  if (!containerElement || !(containerElement instanceof HTMLElement)) {
    console.error("Invalid container element provided.");
    return;
  }
  // Validate headingLevel (ensure it's a valid heading tag)
  const validHeadings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  if (!validHeadings.includes(headingLevel)) {
      console.warn(`Invalid heading level "${headingLevel}". Defaulting to "h2".`);
      headingLevel = 'h2';
  }
  // Clear existing content to avoid duplication
  containerElement.innerHTML = '';

  // Check if there are any projects to render
  if (projects.length === 0) {
    const placeholderMessage = document.createElement('p');
    placeholderMessage.textContent = 'No projects available at the moment. Please check back later!';
    containerElement.appendChild(placeholderMessage);
    return;
  }

  // Loop through each project and create an article element
  for (const project of projects) {
    if (!project || !project.title || !project.description || !project.file) {
        console.warn("Skipping invalid project:", project);
        return;
    }

    // Prepend ../ if not in home directory
    let filepath = (!ARE_WE_HOME ? '../' : '') + project.file;
    let thumbnail = (!ARE_WE_HOME ? '../' : '') + "thumbnails/PDF_thumb.png"; // Fallback default

    if (filepath) {
      thumbnail = filepath;
    } else if (project.file.endsWith(".pdf")) {
      // thumbnail = "thumbnails/PDF_thumb.png";
      try {
        thumbnail = await pdfToBase64(filepath);
        if (!thumbnail) throw new Error("Thumbnail conversion failed");
        console.log("Thumbnail Generated");
      } catch(error) {
        console.log("Thumbnail failed")
      }
    }

    // Create article element
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      ${thumbnail ? `<a href="${project.file}" target="_blank"><img src="${thumbnail}" alt="${project.title}"></a>` : ''}
      <div>
        <p>${project.description}</p>
        <p class="year"><i>c.</i> ${project.year}</p>
      </div>
    `;
    // Append to container
    containerElement.appendChild(article);
  }
}

/// Pdf to Base64 Test Fn
// Load PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// Function to convert a local PDF file to a Base64 image (first page)
async function pdfToBase64(pdfUrl, pageNumber = 1) {
    try {
        // Load the PDF document
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        const page = await pdf.getPage(pageNumber);

        // Define scaling for high resolution
        const scale = 2;
        const viewport = page.getViewport({ scale });

        // Create a canvas to render the PDF page
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render the PDF page into the canvas
        await page.render({ canvasContext: context, viewport }).promise;

        // Convert canvas to Base64 string
        const base64String = canvas.toDataURL("image/png");

        return base64String;
    } catch (error) {
        console.error("Error converting PDF to Base64:", error);
        return null;
    }
}

//// Loading data from Github API ////
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
