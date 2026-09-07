/* CloudShell — a simulated, read-only terminal over the lab's own data.
 *
 * Nothing here executes. Every command is a lookup in a fixed table, and the
 * filesystem is generated from portfolioData at boot, so it can never drift
 * from the site content. There is no eval, no network, no storage access.
 */
(function () {
    'use strict';

    var USER = 'akanksha';
    var HOST = 'cloud-lab';
    var HOME = '/lab';
    var HISTORY_MAX = 50;

    var data = portfolioData;

    /* ---------- Virtual filesystem, derived from the portfolio data ---------- */

    function file(lines) { return { type: 'file', lines: lines }; }
    function dir(children) { return { type: 'dir', children: children }; }

    function pad(str, len) {
        var s = String(str);
        while (s.length < len) s += ' ';
        return s;
    }

    function buildFs() {
        var p = data.engineerProfile;

        var about = {
            'profile.txt': file([
                'Name      : ' + p.name,
                'Role      : ' + p.role,
                'Region    : ca-central-1 (Halifax, NS)',
                '',
                p.tagline
            ]),
            'education.txt': file(p.education.map(function (e) {
                return '- ' + e.degree + '\n    ' + e.university + (e.score ? '  —  ' + e.score : '');
            })),
            'experience.txt': file(p.experience.map(function (e) {
                return '- ' + e.company + '  (' + e.duration + ')\n    ' +
                    String(e.description).split('\n').join('\n    ');
            })),
            'achievements.txt': file(p.achievements.map(function (a) {
                return '- ' + a.name + (a.occurrences > 1 ? ' x' + a.occurrences : '') +
                    '\n    ' + a.type + (a.organization ? ' — ' + a.organization : '') +
                    (a.detail ? '\n    ' + a.detail : '');
            })),
            'focus.txt': file(p.focus.map(function (f) {
                return '- ' + f.label + '\n    ' + f.detail;
            })),
            'contact.txt': file(p.connect.map(function (c) {
                return pad(c.name, 10) + ' ' + c.url;
            }).concat(['', 'Run `lab contact` to open the Connect section.']))
        };

        var systems = {};
        data.projects.forEach(function (proj) {
            var files = {
                'README.txt': file([
                    proj.name,
                    new Array(proj.name.length + 1).join('='),
                    '',
                    proj.tagline,
                    '',
                    proj.summary
                ]),
                'metadata.txt': file([
                    'resource-id   : ' + proj.resourceId,
                    'platform      : ' + proj.platform,
                    'status        : ' + proj.status,
                    'last-deployed : ' + (proj.lastDeployed || 'n/a — archived'),
                    'team-project  : ' + (proj.teamProject ? 'yes' : 'no')
                ]),
                'tech-stack.txt': file(proj.techStack.map(function (t) {
                    return pad(t.category, 14) + ' ' + t.technologies.join(', ');
                })),
                'features.txt': file(proj.features.map(function (f) { return '- ' + f; }))
            };
            if (proj.links && Object.keys(proj.links).length) {
                files['links.txt'] = file(Object.keys(proj.links).map(function (k) {
                    return pad(k, 8) + ' ' + proj.links[k];
                }));
            }
            if (proj.behindTheBuild && proj.behindTheBuild.length) {
                files['lessons.txt'] = file(proj.behindTheBuild.map(function (b) {
                    return '- ' + b.title + '\n    ' + b.description;
                }));
            }
            systems[proj.id] = dir(files);
        });

        var t = data.telemetry;
        return dir({
            'about': dir(about),
            'systems': dir(systems),
            'telemetry.txt': file([
                'compute-usage  ' + t.computeUsage + '%',
                'storage-usage  ' + t.storageUsage + '%',
                'network-usage  ' + t.networkUsage + '%'
            ]),
            'README.txt': file([
                'Cloud Engineering Lab — simulated shell',
                '',
                'This is a read-only view of the lab. Browse with ls / cd / cat,',
                'or jump straight into the console with the `lab` commands.',
                'Type `help` for the full list.'
            ])
        });
    }

    var FS = null;

    /* ---------- Path handling ---------- */

    // Resolves a user path against cwd. Segments that would climb above the
    // root are simply dropped, so there is nothing above /lab to reach.
    function resolvePath(cwd, input) {
        var parts;
        if (!input) {
            return cwd.slice();           // no argument means "here"
        } else if (input === '~') {
            parts = [];
        } else if (input.charAt(0) === '/' || input.indexOf('~/') === 0) {
            parts = input.replace(/^~/, '').split('/');
        } else {
            parts = cwd.concat(input.split('/'));
        }
        var out = [];
        for (var i = 0; i < parts.length; i++) {
            var seg = parts[i];
            if (seg === '' || seg === '.') continue;
            if (seg === '..') { out.pop(); continue; }
            out.push(seg);
        }
        return out;
    }

    function nodeAt(parts) {
        var node = FS;
        for (var i = 0; i < parts.length; i++) {
            if (!node || node.type !== 'dir') return null;
            if (!Object.prototype.hasOwnProperty.call(node.children, parts[i])) return null;
            node = node.children[parts[i]];
        }
        return node || null;
    }

    function displayPath(parts) {
        return parts.length ? '~/' + parts.join('/') : '~';
    }

    /* ---------- Terminal surface ---------- */

    var el = {};
    var cwd = [];
    var history = [];
    var historyIdx = -1;
    var draft = '';
    var lastFocus = null;

    function print(text, cls) {
        var line = document.createElement('div');
        line.className = 'cs-line' + (cls ? ' ' + cls : '');
        line.textContent = text;
        el.output.appendChild(line);
    }

    function printBlank() { print(''); }

    function printEcho(cmd) {
        var line = document.createElement('div');
        line.className = 'cs-line cs-line--echo';
        var pr = document.createElement('span');
        pr.className = 'cs-prompt';
        pr.textContent = promptText();
        var txt = document.createElement('span');
        txt.textContent = cmd;
        line.appendChild(pr);
        line.appendChild(txt);
        el.output.appendChild(line);
    }

    function promptText() {
        return USER + '@' + HOST + ':' + displayPath(cwd) + '$ ';
    }

    function syncPrompt() { el.prompt.textContent = promptText(); }

    function scrollToEnd() { el.body.scrollTop = el.body.scrollHeight; }

    /* ---------- Commands ---------- */

    function navigate(hash, note) {
        print(note, 'cs-ok');
        setTimeout(function () {
            window.location.hash = hash;
            closeShell();
        }, 420);
    }

    // A miss is usually a visitor reading a name out of an `ls` they ran on a
    // directory they never entered. Look one level down and name the real path.
    function suggest(name) {
        if (!name || name.indexOf('/') !== -1) return null;
        var bases = [{ parts: cwd, prefix: '' }];
        if (cwd.length) bases.push({ parts: [], prefix: '~/' });
        for (var b = 0; b < bases.length; b++) {
            var here = nodeAt(bases[b].parts);
            if (!here || here.type !== 'dir') continue;
            var names = Object.keys(here.children);
            for (var i = 0; i < names.length; i++) {
                var child = here.children[names[i]];
                if (child.type !== 'dir') continue;
                if (Object.prototype.hasOwnProperty.call(child.children, name)) {
                    return bases[b].prefix + names[i] + '/' + name;
                }
            }
        }
        return null;
    }

    function printMiss(cmd, target) {
        print(cmd + ': ' + target + ': No such file or directory', 'cs-err');
        var hint = suggest(target);
        if (hint) print('Did you mean `' + cmd + ' ' + hint + '`?', 'cs-muted');
    }

    function listProjectIds() {
        data.projects.forEach(function (p) { print('  ' + p.id, 'cs-dir'); });
    }

    var COMMANDS = {
        help: {
            usage: 'help',
            about: 'List every command this shell supports',
            run: function () { renderHelp(); }
        },
        ls: {
            usage: 'ls [path]',
            about: 'List the contents of a directory',
            run: function (args) {
                var target = args[0] || '';
                var node = nodeAt(resolvePath(cwd, target));
                if (!node) return printMiss('ls', target);
                if (node.type === 'file') return print(target);
                var names = Object.keys(node.children);
                if (!names.length) return print('(empty)', 'cs-muted');
                names.sort().forEach(function (n) {
                    var isDir = node.children[n].type === 'dir';
                    print(isDir ? n + '/' : n, isDir ? 'cs-dir' : '');
                });
            }
        },
        cd: {
            usage: 'cd <path>',
            about: 'Move into a directory (.. goes up, / returns to the root)',
            run: function (args) {
                if (!args.length) { cwd = []; return syncPrompt(); }
                var parts = resolvePath(cwd, args[0]);
                var node = nodeAt(parts);
                if (!node) return printMiss('cd', args[0]);
                if (node.type !== 'dir') return print('cd: ' + args[0] + ': Not a directory', 'cs-err');
                cwd = parts;
                syncPrompt();
            }
        },
        pwd: {
            usage: 'pwd',
            about: 'Print the current directory',
            run: function () { print(HOME + (cwd.length ? '/' + cwd.join('/') : '')); }
        },
        cat: {
            usage: 'cat <file>',
            about: 'Print the contents of a file',
            run: function (args) {
                if (!args.length) return print('cat: missing operand. Try `cat README.txt`.', 'cs-err');
                var node = nodeAt(resolvePath(cwd, args[0]));
                if (!node) return printMiss('cat', args[0]);
                if (node.type === 'dir') return print('cat: ' + args[0] + ': Is a directory', 'cs-err');
                node.lines.forEach(function (l) { print(l); });
            }
        },
        tree: {
            usage: 'tree',
            about: 'Show the lab layout at a glance',
            run: function () {
                print(HOME);
                var top = Object.keys(FS.children).sort();
                top.forEach(function (name, i) {
                    var node = FS.children[name];
                    var last = i === top.length - 1;
                    var isDir = node.type === 'dir';
                    print((last ? '└── ' : '├── ') + name + (isDir ? '/' : ''),
                          isDir ? 'cs-dir' : '');
                    if (!isDir) return;
                    var kids = Object.keys(node.children).sort();
                    kids.forEach(function (k, j) {
                        var kLast = j === kids.length - 1;
                        print((last ? '    ' : '│   ') +
                              (kLast ? '└── ' : '├── ') + k +
                              (node.children[k].type === 'dir' ? '/' : ''));
                    });
                });
            }
        },
        whoami: {
            usage: 'whoami',
            about: 'Show who is running this lab',
            run: function () {
                var p = data.engineerProfile;
                print(USER);
                print(p.name + ' — ' + p.role, 'cs-muted');
                print(p.tagline, 'cs-muted');
            }
        },
        lab: {
            usage: 'lab <about|systems|inspect ID|break|contact>',
            about: 'Jump to a section of the console',
            run: function (args) {
                var sub = (args[0] || '').toLowerCase();
                var target = args[1];
                if (sub === 'about') return navigate('#profile', 'Opening About Me…');
                if (sub === 'systems') return navigate('#systems', 'Opening Systems / Projects…');
                if (sub === 'break') return navigate('#break-my-architecture', 'Opening Break My Architecture…');
                if (sub === 'contact') return navigate('#profile/connect', 'Opening the Connect section…');
                if (sub === 'overview') return navigate('#overview', 'Opening Lab Overview…');
                if (sub === 'inspect') {
                    if (!target) {
                        print('lab inspect: which system? Available ids:', 'cs-err');
                        return listProjectIds();
                    }
                    var match = data.projects.filter(function (p) { return p.id === target; })[0];
                    if (!match) {
                        print('lab inspect: unknown system "' + target + '". Available ids:', 'cs-err');
                        return listProjectIds();
                    }
                    return navigate('#project/' + match.id, 'Opening ' + match.name + '…');
                }
                print('lab: unknown subcommand' + (sub ? ' "' + sub + '"' : '') + '.', 'cs-err');
                print('Try: lab about · lab systems · lab inspect <id> · lab break · lab contact', 'cs-muted');
            }
        },
        clear: {
            usage: 'clear',
            about: 'Clear the screen',
            run: function () { el.output.innerHTML = ''; }
        },
        exit: {
            usage: 'exit',
            about: 'Close the shell',
            run: function () { print('logout', 'cs-muted'); setTimeout(closeShell, 220); }
        }
    };

    // Deliberate answers for things people reflexively try. None are real commands.
    var QUIPS = {
        sudo: 'Nice try. ' + USER + ' is not in the sudoers file. This incident has been logged.',
        rm: 'Deletion is disabled in here. If you want to break something, run `lab break`.',
        mv: 'This shell is read-only. Nothing can be moved or renamed.',
        cp: 'This shell is read-only. Nothing can be copied.',
        mkdir: 'This shell is read-only. The layout is generated from the site data.',
        vim: 'No editor in this shell — and no, I will not help you exit it.',
        vi: 'No editor in this shell — and no, I will not help you exit it.',
        nano: 'No editor in this shell. Everything here is read-only.',
        emacs: 'No editor in this shell. Everything here is read-only.',
        ssh: 'This shell has no network. It only ever reads the lab’s own data.',
        curl: 'This shell has no network. It only ever reads the lab’s own data.',
        wget: 'This shell has no network. It only ever reads the lab’s own data.',
        ping: 'This shell has no network. It only ever reads the lab’s own data.',
        npm: 'No package manager here — the lab ships as static files on purpose.',
        git: 'No repo mounted. Source links live in each project’s links.txt.',
        grep: 'No grep in this shell. Browse with `ls`, `cat` and `tree` instead.',
        find: 'No find in this shell. `tree` shows the whole layout at once.',
        ps: 'No processes — this shell is a simulation, not a machine.',
        top: 'No processes — but `cat telemetry.txt` has the lab’s usage numbers.',
        man: 'No man pages. `help` is the entire manual here.',
        echo: 'No echo in this shell. `help` lists everything it does support.',
        history: 'Not stored. Use the up arrow to walk back through this session.'
    };

    function renderHelp() {
        print('Cloud Lab shell — supported commands', 'cs-head');
        Object.keys(COMMANDS).forEach(function (name) {
            var c = COMMANDS[name];
            var line = document.createElement('div');
            line.className = 'cs-line cs-help';
            var u = document.createElement('span');
            u.className = 'cs-help__usage';
            u.textContent = c.usage;
            var d = document.createElement('span');
            d.className = 'cs-help__about';
            d.textContent = c.about;
            line.appendChild(u);
            line.appendChild(d);
            el.output.appendChild(line);
        });
    }

    function unknown(name) {
        if (Object.prototype.hasOwnProperty.call(QUIPS, name)) {
            print(QUIPS[name], 'cs-muted');
            return;
        }
        print('Command not found: ' + name, 'cs-err');
        print('This command isn’t available in the Cloud Lab. Type `help` to see what is —', 'cs-muted');
        print('for anything specific, run `lab contact` to reach the engineer directly.', 'cs-muted');
    }

    function execute(raw) {
        var input = raw.trim();
        printEcho(raw);
        if (!input) { scrollToEnd(); return; }

        history.unshift(input);
        if (history.length > HISTORY_MAX) history.pop();
        historyIdx = -1;
        draft = '';

        var tokens = input.split(/\s+/);
        var name = tokens[0].toLowerCase();
        var args = tokens.slice(1);

        if (Object.prototype.hasOwnProperty.call(COMMANDS, name)) {
            COMMANDS[name].run(args);
        } else {
            unknown(name);
        }
        scrollToEnd();
    }

    /* ---------- Tab completion ---------- */

    function completions(input) {
        var tokens = input.split(/\s+/);
        if (tokens.length <= 1) {
            return Object.keys(COMMANDS).filter(function (c) { return c.indexOf(tokens[0]) === 0; });
        }
        var name = tokens[0].toLowerCase();
        var frag = tokens[tokens.length - 1];

        if (name === 'lab') {
            if (tokens.length === 2) {
                return ['about', 'systems', 'inspect', 'break', 'contact', 'overview']
                    .filter(function (s) { return s.indexOf(frag) === 0; });
            }
            if (tokens[1] === 'inspect') {
                return data.projects.map(function (p) { return p.id; })
                    .filter(function (s) { return s.indexOf(frag) === 0; });
            }
            return [];
        }
        if (name === 'cd' || name === 'ls' || name === 'cat') {
            var slash = frag.lastIndexOf('/');
            var base = slash === -1 ? '' : frag.slice(0, slash + 1);
            var stub = slash === -1 ? frag : frag.slice(slash + 1);
            var node = nodeAt(resolvePath(cwd, base));
            if (!node || node.type !== 'dir') return [];
            return Object.keys(node.children).filter(function (n) {
                if (n.indexOf(stub) !== 0) return false;
                return name !== 'cd' || node.children[n].type === 'dir';
            }).map(function (n) {
                return base + n + (node.children[n].type === 'dir' ? '/' : '');
            });
        }
        return [];
    }

    function applyCompletion() {
        var value = el.input.value;
        var matches = completions(value);
        if (!matches.length) return;
        var tokens = value.split(/\s+/);
        if (matches.length === 1) {
            tokens[tokens.length - 1] = matches[0];
            el.input.value = tokens.join(' ') + (matches[0].slice(-1) === '/' ? '' : ' ');
            return;
        }
        printEcho(value);
        matches.forEach(function (m) { print('  ' + m, 'cs-dir'); });
        scrollToEnd();
    }

    /* ---------- Open / close ---------- */

    function isOpen() { return !el.panel.hidden; }

    function openShell() {
        if (isOpen()) { el.input.focus(); return; }
        lastFocus = document.activeElement;
        el.panel.hidden = false;
        // Next frame, so the slide-up transition actually runs.
        requestAnimationFrame(function () { el.panel.classList.add('is-open'); });
        el.input.focus();
        scrollToEnd();
    }

    function closeShell() {
        if (!isOpen()) return;
        el.panel.classList.remove('is-open');
        setTimeout(function () { el.panel.hidden = true; }, 240);
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    }

    /* ---------- Boot ---------- */

    function greet() {
        print('Cloud Engineering Lab — simulated shell', 'cs-head');
        print('Read-only. Nothing here runs against a real machine.', 'cs-muted');
        printBlank();
        renderHelp();
        printBlank();
        print('Tab completes paths, ↑/↓ walks your history, Esc closes.', 'cs-muted');
    }

    function buildChips() {
        var picks = ['help', 'ls', 'cd systems', 'tree', 'cat README.txt', 'pwd', 'whoami',
                     'lab systems', 'lab about', 'lab contact', 'clear'];
        picks.forEach(function (cmd) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'cs-chip';
            b.textContent = cmd;
            b.addEventListener('click', function () {
                el.input.value = cmd;
                el.input.focus();
            });
            el.chips.appendChild(b);
        });
    }

    /* ---------- Overview promo: type sample commands on a loop ---------- */

    var PROMO_LINES = [
        'ls systems',
        'cat about/profile.txt',
        'cd systems/dalbot',
        'lab inspect pathmentor',
        'whoami'
    ];

    function startPromoTyping() {
        var out = document.getElementById('shell-promo-typed');
        if (!out) return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            out.textContent = PROMO_LINES[0];
            return;
        }

        var visible = true;
        if (typeof IntersectionObserver === 'function') {
            new IntersectionObserver(function (entries) {
                visible = entries[0].isIntersecting;
            }).observe(out);
        }

        var line = 0, chars = 0, erasing = false;

        function tick() {
            var delay = 78;
            if (!visible || isOpen()) {
                return setTimeout(tick, 400);
            }
            var text = PROMO_LINES[line];
            if (!erasing) {
                chars++;
                out.textContent = text.slice(0, chars);
                if (chars >= text.length) { erasing = true; delay = 1500; }
            } else {
                chars -= 2;
                if (chars <= 0) {
                    chars = 0;
                    erasing = false;
                    line = (line + 1) % PROMO_LINES.length;
                    delay = 320;
                }
                out.textContent = text.slice(0, chars);
                if (delay === 78) delay = 34;
            }
            setTimeout(tick, delay);
        }
        tick();
    }

    function init() {
        el.panel = document.getElementById('cloudshell');
        if (!el.panel) return;
        el.body = el.panel.querySelector('.cs-body');
        el.output = el.panel.querySelector('.cs-output');
        el.input = el.panel.querySelector('.cs-input');
        el.prompt = el.panel.querySelector('.cs-inputline .cs-prompt');
        el.chips = el.panel.querySelector('.cs-chips');

        FS = buildFs();
        syncPrompt();
        greet();
        buildChips();

        el.input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                var v = el.input.value;
                el.input.value = '';
                execute(v);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                applyCompletion();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (!history.length) return;
                if (historyIdx === -1) draft = el.input.value;
                historyIdx = Math.min(historyIdx + 1, history.length - 1);
                el.input.value = history[historyIdx];
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIdx <= 0) { historyIdx = -1; el.input.value = draft; return; }
                historyIdx--;
                el.input.value = history[historyIdx];
            } else if (e.key === 'l' && e.ctrlKey) {
                e.preventDefault();
                el.output.innerHTML = '';
            }
        });

        // Clicking the scrollback returns the caret to the input, but not while
        // the visitor is selecting text to copy.
        el.body.addEventListener('mouseup', function () {
            if (!String(window.getSelection())) el.input.focus();
        });

        el.panel.querySelector('.cs-close').addEventListener('click', closeShell);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isOpen()) closeShell();
        });

        var launchers = document.querySelectorAll('[data-cloudshell-open]');
        Array.prototype.forEach.call(launchers, function (btn) {
            btn.addEventListener('click', openShell);
        });

        startPromoTyping();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
