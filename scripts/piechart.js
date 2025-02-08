// piechart.js - Handles D3.js visualization for project years

document.addEventListener("DOMContentLoaded", function () {
    fetch("projects.json")
        .then(response => response.json())
        .then(data => {
            const projectCounts = {};
            data.forEach(project => {
                const year = project.year;
                projectCounts[year] = (projectCounts[year] || 0) + 1;
            });
            
            const projectData = Object.entries(projectCounts).map(([year, count]) => ({ year, count }));
            renderPieChart(projectData);
            enableSearchFiltering(data);
        });
});

function renderPieChart(projectData) {
    const width = 400, height = 400, radius = Math.min(width, height) / 2;

    const svg = d3.select("#pie-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const pie = d3.pie().value(d => d.count);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    const arcs = svg.selectAll("arc")
        .data(pie(projectData))
        .enter()
        .append("g");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.year))
        .on("click", function (event, d) {
            filterProjectsByYear(d.data.year);
        });

    arcs.append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text(d => d.data.year);
}

function filterProjectsByYear(year) {
    const projectList = document.querySelectorAll(".project");
    projectList.forEach(project => {
        project.style.display = project.getAttribute("data-year") === year ? "block" : "none";
    });
}

function enableSearchFiltering(projects) {
    const searchInput = document.querySelector("#search-bar");
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
