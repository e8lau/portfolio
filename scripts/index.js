import { fetchJSON, renderProjects, enableSearchFiltering } from './global.js';

document.addEventListener("DOMContentLoaded", async function () {
    const projects = await fetchJSON('projects.json');
    const container = document.querySelector('#project-container');
    renderProjects(projects, container);
    enableSearchFiltering(projects, container);
    renderPieChart(projects);
});

// Render Pie Chart (D3.js)
function renderPieChart(projects) {
    const projectCounts = {};
    projects.forEach(project => {
        projectCounts[project.year] = (projectCounts[project.year] || 0) + 1;
    });

    const projectData = Object.entries(projectCounts).map(([year, count]) => ({ year, count }));

    const width = 400, height = 400, radius = Math.min(width, height) / 2;
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const svg = d3.select("#pie-chart")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie().value(d => d.count);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    const arcs = svg.selectAll(".arc")
        .data(pie(projectData))
        .enter()
        .append("g")
        .attr("class", "arc");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.year));

    const legend = d3.select("#legend");
    projectData.forEach(entry => {
        legend.append("div")
            .style("background-color", color(entry.year))
            .text(entry.year);
    });
}
