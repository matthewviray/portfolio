    import { fetchJSON, renderProjects, BASE_PATH } from '../global.js';

    const projects = await fetchJSON('../lib/projects.json');
    const projectsContainer = document.querySelector('.projects');

    const title = document.querySelector('.projects-heading');
    title.textContent = `${projects.length} Projects`;
    const projectsWithPaths = projects.map(p => ({ ...p, image: BASE_PATH + p.image }));
    renderProjects(projectsWithPaths, projectsContainer, 'h2');
