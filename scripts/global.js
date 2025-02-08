document.addEventListener("DOMContentLoaded", () => {
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark-mode");
    }

    darkModeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "enabled" : "disabled");
    });

    // Load Featured Projects (Limited to 3)
    fetch("projects.json")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const featuredProjectsContainer = document.getElementById("featured-projects");
            if (!featuredProjectsContainer) {
                console.error("Error: Featured projects container not found.");
                return;
            }

            featuredProjectsContainer.innerHTML = ""; // Clear existing content
            data.projects.slice(0, 3).forEach(project => {
                let projectItem = document.createElement("div");
                projectItem.classList.add("project-item");
                projectItem.innerHTML = `
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                    <a href="${project.link}" target="_blank">View Project</a>
                `;
                featuredProjectsContainer.appendChild(projectItem);
            });
        })
        .catch(error => {
            console.error("Error loading projects:", error);
        });

    // Load All Projects in projects.html
    const projectListContainer = document.getElementById("project-list");
    if (projectListContainer) {
        fetch("projects.json")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                projectListContainer.innerHTML = ""; // Clear existing content

                data.projects.forEach(project => {
                    let projectItem = document.createElement("div");
                    projectItem.classList.add("project");
                    projectItem.setAttribute("data-year", project.year); // Ensure data-year attribute is set

                    projectItem.innerHTML = `
                        <h3 class="project-title">${project.title}</h3>
                        <p>${project.description}</p>
                        <a href="${project.link}" target="_blank">View Project</a>
                    `;

                    projectListContainer.appendChild(projectItem);
                });

                // Enable Search Filtering After Projects Load
                enableSearchFiltering();
            })
            .catch(error => {
                console.error("Error loading projects:", error);
            });
    } else {
        console.error("Error: Project list container not found.");
    }
});

// Function to Enable Search Filtering
function enableSearchFiltering() {
    const searchInput = document.querySelector("#search-bar");
    if (!searchInput) {
        console.error("Error: Search bar not found.");
        return;
    }

    searchInput.addEventListener("input", function () {
        const searchTerm = searchInput.value.toLowerCase();
        const projectList = document.querySelectorAll(".project");
        
        projectList.forEach(project => {
            const title = project.querySelector(".project-title").textContent.toLowerCase();
            if (title.includes(searchTerm)) {
                project.style.display = "block";
            } else {
                project.style.display = "none";
            }
        });
    });
}
