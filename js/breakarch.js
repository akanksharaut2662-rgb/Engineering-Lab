/* =========================================================================
   Break My Architecture — renderer
   =========================================================================
   Builds the request-path diagram as inline SVG from breakArchData, then
   applies failure state by toggling classes on the nodes and edges that are
   already there. Nothing is re-drawn between scenarios, so the transition
   between healthy and broken animates instead of cutting.
   ========================================================================= */

(function () {
    'use strict';

    var NS = 'http://www.w3.org/2000/svg';

    var state = { projectId: null, scenarioId: null };
    var els = {};

    /* ---------------- geometry ---------------- */

    function centre(n) { return { x: n.x + n.w / 2, y: n.y + n.h / 2 }; }

    // Orthogonal router. Same row -> straight across; same column -> straight
    // down; otherwise a three-segment elbow that leaves and enters vertically,
    // which is what keeps layered diagrams readable.
    function route(a, b) {
        var ac = centre(a), bc = centre(b);
        var dx = bc.x - ac.x, dy = bc.y - ac.y;

        if (Math.abs(dy) < 8) {
            var x1 = dx > 0 ? a.x + a.w : a.x;
            var x2 = dx > 0 ? b.x : b.x + b.w;
            return { d: 'M' + x1 + ' ' + ac.y + ' L' + x2 + ' ' + ac.y,
                     mid: { x: (x1 + x2) / 2, y: ac.y } };
        }
        if (Math.abs(dx) < 8) {
            var y1 = dy > 0 ? a.y + a.h : a.y;
            var y2 = dy > 0 ? b.y : b.y + b.h;
            return { d: 'M' + ac.x + ' ' + y1 + ' L' + ac.x + ' ' + y2,
                     mid: { x: ac.x, y: (y1 + y2) / 2 } };
        }
        var ey = dy > 0 ? a.y + a.h : a.y;
        var ty = dy > 0 ? b.y : b.y + b.h;
        var my = (ey + ty) / 2;
        return { d: 'M' + ac.x + ' ' + ey + ' L' + ac.x + ' ' + my +
                    ' L' + bc.x + ' ' + my + ' L' + bc.x + ' ' + ty,
                 mid: { x: (ac.x + bc.x) / 2, y: my } };
    }

    // Fallback edges get their own shape so they read as a detour rather than
    // another link in the main path.
    function rerouteRoute(a, b, via, box) {
        var ac = centre(a), bc = centre(b);
        if (via === 'below') {
            var y = box.h - 14;
            return { d: 'M' + ac.x + ' ' + (a.y + a.h) + ' L' + ac.x + ' ' + y +
                        ' L' + bc.x + ' ' + y + ' L' + bc.x + ' ' + (b.y + b.h),
                     mid: { x: (ac.x + bc.x) / 2, y: y } };
        }
        return route(a, b);
    }

    /* ---------------- svg helpers ---------------- */

    function svgEl(tag, attrs) {
        var el = document.createElementNS(NS, tag);
        for (var k in attrs) {
            if (Object.prototype.hasOwnProperty.call(attrs, k)) {
                el.setAttribute(k, attrs[k]);
            }
        }
        return el;
    }

    /* ---------------- diagram ---------------- */

    function buildDiagram(project) {
        var vb = project.viewBox.split(/\s+/).map(Number);
        var box = { w: vb[2], h: vb[3] };
        var byId = {};
        project.nodes.forEach(function (n) { byId[n.id] = n; });

        var svg = svgEl('svg', {
            viewBox: project.viewBox,
            class: 'ba-svg',
            role: 'img',
            'aria-label': project.name + ' request path'
        });

        var defs = svgEl('defs');
        ['ba-arrow', 'ba-arrow-broken', 'ba-arrow-slow', 'ba-arrow-reroute'].forEach(function (id) {
            var m = svgEl('marker', {
                id: id, viewBox: '0 0 10 10', refX: '9', refY: '5',
                markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse'
            });
            m.appendChild(svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', class: id + '-fill' }));
            defs.appendChild(m);
        });
        svg.appendChild(defs);

        var gEdges = svgEl('g', { class: 'ba-edges' });
        var gLabels = svgEl('g', { class: 'ba-edge-labels' });
        var gNodes = svgEl('g', { class: 'ba-nodes' });

        project.edges.forEach(function (e) {
            var r = route(byId[e.from], byId[e.to]);
            var path = svgEl('path', {
                d: r.d, class: 'ba-edge', 'data-edge': e.id,
                'marker-end': 'url(#ba-arrow)'
            });
            gEdges.appendChild(path);

            // A cross that only becomes visible when this edge is severed.
            var x = svgEl('g', { class: 'ba-x', 'data-edge-x': e.id,
                                 transform: 'translate(' + r.mid.x + ' ' + r.mid.y + ')' });
            x.appendChild(svgEl('circle', { r: 9, class: 'ba-x-bg' }));
            x.appendChild(svgEl('path', { d: 'M-4 -4 L4 4 M4 -4 L-4 4', class: 'ba-x-mark' }));
            gEdges.appendChild(x);

            if (e.label) {
                var t = svgEl('text', {
                    x: r.mid.x, y: r.mid.y - 7, class: 'ba-edge-label',
                    'data-edge-label': e.id, 'text-anchor': 'middle'
                });
                t.textContent = e.label;
                gLabels.appendChild(t);
            }
        });

        // One reroute path per scenario that declares one; hidden until active.
        project.scenarios.forEach(function (s) {
            if (!s.reroute) return;
            var r = rerouteRoute(byId[s.reroute.from], byId[s.reroute.to], s.reroute.via, box);
            var p = svgEl('path', {
                d: r.d, class: 'ba-reroute', 'data-reroute': s.id,
                'marker-end': 'url(#ba-arrow-reroute)'
            });
            gEdges.appendChild(p);
            var t = svgEl('text', {
                x: r.mid.x, y: r.mid.y - 8, class: 'ba-reroute-label',
                'data-reroute-label': s.id, 'text-anchor': 'middle'
            });
            t.textContent = s.reroute.label;
            gLabels.appendChild(t);
        });

        project.nodes.forEach(function (n) {
            var g = svgEl('g', { class: 'ba-node', 'data-node': n.id });
            g.appendChild(svgEl('rect', {
                x: n.x, y: n.y, width: n.w, height: n.h, rx: 10, class: 'ba-node-box'
            }));

            var ic = svgEl('text', {
                x: n.x + 16, y: n.y + 26, class: 'ba-node-icon material-symbols-outlined'
            });
            ic.textContent = n.icon;
            g.appendChild(ic);

            var lb = svgEl('text', { x: n.x + 38, y: n.y + 26, class: 'ba-node-label' });
            lb.textContent = n.label;
            g.appendChild(lb);

            var sb = svgEl('text', { x: n.x + 16, y: n.y + 45, class: 'ba-node-sub' });
            sb.textContent = n.sub;
            g.appendChild(sb);

            // Status pip, only painted in a failure state
            g.appendChild(svgEl('circle', {
                cx: n.x + n.w - 15, cy: n.y + 16, r: 5, class: 'ba-node-pip'
            }));
            gNodes.appendChild(g);
        });

        svg.appendChild(gEdges);
        svg.appendChild(gLabels);
        svg.appendChild(gNodes);
        return svg;
    }

    /* ---------------- state application ---------------- */

    function applyScenario(project, scenario) {
        var svg = els.stage.querySelector('.ba-svg');
        clearStates_(svg);
        if (!scenario) return;

        (scenario.down || []).forEach(function (id) {
            var n = svg.querySelector('[data-node="' + id + '"]');
            if (n) n.classList.add('is-down');
        });
        (scenario.degraded || []).forEach(function (id) {
            var n = svg.querySelector('[data-node="' + id + '"]');
            if (n) n.classList.add('is-degraded');
        });
        (scenario.breaks || []).forEach(function (id) {
            var e = svg.querySelector('[data-edge="' + id + '"]');
            if (e) { e.classList.add('is-broken'); e.setAttribute('marker-end', 'url(#ba-arrow-broken)'); }
            var x = svg.querySelector('[data-edge-x="' + id + '"]');
            if (x) x.classList.add('is-on');
            var l = svg.querySelector('[data-edge-label="' + id + '"]');
            if (l) l.classList.add('is-down');
        });
        (scenario.slow || []).forEach(function (id) {
            var e = svg.querySelector('[data-edge="' + id + '"]');
            if (e) { e.classList.add('is-slow'); e.setAttribute('marker-end', 'url(#ba-arrow-slow)'); }
        });
        if (scenario.reroute) {
            var r = svg.querySelector('[data-reroute="' + scenario.id + '"]');
            if (r) r.classList.add('is-on');
            var rl = svg.querySelector('[data-reroute-label="' + scenario.id + '"]');
            if (rl) rl.classList.add('is-on');
        }
    }

    function clearStates_(svg) {
        if (!svg) return;
        Array.prototype.forEach.call(svg.querySelectorAll('.is-down, .is-degraded'), function (el) {
            el.classList.remove('is-down', 'is-degraded');
        });
        Array.prototype.forEach.call(svg.querySelectorAll('.ba-edge'), function (el) {
            el.classList.remove('is-broken', 'is-slow');
            el.setAttribute('marker-end', 'url(#ba-arrow)');
        });
        Array.prototype.forEach.call(svg.querySelectorAll('.is-on'), function (el) {
            el.classList.remove('is-on');
        });
    }

    /* ---------------- panels ---------------- */

    function renderReadout(scenario) {
        if (!scenario) {
            els.readout.hidden = true;
            els.resting.hidden = false;
            return;
        }
        els.resting.hidden = true;
        els.readout.hidden = false;
        els.impact.textContent = scenario.impact;
        els.handling.textContent = scenario.handling.text;
        els.production.textContent = scenario.production;
    }

    function renderScenarioList(project) {
        els.scenarios.innerHTML = '';
        project.scenarios.forEach(function (s) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ba-scenario ba-scenario--' + s.severity;
            btn.setAttribute('data-scenario', s.id);
            btn.setAttribute('aria-pressed', 'false');
            btn.innerHTML =
                '<span class="ba-scenario__top">' +
                    '<span class="ba-scenario__name"></span>' +
                    '<span class="ba-sev ba-sev--' + s.severity + '">' + s.severity + '</span>' +
                '</span>' +
                '<span class="ba-scenario__desc"></span>' +
                '<span class="ba-scenario__target"><span class="material-symbols-outlined">target</span></span>';
            btn.querySelector('.ba-scenario__name').textContent = s.name;
            btn.querySelector('.ba-scenario__desc').textContent = s.desc;
            btn.querySelector('.ba-scenario__target').appendChild(document.createTextNode(' ' + s.target));
            btn.addEventListener('click', function () { selectScenario(s.id); });
            els.scenarios.appendChild(btn);
        });
    }

    function markActiveScenario(id) {
        Array.prototype.forEach.call(els.scenarios.children, function (b) {
            var on = b.getAttribute('data-scenario') === id;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
    }

    /* ---------------- selection ---------------- */

    function selectProject(id) {
        var project = breakArchData[id];
        if (!project) return;
        state.projectId = id;
        state.scenarioId = null;

        Array.prototype.forEach.call(els.projects.children, function (b) {
            var on = b.getAttribute('data-project') === id;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });

        els.stage.innerHTML = '';
        els.stage.appendChild(buildDiagram(project));
        els.blurb.textContent = project.blurb;
        els.platform.textContent = project.platform;
        els.diagramName.textContent = project.name;

        renderScenarioList(project);
        markActiveScenario(null);
        renderReadout(null);
        setStatus('healthy', 'All systems nominal');
    }

    function selectScenario(id) {
        var project = breakArchData[state.projectId];
        var scenario = project.scenarios.filter(function (s) { return s.id === id; })[0];
        if (!scenario) return;
        state.scenarioId = id;
        markActiveScenario(id);
        applyScenario(project, scenario);
        renderReadout(scenario);
        setStatus(scenario.severity, scenario.name + ' — active');
        els.reset.disabled = false;
    }

    function reset() {
        var project = breakArchData[state.projectId];
        state.scenarioId = null;
        markActiveScenario(null);
        applyScenario(project, null);
        renderReadout(null);
        setStatus('healthy', 'All systems nominal');
        els.reset.disabled = true;
    }

    function setStatus(kind, text) {
        els.status.className = 'ba-status ba-status--' + kind;
        els.statusText.textContent = text;
    }

    /* ---------------- unverified-content warning ---------------- */

    // Draft handling text must not ship as fact. While anything is still
    // unverified, say so in the console — visible to the author in dev,
    // invisible to visitors.
    function warnUnverified() {
        var pending = [];
        Object.keys(breakArchData).forEach(function (pid) {
            breakArchData[pid].scenarios.forEach(function (s) {
                if (!s.handling.verified) pending.push(pid + ' → ' + s.name);
            });
        });
        if (!pending.length) return;
        console.warn(
            '[Break My Architecture] ' + pending.length + ' "Current Handling" entries are ' +
            'DRAFTED and unverified. Correct them in js/scenarios.js, then set verified: true.\n  ' +
            pending.join('\n  ')
        );
    }

    /* ---------------- init ---------------- */

    function init() {
        els.projects = document.getElementById('ba-projects');
        if (!els.projects || typeof breakArchData === 'undefined') return;

        els.stage = document.getElementById('ba-stage');
        els.scenarios = document.getElementById('ba-scenarios');
        els.blurb = document.getElementById('ba-blurb');
        els.platform = document.getElementById('ba-platform');
        els.diagramName = document.getElementById('ba-diagram-name');
        els.readout = document.getElementById('ba-readout');
        els.resting = document.getElementById('ba-resting');
        els.impact = document.getElementById('ba-impact');
        els.handling = document.getElementById('ba-handling');
        els.production = document.getElementById('ba-production');
        els.status = document.getElementById('ba-status');
        els.statusText = document.getElementById('ba-status-text');
        els.reset = document.getElementById('ba-reset');

        Object.keys(breakArchData).forEach(function (pid, i) {
            var p = breakArchData[pid];
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ba-project';
            btn.setAttribute('data-project', pid);
            btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
            btn.innerHTML = '<span class="ba-project__name"></span><span class="ba-project__plat"></span>';
            btn.querySelector('.ba-project__name').textContent = p.name;
            btn.querySelector('.ba-project__plat').textContent = p.platform;
            btn.addEventListener('click', function () { selectProject(pid); });
            els.projects.appendChild(btn);
        });

        els.reset.addEventListener('click', reset);
        els.reset.disabled = true;

        selectProject(Object.keys(breakArchData)[0]);
        warnUnverified();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
