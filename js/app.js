document.addEventListener('DOMContentLoaded', () => {
    let carouselInterval = null;

    // --- Theme Toggle ---
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const htmlElement = document.documentElement;

    // Dark is the lab's default; light only when explicitly chosen
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== 'light') {
        htmlElement.classList.add('dark');
    }
    updateThemeIcon(htmlElement.classList.contains('dark'));

    themeToggleBtn.addEventListener('click', () => {
        htmlElement.classList.toggle('dark');
        const isDark = htmlElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeIcon(isDark);
    });

    function updateThemeIcon(isDark) {
        const icon = themeToggleBtn.querySelector('.material-symbols-outlined');
        icon.textContent = isDark ? 'light_mode' : 'dark_mode';
    }

    // --- Mobile Sidebar Toggle ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    function toggleSidebar() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    }

    mobileMenuBtn.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);

    // --- Routing ---
    const pages = ['overview', 'systems', 'project', 'break-my-architecture', 'profile'];
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav__link');

    function handleRoute() {
        let hash = window.location.hash.slice(1);
        
        // Default route — the profile is the portfolio's landing page
        if (!hash) hash = 'profile';

        // Parse path for dynamic routes (e.g., project/dalbot)
        const parts = hash.split('/');
        const page = parts[0];
        const id = parts[1];

        // Never let a walkthrough keep playing after navigating away
        const leavingPlayer = document.getElementById('project-demo-player');
        if (leavingPlayer) leavingPlayer.pause();

        // Hide all pages
        pages.forEach(p => {
            const el = document.getElementById(`page-${p}`);
            if (el) el.classList.add('hidden');
        });

        // Show target page
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            
            // Special handling for dynamic project page
            if (page === 'project' && id) {
                renderProjectPage(id);
            } else if (page === 'systems') {
                renderSystemsPage();
            } else if (page === 'profile') {
                renderProfilePage();
            }
        } else {
            // Fallback
            document.getElementById('page-overview').classList.remove('hidden');
        }

        // Update active nav links
        updateActiveNavLinks(page);
        
        // Close mobile sidebar on navigation
        if (sidebar.classList.contains('open')) {
            toggleSidebar();
        }
        
        // Scroll to top
        document.querySelector('.main-content').scrollTop = 0;

        // #profile/connect drops the visitor straight at the Connect banner.
        // Runs after the reset above, once the rendered page has a height.
        if (page === 'profile' && id === 'connect') {
            requestAnimationFrame(() => {
                const target = document.getElementById('profile-connect-section');
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }
    }

    function updateActiveNavLinks(page) {
        // Desktop/Tablet Nav
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${page}`) {
                link.classList.add('active');
            }
        });
        
        // If on a project page, keep Systems nav active
        if (page === 'project') {
             navLinks.forEach(link => {
                if (link.getAttribute('href') === `#systems`) {
                    link.classList.add('active');
                }
            });
        }

        // Mobile Nav
        mobileNavLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${page}`) {
                link.classList.add('active');
            }
        });
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleRoute);
    
    // Initial route
    handleRoute();

    // --- Data Rendering ---
    
    // Up to three representative technologies for the card face
    function topTechnologies(project, limit) {
        const seen = [];
        project.techStack.forEach(layer => {
            layer.technologies.forEach(tech => {
                if (seen.length < limit) seen.push(tech.replace(/\s*\([^)]*\)/g, '').trim());
            });
        });
        return seen;
    }

    function renderSystemsPage() {
        const grid = document.getElementById('systems-grid');
        if (!grid) return;

        grid.innerHTML = '';

        portfolioData.projects.forEach(project => {
            const card = document.createElement('a');
            card.className = 'system-card';
            card.href = `#project/${project.id}`;
            card.style.setProperty('--card-accent', project.accent);

            const pills = (project.cardStack || topTechnologies(project, 3))
                .map(t => `<span class="system-card__pill">${t}</span>`)
                .join('');

            const footLabel = project.highlight ? 'Highlight' : 'Platform';
            const footValue = project.highlight || project.platform;

            card.innerHTML = `
                <div class="system-card__head">
                    <div class="system-card__mono">${project.monogram}</div>
                    <div class="system-card__heading">
                        <h3 class="system-card__name">${project.name}</h3>
                        ${project.teamProject ? '<span class="team-chip team-chip--sm"><span class="material-symbols-outlined">group</span> Group Project</span>' : ''}
                    </div>
                </div>
                <p class="system-card__tagline">${project.tagline}</p>
                <div class="system-card__section">
                    <div class="system-card__label">Stack</div>
                    <div class="system-card__pills">${pills}</div>
                </div>
                <div class="system-card__foot">
                    <div class="system-card__label">${footLabel}</div>
                    <div class="system-card__foot-row">
                        <span class="system-card__value">${footValue}</span>
                        ${project.year ? `<span class="system-card__year">${project.year}</span>` : ''}
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    function renderProjectPage(id) {
        const project = portfolioData.projects.find(p => p.id === id);
        if (!project) {
            window.location.hash = 'systems';
            return;
        }

        // Update Breadcrumb
        document.getElementById('project-breadcrumb-name').textContent = project.name;
        
        // Header
        document.getElementById('project-title').textContent = project.name;
        document.getElementById('project-resource-id').textContent = project.resourceId;
        document.getElementById('project-platform').textContent = project.platform;

        // Deployment lifecycle notice
        const noteEl = document.getElementById('project-status-note');
        if (noteEl) {
            noteEl.hidden = !project.statusNote;
            if (project.statusNote) noteEl.querySelector('p').textContent = project.statusNote;
        }

        // Live demo only when there is somewhere to send people
        const demoLink = document.getElementById('project-demo-link');
        if (demoLink) {
            demoLink.hidden = !project.liveUrl;
            if (project.liveUrl) demoLink.href = project.liveUrl;
        }

        // Research work has no runtime to simulate or break
        const chaosBtn = document.getElementById('project-chaos-btn');
        if (chaosBtn) chaosBtn.hidden = project.showChaos === false;

        // Architecture diagram
        const archFigure = document.getElementById('project-arch-figure');
        const archEmpty = document.getElementById('project-arch-empty');
        const archImg = document.getElementById('project-arch-img');
        if (archFigure && archEmpty && archImg) {
            const hasDiagram = Boolean(project.architecture);
            archFigure.hidden = !hasDiagram;
            archEmpty.hidden = hasDiagram;
            if (hasDiagram) {
                archImg.src = project.architecture;
                archImg.alt = `${project.name} system architecture diagram`;
                // Fill the width where the source image can take it, but never
                // upscale far enough to blur the diagram's labels.
                archImg.style.maxWidth = '';
                const fit = () => {
                    if (!archImg.naturalWidth) return;
                    archImg.style.maxWidth = Math.round(archImg.naturalWidth * 1.3) + 'px';
                };
                if (archImg.complete) fit(); else archImg.addEventListener('load', fit, { once: true });
            }
        }

        renderSourceLinks(project);
        renderDemoSection(project);

        // Group work is labelled so a teammate's name in the recording is not misleading
        const teamChip = document.getElementById('project-team-chip');
        if (teamChip) teamChip.hidden = !project.teamProject;
        
        // Summary (may contain multiple paragraphs)
        const summaryEl = document.getElementById('project-summary');
        summaryEl.innerHTML = '';
        project.summary.split(/\n\s*\n/).forEach(para => {
            const p = document.createElement('p');
            p.textContent = para.trim();
            summaryEl.appendChild(p);
        });
        
        // Features
        const featureList = document.getElementById('project-features');
        featureList.innerHTML = '';
        project.features.forEach(f => {
            featureList.innerHTML += `
                <li class="feature-item">
                    <span class="material-symbols-outlined">check_circle</span>
                    <span class="feature-item__text">${f}</span>
                </li>
            `;
        });
        
        // Tech Stack
        const techTbody = document.getElementById('project-tech-stack');
        techTbody.innerHTML = '';
        project.techStack.forEach(layer => {
            const tags = layer.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('');
            techTbody.innerHTML += `
                <tr>
                    <td class="font-bold font-mono text-xs">${layer.category}</td>
                    <td>
                        <div class="gap-tags">${tags}</div>
                    </td>
                </tr>
            `;
        });
        
        // Behind the Build
        const btbContainer = document.getElementById('project-behind-the-build');
        const btbPanel = document.getElementById('project-btb-panel');
        btbContainer.innerHTML = '';
        if (btbPanel) btbPanel.hidden = !(project.behindTheBuild && project.behindTheBuild.length);
        (project.behindTheBuild || []).forEach(item => {
            btbContainer.innerHTML += `
                <div class="build-item">
                    <div class="build-item__icon">
                        <span class="material-symbols-outlined">${item.icon}</span>
                    </div>
                    <div>
                        <div class="build-item__title">${item.title}</div>
                        <div class="build-item__text">${item.description}</div>
                    </div>
                </div>
            `;
        });
    }

    // Repository and write-up, in that order. Projects carry either, both, or
    // neither — the panel only appears once there is something to link to.
    function renderSourceLinks(project) {
        const panel = document.getElementById('project-source-panel');
        const list = document.getElementById('project-source-links');
        if (!panel || !list) return;

        const kinds = [
            {
                key: 'github',
                label: 'View Repository',
                icon: '<img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="" style="width:24px;height:24px;border-radius:50%;filter:grayscale(1) invert(var(--icon-invert, 0))">'
            },
            {
                key: 'medium',
                label: 'Read the Write-up',
                icon: '<span class="material-symbols-outlined">article</span>'
            }
        ];

        const links = project.links || {};
        const available = kinds.filter(link => links[link.key]);

        panel.hidden = available.length === 0;
        list.innerHTML = available.map(link => `
            <a href="${links[link.key]}" class="ext-link" target="_blank" rel="noopener noreferrer">
                <div class="ext-link__info">
                    ${link.icon}
                    <span>${link.label}</span>
                </div>
                <span class="material-symbols-outlined ext-link__arrow">arrow_outward</span>
            </a>
        `).join('');
    }

    // The Demo section does double duty: a recorded walkthrough where one exists,
    // and the written project report where it doesn't.
    function renderDemoSection(project) {
        const section = document.getElementById('project-demo-section');
        if (!section) return;

        const demo = project.demo;
        const isVideo = Boolean(demo && demo.type === 'video' && demo.src);
        const isDoc = Boolean(demo && demo.type === 'document' && demo.src);

        section.hidden = !isVideo && !isDoc;

        // The header shortcut only makes sense when there is a recording to jump to
        const jumpBtn = document.getElementById('project-demo-btn');
        if (jumpBtn) jumpBtn.hidden = !isVideo;

        document.getElementById('project-demo-icon').textContent = isDoc ? 'description' : 'play_circle';
        document.getElementById('project-demo-heading').textContent = isDoc ? 'Documentation' : 'Demo';

        const note = document.getElementById('project-demo-note');
        if (note) note.hidden = !(isVideo && project.demoByTeammate);

        // Stop and release the previous project's video before swapping sources
        const player = document.getElementById('project-demo-player');
        if (player) {
            player.pause();
            if (isVideo) {
                if (player.getAttribute('src') !== demo.src) player.src = demo.src;
            } else if (player.hasAttribute('src')) {
                player.removeAttribute('src');
                player.load();
            }
        }
        document.getElementById('project-demo-video').hidden = !isVideo;

        const docBox = document.getElementById('project-demo-doc');
        docBox.hidden = !isDoc;
        if (isDoc) {
            document.getElementById('project-demo-doc-msg').textContent =
                'A recorded walkthrough is not available for this project. The full project report below covers the approach, architecture, and results in detail.';
            document.getElementById('project-demo-doc-title').textContent = demo.title;
            document.getElementById('project-demo-doc-sub').textContent = demo.meta || '';

            renderDocThumb(document.getElementById('project-demo-doc-thumb'), demo.src);
        }
    }

    // pdf.js, fetched only once a project actually needs a report thumbnail.
    // The promise is cached on the function so the first route can call this
    // before this point in the file has been evaluated.
    function loadPdfJs() {
        if (loadPdfJs.pending) return loadPdfJs.pending;
        loadPdfJs.pending = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            s.onload = () => {
                const lib = window.pdfjsLib;
                if (!lib) return reject(new Error('pdf.js unavailable'));
                lib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve(lib);
            };
            s.onerror = () => reject(new Error('pdf.js failed to load'));
            document.head.appendChild(s);
        });
        return loadPdfJs.pending;
    }

    // Paint page one into the card's square. Anything that goes wrong — offline,
    // or opened straight off the filesystem where fetch is blocked — just leaves
    // the PDF glyph showing underneath.
    function renderDocThumb(canvas, src) {
        if (!canvas || canvas.dataset.src === src) return;
        canvas.dataset.src = src;
        canvas.hidden = true;

        loadPdfJs()
            .then(lib => lib.getDocument(src).promise)
            .then(pdf => pdf.getPage(1))
            .then(page => {
                if (canvas.dataset.src !== src) return; // navigated away mid-load
                const target = 92 * (window.devicePixelRatio || 1) * 2;
                const scale = target / page.getViewport({ scale: 1 }).width;
                const viewport = page.getViewport({ scale });
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                canvas.hidden = false;
                return page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            })
            .catch(() => { canvas.hidden = true; });
    }

    function renderProfilePage() {
        const profile = portfolioData.engineerProfile;
        
        // Identity
        document.getElementById('profile-name').textContent = profile.name;
        document.getElementById('profile-role').textContent = profile.role;
        document.getElementById('profile-tagline').textContent = profile.tagline;
        
        // Connect
        const connectContainer = document.getElementById('profile-connect-footer');
        if (connectContainer) {
            connectContainer.innerHTML = '';
            profile.connect.forEach(link => {
                connectContainer.innerHTML += `
                    <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="connect-pill">
                        <span class="material-symbols-outlined">${link.icon}</span>
                        <span>${link.name}</span>
                    </a>
                `;
            });
        }
        
        // Focus
        const focusContainer = document.getElementById('profile-focus');
        focusContainer.innerHTML = '';
        profile.focus.forEach(item => {
            focusContainer.innerHTML += `
                <div class="focus-item">
                    <div class="focus-item__icon">
                        <span class="material-symbols-outlined">${item.icon}</span>
                    </div>
                    <div class="focus-item__body">
                        <div class="focus-item__label">${item.label}</div>
                        <div class="focus-item__detail">${item.detail}</div>
                    </div>
                </div>
            `;
        });

        // Experience
        const expContainer = document.getElementById('profile-experience');
        expContainer.innerHTML = '';
        profile.experience.forEach((exp, index) => {
            const isLatest = index === 0;
            expContainer.innerHTML += `
                <div class="timeline__item">
                    <div class="timeline__dot ${isLatest ? '' : 'timeline__dot--inactive'}"></div>
                    <div class="font-bold text-sm">${exp.company}</div>
                    <div class="text-xs text-secondary-color font-mono mb-sm">${exp.duration}</div>
                    <p class="text-sm whitespace-pre-line">${exp.description}</p>
                </div>
            `;
        });

        // Education
        const eduContainer = document.getElementById('profile-education');
        eduContainer.innerHTML = '';
        profile.education.forEach(edu => {
            eduContainer.innerHTML += `
                <div>
                    <div class="font-bold text-sm">${edu.university}</div>
                    <div class="text-sm mt-1">${edu.degree}</div>
                    ${edu.score ? `<div class="font-mono text-xs text-secondary-color mt-1">${edu.score}</div>` : ''}
                </div>
            `;
        });
        
        // Awards & Recognition (AWS-style resource records)
        const achContainer = document.getElementById('profile-achievements');
        achContainer.innerHTML = '';
        profile.achievements.forEach((ach, index) => {
            const tr = document.createElement('tr');
            const repeat = ach.occurrences > 1;
            const typeSlug = ach.type.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const action = ach.proof
                ? `<button type="button" class="record-action" data-proof-index="${index}">
                       <span class="material-symbols-outlined">visibility</span> View<span class="record-action__more">Recognition</span>
                   </button>`
                : `<span class="record-action--empty">no proof attached</span>`;

            tr.innerHTML = `
                <td>
                    <div class="record-name">
                        <div class="record-name__icon record-name__icon--${typeSlug}">
                            <span class="material-symbols-outlined">${ach.icon}</span>
                        </div>
                        <div>
                            <div class="record-name__id">${ach.name}</div>
                            <div class="record-name__label">${ach.detail || ach.id}</div>
                        </div>
                    </div>
                </td>
                <td><span class="record-type record-type--${typeSlug}">${ach.type}</span></td>
                <td><span class="record-org">${ach.organization || '—'}</span></td>
                <td class="text-center"><span class="record-count${repeat ? ' record-count--repeat' : ''}">${ach.occurrences}×</span></td>
                <td><span class="badge badge-success"><span class="badge__dot"></span>${ach.status}</span></td>
                <td class="text-right">${action}</td>
            `;
            achContainer.appendChild(tr);
        });

        const records = profile.achievements.length;
        const totalRecognitions = profile.achievements.reduce((sum, a) => sum + a.occurrences, 0);
        const organizations = new Set(
            profile.achievements.map(a => a.organization).filter(Boolean)
        ).size;

        const awardsCount = document.getElementById('awards-count');
        if (awardsCount) {
            awardsCount.textContent = `${records} record${records === 1 ? '' : 's'}`;
        }

        const metrics = document.getElementById('awards-metrics');
        if (metrics) {
            metrics.innerHTML = [
                { label: 'Distinct Awards', value: records, icon: 'inventory_2' },
                { label: 'Total Recognitions', value: totalRecognitions, icon: 'trending_up' },
                { label: 'Organizations', value: organizations, icon: 'domain' }
            ].map(m => `
                <div class="record-metric">
                    <span class="material-symbols-outlined record-metric__icon">${m.icon}</span>
                    <div>
                        <div class="record-metric__value">${m.value}</div>
                        <div class="record-metric__label">${m.label}</div>
                    </div>
                </div>
            `).join('');
        }

        achContainer.querySelectorAll('[data-proof-index]').forEach(btn => {
            btn.addEventListener('click', () => {
                openRecognition(profile.achievements[parseInt(btn.dataset.proofIndex, 10)]);
            });
        });

        // Beyond the Lab Carousel
        const carouselInner = document.getElementById('carousel-inner');
        const carouselIndicators = document.getElementById('carousel-indicators');
        carouselInner.innerHTML = '';
        carouselIndicators.innerHTML = '';
        
        profile.beyondTheLab.forEach((item, index) => {
            carouselInner.innerHTML += `
                <div class="carousel-item">
                    <img src="${item.image}" alt="${item.title}" />
                    <div class="carousel-content">
                        <div class="carousel-title">${item.title}</div>
                        <div class="carousel-desc">${item.description}</div>
                    </div>
                </div>
            `;
            carouselIndicators.innerHTML += `
                <div class="carousel-indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
            `;
        });
        
        initCarousel(profile.beyondTheLab.length);
    }

    // --- Global search ---
    const searchInput = document.getElementById('global-search');
    const searchResults = document.getElementById('search-results');
    const searchClear = document.getElementById('global-search-clear');
    let searchHits = [];
    let activeHit = -1;

    function buildSearchIndex() {
        const index = [];

        [
            { title: 'Lab Overview', sub: 'Dashboard & resource usage', icon: 'dashboard', hash: 'overview' },
            { title: 'Systems / Projects', sub: 'Deployed systems directory', icon: 'account_tree', hash: 'systems' },
            { title: 'Break My Architecture', sub: 'Chaos engineering simulations', icon: 'biotech', hash: 'break-my-architecture' },
            { title: 'Know More About Me', sub: 'Profile, awards & background', icon: 'account_circle', hash: 'profile' }
        ].forEach(p => index.push({ ...p, group: 'Pages', keywords: `${p.title} ${p.sub}` }));

        portfolioData.projects.forEach(project => {
            const tech = project.techStack
                .reduce((all, layer) => all.concat(layer.technologies), [])
                .join(' ');
            index.push({
                group: 'Projects',
                title: project.name,
                sub: `${project.resourceId} · ${project.tagline}`,
                icon: project.icon,
                hash: `project/${project.id}`,
                keywords: `${project.name} ${project.id} ${project.tagline} ${project.summary} ${tech} ${project.features.join(' ')} ${project.platform} ${project.status}`
            });
        });

        portfolioData.engineerProfile.achievements.forEach(ach => {
            index.push({
                group: 'Awards & Recognition',
                title: ach.name,
                sub: `${ach.type}${ach.organization ? ' · ' + ach.organization : ''}`,
                icon: ach.icon,
                hash: 'profile',
                keywords: `${ach.name} ${ach.type} ${ach.organization} ${ach.detail} ${ach.period}`
            });
        });

        portfolioData.engineerProfile.focus.forEach(f => {
            index.push({
                group: 'Engineering Focus',
                title: f.label,
                sub: f.detail,
                icon: f.icon,
                hash: 'profile',
                keywords: `${f.label} ${f.detail}`
            });
        });

        portfolioData.engineerProfile.education.forEach(edu => {
            index.push({
                group: 'Education',
                title: edu.university,
                sub: edu.degree,
                icon: 'school',
                hash: 'profile',
                keywords: `${edu.university} ${edu.degree} education degree`
            });
        });

        portfolioData.engineerProfile.experience.forEach(exp => {
            index.push({
                group: 'Experience',
                title: exp.company,
                sub: `${exp.duration} · ${exp.description.replace(/\n/g, ' · ')}`,
                icon: 'work',
                hash: 'profile',
                keywords: `${exp.company} ${exp.duration} ${exp.description} experience work`
            });
        });

        portfolioData.engineerProfile.beyondTheLab.forEach(item => {
            index.push({
                group: 'Beyond the Lab',
                title: item.title.replace(/^\d+\.\s*/, ''),
                sub: 'Hackathons & volunteering',
                icon: 'photo_library',
                hash: 'profile',
                keywords: `${item.title} ${item.description} hackathon volunteer`
            });
        });

        portfolioData.engineerProfile.connect.forEach(link => {
            index.push({
                group: 'Connect',
                title: link.name,
                sub: link.url.replace(/^(https?:\/\/|mailto:)/, ''),
                icon: link.icon,
                url: link.url,
                keywords: `${link.name} ${link.url} contact connect`
            });
        });

        return index;
    }

    const searchIndex = buildSearchIndex();

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, c => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
        ));
    }

    function highlight(text, query) {
        const i = text.toLowerCase().indexOf(query);
        if (i === -1) return escapeHtml(text);
        const before = escapeHtml(text.slice(0, i));
        const hit = escapeHtml(text.slice(i, i + query.length));
        const after = escapeHtml(text.slice(i + query.length));
        return before + '<mark>' + hit + '</mark>' + after;
    }

    function runSearch(rawQuery) {
        const query = rawQuery.trim().toLowerCase();
        searchClear.hidden = rawQuery.length === 0;

        if (query.length < 2) {
            closeSearch();
            return;
        }

        searchHits = searchIndex
            .map(entry => {
                const title = entry.title.toLowerCase();
                const haystack = entry.keywords.toLowerCase();
                let score = -1;
                if (title.startsWith(query)) score = 0;
                else if (title.includes(query)) score = 1;
                else if (haystack.includes(query)) score = 2;
                return { entry: entry, score: score };
            })
            .filter(r => r.score >= 0)
            .sort((a, b) => a.score - b.score)
            .slice(0, 12)
            .map(r => r.entry);

        activeHit = searchHits.length ? 0 : -1;
        renderSearchResults(query);
    }

    function renderSearchResults(query) {
        if (!searchHits.length) {
            searchResults.innerHTML = '<div class="search-empty">No resources match <strong>' + escapeHtml(query) + '</strong></div>';
        } else {
            let html = '';
            let lastGroup = null;
            searchHits.forEach((hit, i) => {
                if (hit.group !== lastGroup) {
                    html += `<div class="search-group__label">${hit.group}</div>`;
                    lastGroup = hit.group;
                }
                html += `
                    <button type="button" class="search-hit${i === activeHit ? ' is-active' : ''}" role="option" data-hit="${i}">
                        <span class="search-hit__icon"><span class="material-symbols-outlined">${hit.icon}</span></span>
                        <span class="search-hit__body">
                            <span class="search-hit__title">${highlight(hit.title, query)}</span>
                            <span class="search-hit__sub">${escapeHtml(hit.sub)}</span>
                        </span>
                        <span class="search-hit__enter">&#9166;</span>
                    </button>
                `;
            });
            searchResults.innerHTML = html;
            searchResults.querySelectorAll('[data-hit]').forEach(btn => {
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    gotoHit(searchHits[parseInt(btn.dataset.hit, 10)]);
                });
            });
        }
        searchResults.hidden = false;
        searchInput.setAttribute('aria-expanded', 'true');
    }

    function setActiveHit(next) {
        if (!searchHits.length) return;
        activeHit = (next + searchHits.length) % searchHits.length;
        searchResults.querySelectorAll('.search-hit').forEach(el => {
            const isActive = parseInt(el.dataset.hit, 10) === activeHit;
            el.classList.toggle('is-active', isActive);
            if (isActive) el.scrollIntoView({ block: 'nearest' });
        });
    }

    function gotoHit(hit) {
        if (!hit) return;
        if (hit.url) {
            window.open(hit.url, '_blank', 'noopener');
        } else if (window.location.hash === '#' + hit.hash) {
            handleRoute();
        } else {
            window.location.hash = hit.hash;
        }
        searchInput.value = '';
        searchClear.hidden = true;
        searchInput.blur();
        closeSearch();
    }

    function closeSearch() {
        searchResults.hidden = true;
        searchResults.innerHTML = '';
        searchInput.setAttribute('aria-expanded', 'false');
        searchHits = [];
        activeHit = -1;
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => runSearch(e.target.value));
        searchInput.addEventListener('focus', (e) => {
            if (e.target.value.trim().length >= 2) runSearch(e.target.value);
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActiveHit(activeHit + 1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveHit(activeHit - 1); }
            else if (e.key === 'Enter') { e.preventDefault(); gotoHit(searchHits[activeHit]); }
            else if (e.key === 'Escape') { searchInput.value = ''; searchClear.hidden = true; closeSearch(); searchInput.blur(); }
        });
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchClear.hidden = true;
            closeSearch();
            searchInput.focus();
        });
        document.addEventListener('click', (e) => {
            const wrap = document.getElementById('global-search-wrap');
            if (wrap && !wrap.contains(e.target)) closeSearch();
        });
        // "/" focuses search, the way console shortcuts do
        document.addEventListener('keydown', (e) => {
            const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
            if (e.key === '/' && !typing) {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }

    // --- Recognition proof viewer ---
    const recModal = document.getElementById('rec-modal');

    // Shared full-size image viewer (recognition proofs + architecture diagrams)
    function openImageViewer({ eyebrow, title, meta, src, alt, wide }) {
        if (!recModal || !src) return;

        document.getElementById('rec-modal-eyebrow').textContent = eyebrow;
        document.getElementById('rec-modal-title').textContent = title;

        const metaEl = document.getElementById('rec-modal-meta');
        metaEl.innerHTML = (meta || []).map(m => `<span>${m}</span>`).join('');
        metaEl.hidden = !(meta && meta.length);

        const img = document.getElementById('rec-modal-img');
        img.hidden = false;
        img.src = src;
        img.alt = alt;
        document.getElementById('rec-modal-doc').hidden = true;
        document.getElementById('rec-modal-open').hidden = true;
        recModal.classList.remove('rec-modal--doc');

        recModal.classList.toggle('rec-modal--wide', Boolean(wide));
        if (viewerBody) { viewerBody.classList.remove('is-zoomed'); viewerImg.style.width = ''; }
        recModal.hidden = false;
        document.body.classList.add('rec-modal-open');
        recModal.querySelector('.rec-modal__close').focus();
    }

    // Same shell as the image viewer, but handing the body over to the PDF
    function openDocViewer({ eyebrow, title, meta, src }) {
        if (!recModal || !src) return;

        document.getElementById('rec-modal-eyebrow').textContent = eyebrow;
        document.getElementById('rec-modal-title').textContent = title;

        const metaEl = document.getElementById('rec-modal-meta');
        metaEl.innerHTML = (meta || []).map(m => `<span>${m}</span>`).join('');
        metaEl.hidden = !(meta && meta.length);

        const img = document.getElementById('rec-modal-img');
        img.hidden = true;
        img.src = '';

        const openLink = document.getElementById('rec-modal-open');
        openLink.href = src;
        openLink.hidden = false;

        const frame = document.getElementById('rec-modal-doc');
        frame.hidden = false;
        frame.src = src;

        recModal.classList.remove('rec-modal--wide');
        recModal.classList.add('rec-modal--doc');
        if (viewerBody) { viewerBody.classList.remove('is-zoomed'); viewerImg.style.width = ''; }
        recModal.hidden = false;
        document.body.classList.add('rec-modal-open');
        recModal.querySelector('.rec-modal__close').focus();
    }

    function openRecognition(ach) {
        if (!ach || !ach.proof) return;
        openImageViewer({
            eyebrow: ach.type,
            title: ach.name,
            meta: [
                ach.organization ? `Organization: <strong>${ach.organization}</strong>` : null,
                `Occurrences: <strong>${ach.occurrences}×</strong>`,
                ach.period ? `Period: <strong>${ach.period}</strong>` : null,
                `Status: <strong>${ach.status}</strong>`
            ].filter(Boolean),
            src: ach.proof,
            alt: `${ach.name} recognition certificate`
        });
    }

    // Top-of-page shortcut down to the Demo section
    const demoJumpBtn = document.getElementById('project-demo-btn');
    if (demoJumpBtn) {
        demoJumpBtn.addEventListener('click', () => {
            const target = document.getElementById('project-demo-section');
            if (target && !target.hidden) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // Open the project report from its thumbnail
    const docCardBtn = document.getElementById('project-demo-doc-card');
    if (docCardBtn) {
        docCardBtn.addEventListener('click', () => {
            const hash = window.location.hash.slice(1).split('/');
            const project = portfolioData.projects.find(p => p.id === hash[1]);
            if (!project || !project.demo || project.demo.type !== 'document') return;
            openDocViewer({
                eyebrow: 'Project documentation',
                title: project.demo.title,
                meta: [`Project: <strong>${project.name}</strong>`, project.demo.meta].filter(Boolean),
                src: project.demo.src
            });
        });
    }

    // Enlarge the architecture diagram
    const archZoomBtn = document.getElementById('project-arch-zoom');
    if (archZoomBtn) {
        archZoomBtn.addEventListener('click', () => {
            const hash = window.location.hash.slice(1).split('/');
            const project = portfolioData.projects.find(p => p.id === hash[1]);
            if (!project || !project.architecture) return;
            openImageViewer({
                eyebrow: 'System architecture',
                title: project.name,
                meta: [`Platform: <strong>${project.platform}</strong>`],
                src: project.architecture,
                alt: `${project.name} system architecture diagram`,
                wide: true
            });
        });
    }

    // Click the enlarged image to switch between fit-to-window and full resolution
    const viewerBody = recModal ? recModal.querySelector('.rec-modal__body') : null;
    const viewerImg = document.getElementById('rec-modal-img');
    if (viewerImg && viewerBody) {
        viewerImg.addEventListener('click', () => {
            const zoomed = viewerBody.classList.toggle('is-zoomed');
            if (zoomed) {
                // Always enlarge relative to what is on screen: a small source
                // at 100%% would otherwise be smaller than the fitted view.
                const target = Math.max(viewerImg.naturalWidth, viewerBody.clientWidth * 1.9);
                viewerImg.style.width = Math.round(target) + 'px';
                viewerBody.scrollLeft = (viewerBody.scrollWidth - viewerBody.clientWidth) / 2;
                viewerBody.scrollTop = (viewerBody.scrollHeight - viewerBody.clientHeight) / 2;
            } else {
                viewerImg.style.width = '';
                viewerBody.scrollTop = 0;
                viewerBody.scrollLeft = 0;
            }
        });
    }

    function closeRecognition() {
        if (!recModal || recModal.hidden) return;
        recModal.hidden = true;
        recModal.classList.remove('rec-modal--wide', 'rec-modal--doc');
        if (viewerBody) { viewerBody.classList.remove('is-zoomed'); viewerImg.style.width = ''; }
        document.getElementById('rec-modal-img').src = '';
        const frame = document.getElementById('rec-modal-doc');
        frame.hidden = true;
        frame.src = '';
        document.getElementById('rec-modal-open').hidden = true;
        document.body.classList.remove('rec-modal-open');
    }

    if (recModal) {
        recModal.querySelectorAll('[data-rec-close]').forEach(el => {
            el.addEventListener('click', closeRecognition);
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeRecognition();
        });
    }

    function initCarousel(totalItems) {
        let currentIndex = 0;
        const inner = document.getElementById('carousel-inner');
        const indicators = document.querySelectorAll('.carousel-indicator');
        
        function updateCarousel(index) {
            currentIndex = index;
            if (currentIndex < 0) currentIndex = totalItems - 1;
            if (currentIndex >= totalItems) currentIndex = 0;
            
            inner.style.transform = `translateX(-${currentIndex * 100}%)`;
            
            indicators.forEach((ind, i) => {
                if (i === currentIndex) ind.classList.add('active');
                else ind.classList.remove('active');
            });
        }
        
        document.getElementById('carousel-prev').onclick = () => {
            updateCarousel(currentIndex - 1);
            resetInterval();
        };
        
        document.getElementById('carousel-next').onclick = () => {
            updateCarousel(currentIndex + 1);
            resetInterval();
        };
        
        indicators.forEach(ind => {
            ind.onclick = (e) => {
                updateCarousel(parseInt(e.target.dataset.index));
                resetInterval();
            };
        });
        
        function resetInterval() {
            clearInterval(carouselInterval);
            carouselInterval = setInterval(() => {
                updateCarousel(currentIndex + 1);
            }, 5000);
        }
        
        resetInterval();
    }
});
