let translations = {};

// Fetch translations from server
async function loadTranslations() {
  try {
    const response = await fetch('/api/translations');
    translations = await response.json();
    // After loading, detect language
    detectLanguage();
  } catch (error) {
    console.error('Failed to load translations:', error);
  }
}

let currentLang = localStorage.getItem('lang');

function setLanguage(lang) {
  if (!translations[lang]) lang = 'en'; // Safety fallback
  currentLang = lang;
  localStorage.setItem('lang', lang);
  
  // Update static text
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[lang][key]) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = translations[lang][key];
      } else {
        element.innerText = translations[lang][key];
      }
    }
  });

  // Update document title
  document.title = translations[lang].title;

  // Update project list
  updateProjectList();

  // Update active project detail if open
  const urlParams = new URLSearchParams(window.location.search);
  // Check if we are in detail view (simple check based on URL or DOM state)
  const detailView = document.getElementById('project-detail-view');
  if (detailView && detailView.style.display !== 'none') {
     // We need to know which project is open. 
     // The easiest way is to re-render the detail view if we have the ID.
     // We can get the ID from the URL path /project/:id
     const path = window.location.pathname;
     const match = path.match(/\/project\/(\d+)/);
     if (match) {
       openProjectDetail(parseInt(match[1]));
     }
  }
}

function updateProjectList() {
  const projectsGrid = document.querySelector('.projects-grid');
  if (!projectsGrid) return;
  
  const lang = currentLang;

  if (typeof allProjects !== 'undefined') {
    let html = '';
    if (allProjects.length > 0) {
      allProjects.forEach(project => {
        const title = lang === 'tr' ? project.title : (project[`title_${lang}`] || project.title);
        const description = lang === 'tr' ? project.description : (project[`description_${lang}`] || project.description);
        
        html += `
          <div class="glass-card" onclick="openProjectDetail(${project.id})">
            ${project.imageUrl ? `
              <div class="card-image" style="height: 180px; overflow: hidden; border-radius: 12px 12px 0 0; margin: -2rem -2rem 1.5rem -2rem;">
                <img 
                  src="${project.imageUrl}" 
                  srcset="${project.imageUrl.replace('&w=600', '&w=400')} 400w, ${project.imageUrl} 600w"
                  sizes="(max-width: 600px) 100vw, 400px"
                  alt="${title}" 
                  loading="lazy"
                  style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;">
              </div>
            ` : ''}
            <div class="card-content">
              <h3>${title}</h3>
              <p>${description}</p>
              <div class="tags">
                ${project.tags && project.tags.length > 0 ? project.tags.map(tag => `<span>${tag}</span>`).join('') : ''}
              </div>
            </div>
          </div>
        `;
      });
    } else {
       html = `
          <div class="glass-card">
            <div class="card-content">
              <h3 data-i18n="no_projects">${translations[lang].no_projects}</h3>
              <p data-i18n="no_projects_desc">${translations[lang].no_projects_desc}</p>
            </div>
          </div>
       `;
    }
    projectsGrid.innerHTML = html;
  }
}

async function detectLanguage() {
  // If language is already set in localStorage, use it
  if (currentLang) {
    setLanguage(currentLang);
    return;
  }

  let country = null;

  try {
    // Attempt 1: ipapi.co (HTTPS)
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      country = data.country_code;
    } else {
      throw new Error('ipapi.co failed');
    }
  } catch (error) {
    console.warn('Primary IP API failed, trying backup...', error);
    try {
      // Attempt 2: ipwho.is (HTTPS, no key required)
      const response = await fetch('https://ipwho.is/');
      if (response.ok) {
        const data = await response.json();
        country = data.country_code;
      }
    } catch (e) {
      console.error('All IP APIs failed:', e);
    }
  }

  console.log("Detected Country:", country);

  if (country === 'TR') {
    setLanguage('tr');
  } else if (country === 'DE') {
    setLanguage('de');
  } else if (country) {
    // If we detected a country but it's not TR or DE, default to EN
    setLanguage('en');
  } else {
    // Fallback to browser language if IP detection completely failed
    const browserLang = navigator.language || navigator.userLanguage;
    console.log("Fallback to Browser Lang:", browserLang);
    
    if (browserLang.startsWith('tr')) {
      setLanguage('tr');
    } else if (browserLang.startsWith('de')) {
      setLanguage('de');
    } else {
      setLanguage('en');
    }
  }
}

// Wait for DOM load to set initial language
document.addEventListener('DOMContentLoaded', () => {
  loadTranslations();
});
