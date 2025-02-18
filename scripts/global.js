console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

//// Create Naviation in JS ////

// create pages
let pages = [
  { url: '', title: 'Home'},
  { url: 'page - projects/', title: 'Projects'},
  { url: 'page - contact/', title: 'Contact'},
  { url: 'page - meta/', title: 'Meta'},
  { url: 'https://www.linkedin.com/in/ethan-lau-5b75701b9/', title: 'LinkedIn'},
  { url: 'https://github.com/e8lau', title: 'Github'},
]

// add nav element to the body of page
let nav = document.createElement('nav');
document.body.prepend(nav);

// create constant variable that checks for home class in page
const ARE_WE_HOME = document.documentElement.classList.contains('home');
const IS_FANCY_LAYOUT = document.querySelector('.fancy-layout') !== null;

// If home page, add a special class to <nav>
if (IS_FANCY_LAYOUT) {
  nav.classList.add('fancy-nav');
  let fancyLayout = document.querySelector('.fancy-layout');

  if (fancyLayout) {
    fancyLayout.appendChild(nav);
  } else {
    // If not on the home page, prepend to <body> as usual
    document.body.prepend(nav);
  }
}

// create links and add attributes as needed
for (let p of pages) {
    let url = p.url;
    let title = p.title;
    url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;
    // create link and add it to nav
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);
    // add current class to current page
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
      }
    // have link open new path if external link
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
let currentTheme = localStorage.colorScheme || 'auto'; // Default to Auto mode

function getTimeBasedTheme() {
  const hour = new Date().getHours();
  return (hour >= 19 || hour < 7) ? 'dark' : 'light'; // Dark mode from 7 PM to 7 AM
}

// Function to apply the selected theme
function applyTheme(theme) {
    // Update button text to reflect the current mode
    if (theme === 'dark') {
        themeButton.textContent = '🌙 Dark Mode';
    } else if (theme === 'light') {
        themeButton.textContent = '🌞 Light Mode';
    } else {
        themeButton.textContent = '🌓 Auto Mode';
        theme = getTimeBasedTheme();
    }

    console.log(theme)
    document.documentElement.setAttribute('colorTheme', theme);
    localStorage.colorScheme = theme;
}

// Function to cycle through themes
function toggleTheme() {
    if (currentTheme === 'auto') {
        currentTheme = 'light';  // Auto → Light
    } else if (currentTheme === 'light') {
        currentTheme = 'dark';  // Light → Dark
    } else {
        currentTheme = 'auto';  // Dark → Auto
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
    let thumbpath = filepath;

    if (project.thumbnail) {
      thumbpath = (!ARE_WE_HOME ? '../' : '') + project.thumbnail;
    }

    // Image Types
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff", ".svg"];
    // Check Image Types
    if (imageExtensions.some(ext => thumbpath.endsWith(ext))) {
      thumbnail = thumbpath;
    } else if (thumbpath.endsWith(".pdf")) {
      // thumbnail = "thumbnails/PDF_thumb.png";
      try {
        thumbnail = await pdfToBase64(thumbpath);
        if (!thumbnail) throw new Error("Thumbnail conversion failed");
        console.log("Thumbnail Generated");
      } catch(error) {
        console.log("Thumbnail failed")
      }
    }

    // Create article element
    const article = document.createElement('article');
    article.setAttribute("role", "link"); // Accessibility
    article.style.cursor = "pointer"; // Make it look clickable
    article.onclick = () => window.open(filepath, "_blank");
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      ${thumbnail ? `<img src="${thumbnail}" alt="${project.title}"></a>` : ''}
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
