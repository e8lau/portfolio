// Ensure renderPieChart is defined before calling it
document.addEventListener("DOMContentLoaded", function () {
    fetch("projects.json")
        .then(response => response.json())
        .then(data => {
            const projects = data.projects;
            const projectCounts = {};
            
            projects.forEach(project => {
                const year = project.year;
                projectCounts[year] = (projectCounts[year] || 0) + 1;
            });

            const projectData = Object.entries(projectCounts).map(([year, count]) => ({ year, count }));

            // Check if renderPieChart exists before calling it
            if (typeof renderPieChart === "function") {
                renderPieChart(projectData);
            } else {
                console.error("renderPieChart function is not defined. Ensure piechart.js is correctly loaded.");
            }
        }).catch(error => console.error("Error loading projects.json:", error));
});

// Define renderPieChart() before it's called
function renderPieChart(projectData) {
    const width = 400, height = 400, radius = Math.min(width, height) / 2;

    const svg = d3.select("#pie-chart")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const pie = d3.pie().value(d => d.count);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    const arcs = svg.selectAll(".arc")
        .data(pie(projectData))
        .enter()
        .append("g")
        .attr("class", "arc");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.year))
        .on("click", function (event, d) {
            filterProjectsByYear(d.data.year);
        });

    const legend = d3.select("#legend");
    projectData.forEach(entry => {
        legend.append("div")
            .style("background-color", color(entry.year))
            .text(entry.year);
    });
}
