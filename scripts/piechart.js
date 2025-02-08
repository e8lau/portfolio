document.addEventListener("DOMContentLoaded", function () {
    fetch("projects.json")
        .then(response => response.json())
        .then(data => {
            const projects = data.projects;
            const yearCounts = {};
            
            projects.forEach(project => {
                yearCounts[project.year] = (yearCounts[project.year] || 0) + 1;
            });
            
            const width = 400, height = 400, radius = Math.min(width, height) / 2;
            
            const svg = d3.select("#pie-chart")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${width / 2}, ${height / 2})`);
            
            const color = d3.scaleOrdinal(d3.schemeCategory10);
            
            const pie = d3.pie().value(d => d[1]);
            const arc = d3.arc().innerRadius(0).outerRadius(radius);
            
            const dataEntries = Object.entries(yearCounts);
            
            const arcs = svg.selectAll(".arc")
                .data(pie(dataEntries))
                .enter()
                .append("g")
                .attr("class", "arc");
            
            arcs.append("path")
                .attr("d", arc)
                .attr("fill", d => color(d.data[0]))
                .on("click", function (event, d) {
                    filterProjectsByYear(d.data[0]);
                });
            
            const legend = d3.select("#legend");
            dataEntries.forEach(entry => {
                legend.append("div")
                    .style("background-color", color(entry[0]))
                    .text(entry[0]);
            });
            
            function filterProjectsByYear(year) {
                const filteredProjects = projects.filter(p => p.year === year);
                const projectList = d3.select("#project-list");
                projectList.html("");
                filteredProjects.forEach(p => {
                    projectList.append("li").text(`${p.title} (${p.year})`);
                });
            }
        });
});
