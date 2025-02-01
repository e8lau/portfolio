document.addEventListener("DOMContentLoaded", () => {
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark-mode");
    }

    darkModeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        if (document.body.classList.contains("dark-mode")) {
            localStorage.setItem("darkMode", "enabled");
        } else {
            localStorage.setItem("darkMode", "disabled");
        }
    });

    // Load Projects Dynamically
    fetch("Archive/projects.json")
        .then(response => response.json())
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
        .catch(error => console.error("Error loading projects:", error));
});
