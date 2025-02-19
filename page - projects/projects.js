import { fetchJSON, renderProjects } from '../scripts/global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Global state variables
let rawProjects = [];
let searchQuery = '';
let selectedYear = null;
let selectedCategories = [];

const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');
const svg = d3.select('svg');        // SVG container for the pie chart
const legend = d3.select('.legend');  // Container for the legend

// Create a container for category checkboxes and add it to the DOM
const categoryFilterContainer = document.querySelector('.category-filter-placeholder') || document.createElement('div');
categoryFilterContainer.classList.add('category-filter');

if (!document.querySelector('.category-filter-placeholder')) {
  projectsContainer.parentElement.insertBefore(categoryFilterContainer, projectsContainer);
}

// Initialization: fetch projects and render both views
async function init() {
  rawProjects = await fetchJSON('../page - projects/projects.json');
  buildCategoryFilterUI();
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

  // Apply category filter if any category is selected
  if (selectedCategories.length > 0) {
    filtered = filtered.filter(project => project.category && selectedCategories.includes(project.category));
  }

  // Update project count element (if present)
  const projectCountElement = document.querySelector('.projects-title');
  if (projectCountElement) {
    projectCountElement.textContent = filtered.length;
  }
  
  // Render filtered projects
  renderProjects(filtered, projectsContainer, 'h2');
}

// Update the search query state and trigger filtering on user input
searchInput.addEventListener('input', debounce((event) => {
  searchQuery = event.target.value;
  applyFilters();
}, 300)); // 300ms delay



//// PIE CHART RENDER ////
function renderFullPieChart() {
    // Aggregate counts by year using the raw data
    let rolledData = d3.rollups(rawProjects, v => v.length, d => d.year);
    let pieData = rolledData.map(([year, count]) => ({ label: year, value: count }));
    
    // Clear previous chart and legend elements
    svg.selectAll('*').remove();
    legend.selectAll('*').remove();
    
    // Create (or select) the tooltip element
    let tooltip = d3.select('.tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div').attr('class', 'tooltip');
    }
    
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
        .style('opacity', selectedYear === null || pieData[i].label === selectedYear ? 1 : 0.5)
        .on('mouseover', function(event) {
          tooltip
            .style('display', 'block')
            .text(`${pieData[i].value} ${pieData[i].value == 1 ? 'project' : 'projects'} in ${pieData[i].label}`);
        })
        .on('mousemove', function(event) {
          tooltip
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY + 10) + 'px');
        })
        .on('mouseout', function() {
          tooltip.style('display', 'none');
        })
        .on('click', function() {
          // Toggle the selected year filter
          let clickedYear = pieData[i].label;
          selectedYear = (selectedYear === clickedYear) ? null : clickedYear;
          applyFilters();
          
          // Update styling for each slice based on the selection
          svg.selectAll('path')
            .transition()
            .duration(200)
            .style('opacity', (d, idx) => selectedYear === null || pieData[idx].label === selectedYear ? 1 : 0.5)
            .style('stroke', (d, idx) => pieData[idx].label === selectedYear ? 'black' : 'none')
            .style('stroke-width', (d, idx) => pieData[idx].label === selectedYear ? 3 : 0);
          
          // Optionally update the legend as well
          legend.selectAll('li')
            .style('font-weight', (d, idx) => pieData[idx].label === selectedYear ? 'bold' : 'normal');
        });
      
      // Instead of using the native title attribute, we now rely on our custom tooltip.
      
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
            .style('opacity', (d, idx) => selectedYear === null || pieData[idx].label === selectedYear ? 1 : 0.5)
            .style('stroke', (d, idx) => pieData[idx].label === selectedYear ? 'black' : 'none')
            .style('stroke-width', (d, idx) => pieData[idx].label === selectedYear ? 3 : 0);
          
          legend.selectAll('li')
            .style('font-weight', (d, idx) => pieData[idx].label === selectedYear ? 'bold' : 'normal');
        });
    });
}  

// Prevents search bar from double loading
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Category filter dynamic generation
function buildCategoryFilterUI() {
  // Get unique categories (skip projects with no category)
  const categories = Array.from(
    new Set(
      rawProjects
        .filter(p => p.category && p.category.trim() !== '') // Skip empty or undefined
        .map(p => p.category)
    )
  );
  
  // Clear any existing checkboxes
  categoryFilterContainer.innerHTML = '';
  
  // For each unique category, create a label with a checkbox, name, and count
  categories.forEach(category => {
    // Create the outer label with a class for styling
    const label = document.createElement('label');
    label.classList.add('category-item');
    
    // Create a div for the left side: checkbox and category name
    const labelDiv = document.createElement('div');
    labelDiv.classList.add('category-label');
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = category;
    
    // Create span for the category name
    const categoryNameSpan = document.createElement('span');
    categoryNameSpan.classList.add('category-name');
    categoryNameSpan.textContent = category;
    
    // Append checkbox and name to the left container
    labelDiv.appendChild(checkbox);
    labelDiv.appendChild(categoryNameSpan);
    
    // Compute the total count for this category
    const count = rawProjects.filter(p => p.category === category).length;
    
    // Create a span for the count on the right
    const countSpan = document.createElement('span');
    countSpan.classList.add('category-count');
    countSpan.textContent = `(${count})`;
    
    // Append the left container and count span to the label
    label.appendChild(labelDiv);
    label.appendChild(countSpan);
    
    // Listen for changes on the checkbox to update filters
    checkbox.addEventListener('change', (event) => {
      if (event.target.checked) {
        selectedCategories.push(category);
      } else {
        selectedCategories = selectedCategories.filter(cat => cat !== category);
      }
      applyFilters();  // Re-filter projects on change
    });
    
    // Append the label to the category filter container
    categoryFilterContainer.appendChild(label);
  });
}


// Start the application
init();