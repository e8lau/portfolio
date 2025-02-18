import { fetchJSON, renderProjects } from '../scripts/global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Global state variables
let rawProjects = [];
let searchQuery = '';
let selectedYear = null;

const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');
const svg = d3.select('svg');        // SVG container for the pie chart
const legend = d3.select('.legend');  // Container for the legend

// Initialization: fetch projects and render both views
async function init() {
  rawProjects = await fetchJSON('../page - projects/projects.json');
  applyFilters();
  renderFullPieChart();  // Always render full pie chart from rawProjects
}

// Global filter function: combines search and pie chart filters for projects list
function applyFilters() {
  let filtered = rawProjects;
  
  // Apply pie chart filter if a year is selected
  if (selectedYear !== null) {
    filtered = filtered.filter(project => project.year === selectedYear);
  }
  
  // Apply search filter if query is non-empty
  if (searchQuery.trim() !== '') {
    filtered = filtered.filter(project => {
      let values = [project.title, project.description, project.year].join(' ').toLowerCase();
      return values.includes(searchQuery.toLowerCase());
    });
  }

  console.log(filtered);
  
  // Render filtered projects
  renderProjects(filtered, projectsContainer, 'h2');
}

// Update the search query state and trigger filtering on user input
searchInput.addEventListener('input', debounce((event) => {
    searchQuery = event.target.value;
    applyFilters();
  }, 300)); // 300ms delay

// Renders the full pie chart based on the raw project data
function renderFullPieChart() {
  // Aggregate counts by year using the raw data
  let rolledData = d3.rollups(rawProjects, v => v.length, d => d.year);
  let pieData = rolledData.map(([year, count]) => ({ label: year, value: count }));
  
  // Clear previous chart and legend elements
  svg.selectAll('*').remove();
  legend.selectAll('*').remove();
  
  // Setup generators and color scale
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let pieGenerator = d3.pie().value(d => d.value);
  let arcs = pieGenerator(pieData);
  let colors = d3.scaleOrdinal(d3.schemeTableau10);
  
  // Create paths for each slice and corresponding legend items
  arcs.forEach((arc, i) => {
    let path = svg.append('path')
      .attr('d', arcGenerator(arc))
      .attr('fill', colors(i))
      .attr('data-index', i)
      .style('cursor', 'pointer')
      // Set initial opacity: if a slice is selected then only it is at full opacity
      .style('opacity', selectedYear === null || pieData[i].label === selectedYear ? 1 : 0.5)
      .on('click', function() {
        // Toggle the selected year filter
        let clickedYear = pieData[i].label;
        selectedYear = (selectedYear === clickedYear) ? null : clickedYear;
        applyFilters();
        
        // Update styling for each slice based on the selection
        svg.selectAll('path')
          .transition()
          .duration(200)
          .style('opacity', (d, idx) => {
            return selectedYear === null || pieData[idx].label === selectedYear ? 1 : 0.5;
          })
          .style('stroke', (d, idx) => pieData[idx].label === selectedYear ? 'black' : 'none')
          .style('stroke-width', (d, idx) => pieData[idx].label === selectedYear ? 3 : 0);
        
        // Optionally update the legend as well
        legend.selectAll('li')
          .style('font-weight', (d, idx) => pieData[idx].label === selectedYear ? 'bold' : 'normal');
      });
    
    // Add a tooltip to each slice
    path.append('title').text(`${pieData[i].label}: ${pieData[i].value}`);
    
    // Create a legend item that mirrors the slice behavior
    legend.append('li')
      .html(`<span class="swatch" style="background:${colors(i)}"></span> ${pieData[i].label} (${pieData[i].value})`)
      .style('cursor', 'pointer')
      .style('font-weight', pieData[i].label === selectedYear ? 'bold' : 'normal')
      .on('click', function() {
        let clickedYear = pieData[i].label;
        selectedYear = (selectedYear === clickedYear) ? null : clickedYear;
        applyFilters();
        
        svg.selectAll('path')
          .transition()
          .duration(200)
          .style('opacity', (d, idx) => {
            return selectedYear === null || pieData[idx].label === selectedYear ? 1 : 0.5;
          })
          .style('stroke', (d, idx) => pieData[idx].label === selectedYear ? 'black' : 'none')
          .style('stroke-width', (d, idx) => pieData[idx].label === selectedYear ? 3 : 0);
        
        legend.selectAll('li')
          .style('font-weight', (d, idx) => pieData[idx].label === selectedYear ? 'bold' : 'normal');
      });
  });
}

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}  

// Start the application
init();