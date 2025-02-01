document.addEventListener("DOMContentLoaded", () => {
    // Highlight active navigation link
    const currentPage = window.location.pathname.split("/").pop();
    document.querySelectorAll(".nav-link").forEach(link => {
        if (link.getAttribute("href") === currentPage) {
            link.classList.add("active");
        }
    });

    // Theme Toggle Functionality
    const themeToggle = document.getElementById("theme-toggle");
    
    if (!themeToggle) {
        console.error("Theme toggle button not found!");
        return;
    }

    function applyTheme(theme) {
        document.body.classList.toggle("dark-mode", theme === "dark");
    }

    const storedTheme = localStorage.getItem("theme") || "light";
    applyTheme(storedTheme);
    
    themeToggle.addEventListener("click", () => {
        const newTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
        applyTheme(newTheme);
        localStorage.setItem("theme", newTheme);
    });

    // Load Projects Dynamically
    fetch("projects.json")
        .then(response => response.json())
        .then(data => {
            const projectsContainer = document.getElementById("projects-container");
            data.forEach(project => {
                const projectCard = document.createElement("div");
                projectCard.classList.add("project-card");
                projectCard.innerHTML = `
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                    <a href="${project.link}" target="_blank">View Project</a>
                `;
                projectsContainer.appendChild(projectCard);
            });
        })
        .catch(error => console.error("Error loading projects:", error));
});
