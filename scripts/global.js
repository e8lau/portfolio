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
            document.getElementById("featured-projects").innerHTML = `<p>Failed to load projects: ${error.message}</p>`;
        });

    // Load All Projects in projects.html
    if (document.getElementById("project-list")) {
        fetch("projects.json")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const projectList = document.getElementById("project-list");
                projectList.innerHTML = ""; // Clear existing content

                data.projects.forEach(project => {
                    let projectItem = document.createElement("div");
                    projectItem.classList.add("project-item");
                    projectItem.innerHTML = `
                        <h3>${project.title}</h3>
                        <p>${project.description}</p>
                        <a href="${project.link}" target="_blank">View Project</a>
                    `;
                    projectList.appendChild(projectItem);
                });
            })
            .catch(error => {
                console.error("Error loading projects:", error);
                document.getElementById("project-list").innerHTML = `<p>Failed to load projects: ${error.message}</p>`;
            });
    }
});
