import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

const title = document.querySelector('.projects-heading');
title.textContent = `${projects.length} Projects`;

const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const colors = d3.scaleOrdinal(d3.schemePaired);

let selectedIndex = -1;
let selectedYear = null; // tracks the actual year value, survives pie re-renders
let query = '';

// applies both the search query and the pie selection at once
function getFilteredProjects() {
    return projects.filter((project) => {
        const matchesSearch = !query || Object.values(project).join('\n').toLowerCase().includes(query.toLowerCase());
        const matchesYear = selectedYear === null || project.year === selectedYear;
        return matchesSearch && matchesYear;
    });
}

function renderPieChart(projectsGiven) {
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );
    let newData = newRolledData.map(([year, count]) => ({ label: year, value: count }));

    // re-derive selectedIndex from selectedYear so the highlight survives pie re-renders
    selectedIndex = selectedYear === null ? -1 : newData.findIndex(d => d.label === selectedYear);
    // if the selected year vanished from the filtered data, clear the selection entirely
    if (selectedIndex === -1) selectedYear = null;

    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map(d => arcGenerator(d));

    let newSVG = d3.select('svg');
    newSVG.selectAll('path').remove();
    d3.select('.legend').selectAll('li').remove();

    newArcs.forEach((arc, i) => {
        newSVG
            .append('path')
            .attr('d', arc)
            .attr('fill', colors(i))
            .attr('class', i === selectedIndex ? 'selected' : '')
            .on('click', () => {
                if (selectedIndex === i) {
                    selectedIndex = -1;
                    selectedYear = null;
                } else {
                    selectedIndex = i;
                    selectedYear = newData[i].label;
                }

                newSVG
                    .selectAll('path')
                    .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');

                d3.select('.legend')
                    .selectAll('li')
                    .attr('class', (_, idx) => idx === selectedIndex ? 'legend-item selected' : 'legend-item');

                renderProjects(getFilteredProjects(), projectsContainer, 'h2');
            });
    });

    const legend = d3.select('.legend');
    newData.forEach((d, idx) => {
        legend
            .append('li')
            .attr('class', idx === selectedIndex ? 'legend-item selected' : 'legend-item')
            .attr('style', `--color:${colors(idx)}`)
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
}

renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);

const searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('change', (event) => {
    query = event.target.value;
    // pie chart only shows distribution of search results (not year-filtered)
    const searchFiltered = projects.filter((project) => {
        const values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });
    renderProjects(getFilteredProjects(), projectsContainer, 'h2');
    renderPieChart(searchFiltered);
});
