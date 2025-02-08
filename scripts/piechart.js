document.addEventListener("DOMContentLoaded", function () {
    fetch("projects.json")
        .then(response => response.json())
        .then(data => {
            const projects = data.projects; // Ensure we access the correct array
            const projectCounts = {};
            
            projects.forEach(project => {
                const year = project.year;
                projectCounts[year] = (projectCounts[year] || 0) + 1;
            });
            
            const projectData = Object.entries(projectCounts).map(([year, count]) => ({ year, count }));
            renderPieChart(projectData);
            enableSearchFiltering(projects);
            renderProjectList(projects);
        });
});
