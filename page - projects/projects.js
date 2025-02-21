import { fetchJSON, renderProjects, parseDate } from '../scripts/global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Global state variables
let rawProjects = [];
let searchQuery = '';
let selectedYear = null;
let selectedCategories = [];
let parentStack = [];
let previousParent = null;

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

function getCurrentParent() {
  return parentStack.length > 0 ? parentStack[parentStack.length - 1] : null;
}

// Initialization: fetch projects and render both views
async function init() {
  rawProjects = await fetchJSON('../page - projects/projects.json');
  applyFilters();
  buildCategoryFilterUI(rawProjects);
  renderFullPieChart(rawProjects);  // Always render full pie chart from rawProjects
}

const debouncedRender = debounce((filteredProjects) => {
  renderProjects(filteredProjects, projectsContainer, 'h2', (project) => {
    parentStack.push(project.title);
    applyFilters();
  });
  renderBackButton();
}, 200);

// Global filter function: combines search and pie chart filters for projects list
function applyFilters() {
  let parentFilter = rawProjects;

  // Parent–Child filtering:
  const currentParent = getCurrentParent();
  if (currentParent) {
    // If a parent is selected, show only its child items (where project.parentKey matches)
    parentFilter = parentFilter.filter(project => project.parentKey === currentParent);
  } else {
    // Otherwise, show only projects that are not children (i.e. have no parentKey)
    parentFilter = parentFilter.filter(project => !project.parentKey);
  }

  let filtered = parentFilter;
  
  // Apply pie chart filter if a year is selected
  if (selectedYear !== null) {
    filtered = filtered.filter(project => {
        // Convert project.date into an array if it isn't already
        let years = Array.isArray(project.date) ? project.date.map(dateStr => +parseDate(dateStr).year) : [+parseDate(project.date).year];
        return years.includes(selectedYear);
    });
  }
  
  // Apply search filter if query is non-empty
  if (searchQuery.trim() !== '') {
    filtered = filtered.filter(project => {
      let values = [project.title, project.description, project.date].join(' ').toLowerCase();
      return values.includes(searchQuery.toLowerCase());
    });
  }

  // Apply category filter if any category is selected
  if (selectedCategories.length > 0) {
    filtered = filtered.filter(project => {
      let categories = Array.isArray(project.category) ? project.category : [project.category];
      return categories.some(cat => selectedCategories.includes(cat));
    });
  }

  // Update project count element (if present)
  const projectCountElement = document.querySelector('.projects-title');
  if (projectCountElement) {
    projectCountElement.textContent = rawProjects.filter(p => { return !p.isParent }).length;
  }
  
  // Render filtered projects
  debouncedRender(filtered);
  
  if (currentParent !== previousParent) {
    // When switching between all projects and a child view, re-render the charts/filters using the relevant dataset.
    // You could pass in the filtered dataset (child view) or the parentFilter data (which is the base before other filters)
    renderFullPieChart(parentFilter);
    buildCategoryFilterUI(parentFilter);
    previousParent = currentParent;  // Update our stored parent state
  }
}

// Update the search query state and trigger filtering on user input
searchInput.addEventListener('input', debounce((event) => {
  searchQuery = event.target.value;
  applyFilters();
}, 300)); // 300ms delay

// Render a back button outside the normal renderProjects function if needed.
function renderBackButton() {
  let backButton = document.querySelector('#back-button');
  const currentParent = getCurrentParent();
  if (currentParent) {
    // If a parent is active and there's no back button, create one.
    if (!backButton) {
      backButton = document.createElement('button');
      backButton.id = 'back-button';
      backButton.textContent = 'Back to Previous Projects';
      backButton.style.display = 'block';
      backButton.style.marginBottom = '1em';
      backButton.addEventListener('click', () => {
        parentStack.pop();  // Return to the previous state (or null if the stack is now empty)
        applyFilters();
      });
      // Insert the back button before the projects container
      projectsContainer.parentElement.insertBefore(backButton, projectsContainer);
    }
  } else {
    // No parent filter is active; remove any existing back button.
    if (backButton) {
      backButton.remove();
    }
  }
}

//// PIE CHART RENDER ////
function renderFullPieChart(data) {
    // Aggregate counts by year using the raw data
    let yearCounts = new Map();

    data.forEach(project => {
        let years = Array.isArray(project.date) ? project.date.map(dateStr => +parseDate(dateStr).year) : [+parseDate(project.date).year];

        years.forEach(year => {
            yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
        });
    });
    let pieData = Array.from(yearCounts, ([label, value]) => ({ label, value }));
    
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
function buildCategoryFilterUI(data) {
  // Gather all categories from all projects
  let allCategories = data.flatMap(p => {
    if (Array.isArray(p.category)) return p.category;
    if (p.category) return [p.category];
    return [];
  });
  const categories = Array.from(
    new Set(allCategories.filter(cat => cat && cat.trim() !== ''))
  );
  
  // Clear any existing checkboxes
  categoryFilterContainer.innerHTML = '';
  
  // Create the checkbox UI for each unique category
  categories.forEach(category => {
    // Create a container label for styling
    const label = document.createElement('label');
    label.classList.add('category-item');
    
    // Left side container: checkbox and category name
    const labelDiv = document.createElement('div');
    labelDiv.classList.add('category-label');
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = category;
    
    // Span for the category name
    const categoryNameSpan = document.createElement('span');
    categoryNameSpan.classList.add('category-name');
    categoryNameSpan.textContent = category;
    
    // Append checkbox and name to the left container
    labelDiv.appendChild(checkbox);
    labelDiv.appendChild(categoryNameSpan);
    
    // Count the number of projects containing this category
    const currentParent = getCurrentParent();
    let allDescendantTitles = new Set();

    if (currentParent) {
      let stack = [currentParent];

      while (stack.length > 0) {
        let parentTitle = stack.pop();
        allDescendantTitles.add(parentTitle);
        let children = rawProjects.filter(x => x.parentKey === parentTitle);

        for (let child of children) {
          if (child.isParent) {
            stack.push(child.title);
          }
        }
      }
    }
  
    const count = rawProjects.filter(p => {
      let cats = Array.isArray(p.category) ? p.category : [p.category];
      const inCategory = cats.includes(category);
      
      if (currentParent) { return inCategory && allDescendantTitles.has(p.parentKey) && !p.isParent; }
      else { return inCategory && !p.isParent }
    }).length;
    
    // Create a span to display the count on the right
    const countSpan = document.createElement('span');
    countSpan.classList.add('category-count');
    countSpan.textContent = `(${count})`;
    
    // Append the left container and count to the label
    label.appendChild(labelDiv);
    label.appendChild(countSpan);
    
    // Listen for changes on the checkbox to update filters
    checkbox.addEventListener('change', (event) => {
      if (event.target.checked) {
        selectedCategories.push(category);
      } else {
        selectedCategories = selectedCategories.filter(cat => cat !== category);
      }
      applyFilters();  // Re-filter projects when selection changes
    });
    
    // Append the label to the filter container
    categoryFilterContainer.appendChild(label);
  });
}


// Start the application
init();