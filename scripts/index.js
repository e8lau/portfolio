import { fetchJSON, renderProjects, fetchGitHubData, parseDate } from '../scripts/global.js';

// Display latest projects
const projects = await fetchJSON('./page - projects/projects.json');
const projectsContainer = document.querySelector('.projects');

// Lates Project Rendering
function combineDate(dateObj) {
  const year = dateObj.year === 'Unknown' ? 0 : +dateObj.year;
  const month = dateObj.month === 'Unknown' ?  0 : +dateObj.month;
  const day = dateObj.day === 'Unknown' ?  0 : +dateObj.day;
  return year * 10000 + month * 100 + day;
}

let latestProjects = [];
let projIndex = 0

projects.forEach(project => {
  let projDate = 0

  if (project.file !== "#") {
    if (Array.isArray(project.date)) {
      projDate = project.date.map(dateStr => combineDate(parseDate(dateStr)));
      projDate = Math.max(...projDate);
    } else {
      projDate = combineDate(parseDate(project.date))
    }

    console.log(projDate);

    latestProjects.push([projIndex, projDate]);
  }
  projIndex += 1;
});

latestProjects = latestProjects.sort((a, b) => b[1] - a[1])

renderProjects(
  [projects[latestProjects[0][0]], projects[latestProjects[1][0]], projects[latestProjects[2][0]]],
  projectsContainer,
  'h2'
);

// Display github API data
const githubData = await fetchGitHubData('giorgianicolaou');
const profileStats = document.querySelector('#profile-stats');
if (profileStats) {
    profileStats.innerHTML = `
        <dl>
          <dt>Followers:</dt><dd>${githubData.followers}</dd>
          <dt>Following:</dt><dd>${githubData.following}</dd>
          <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
        </dl>
    `;
}