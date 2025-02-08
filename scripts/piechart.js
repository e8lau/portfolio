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

    // Create legend
    const legend = d3.select("#legend");
    projectData.forEach(entry => {
        legend.append("div")
            .style("background-color", color(entry.year))
            .text(entry.year);
    });
}

function filterProjectsByYear(year) {
    fetch("projects.json")
        .then(response => response.json())
        .then(data => {
            const projects = data.projects.filter(p => p.year === year);
            const projectList = d3.select("#project-list");
            projectList.html(""); // Clear previous list
            projects.forEach(p => {
                projectList.append("li").text(`${p.title} (${p.year})`);
            });
        });
}
