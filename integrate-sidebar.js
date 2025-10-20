const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const srcDir = path.join(projectRoot, 'grocery-management-system', 'src');
const componentsDir = path.join(srcDir, 'components');
const sidebarPath = path.join(componentsDir, 'sidebar.html');
const stylesPath = path.join(srcDir, 'styles.css');
const SIDEBAR_MARKER = '/* SIDEBAR-STYLES-INJECTED */';

const sidebarHTML = `<!-- components/sidebar.html -->
<aside class="sidebar" aria-label="Main navigation">
  <div class="sidebar-logo">
    <span>🛒</span>
    <h2>GroceryMS</h2>
  </div>
  <nav class="sidebar-nav" role="navigation">
    <a href="home.html">Home</a>
    <a href="index.html">Inventory</a>
    <a href="about.html">About</a>
    <a href="contact.html">Contact</a>
    <a href="login.html">Login</a>
    <a href="signup.html">Signup</a>
    <a href="account.html">Account</a>
    <a class="todo-cta" href="todolist/index.html">Todo List</a>
  </nav>
</aside>
`;

const sidebarCSS = `
${SIDEBAR_MARKER}
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 210px;
  background: linear-gradient(180deg,#43e97b,#38f9d7);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 0.8rem;
  padding: 1.2rem;
  box-shadow: 2px 0 12px rgba(56,142,60,0.10);
  z-index: 1000;
}
.sidebar-logo { display:flex; align-items:center; gap:0.6rem; margin-bottom:0.4rem; }
.sidebar-logo span{ font-size:1.5rem; }
.sidebar-logo h2{ font-size:1rem; margin:0; font-weight:700; }

.sidebar-nav { display:flex; flex-direction:column; width:100%; gap:0.4rem; }
.sidebar-nav a {
  color: white;
  text-decoration: none;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  font-weight:600;
  display:block;
  transition: background .18s, color .18s, transform .12s;
}
.sidebar-nav a:hover,
.sidebar-nav a:focus {
  background: rgba(255,255,255,0.92);
  color: #2e7d32;
  transform: translateX(4px);
  outline: none;
}
.sidebar-nav a.active {
  background: #e8f5e9;
  color: #388e3c;
  box-shadow: inset 3px 0 0 rgba(56,142,60,0.12);
}

/* prominent todo CTA */
.todo-cta{
  margin-top: 0.6rem;
  background: #fff;
  color: #2e7d32;
  padding: 0.55rem 0.8rem;
  border-radius: 8px;
  font-weight:700;
  text-align:center;
  text-decoration:none;
  border: 2px solid rgba(56,142,60,0.12);
}
.todo-cta:hover { background:#f1fff7; color:#2d7a4f; transform: translateX(4px); }

/* push page content to the right on wide screens */
@media (min-width: 701px) {
  body { margin-left: 230px; }
}
@media (max-width:700px) {
  .sidebar { position: static; width:100%; height:auto; flex-direction:row; align-items:center; padding:0.6rem; gap:0.6rem; }
  .sidebar-logo { margin-right: 0.6rem; }
  .sidebar-nav { flex-direction:row; gap:0.4rem; overflow-x:auto; }
  body { margin-left:0; padding-top:12px; }
}
`;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function walk(dir) {
  const results = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      results.push(...walk(p));
    } else if (stat.isFile() && p.toLowerCase().endsWith('.html')) {
      results.push(p);
    }
  }
  return results;
}

function backup(filePath) {
  const bak = filePath + '.bak.' + Date.now();
  fs.writeFileSync(bak, fs.readFileSync(filePath, 'utf8'), 'utf8');
}

function removeExistingSidebar(html) {
  return html.replace(/<aside[^>]*class=["'][^"']*sidebar[^"']*['"][\\s\\S]*?<\\/aside>/ig, '');
}

function ensureStylesLink(html, relPathFromHtmlToStyles) {
  // check for styles.css link
  if (/href=["'][^"']*styles\.css["']/i.test(html)) return html;
  const linkTag = `<link rel="stylesheet" href="${relPathFromHtmlToStyles}styles.css">`;
  if (</head>/.test(html)) {
    return html.replace(/<\/head>/i, `  ${linkTag}\n</head>`);
  }
  // fallback: insert at top
  return linkTag + '\n' + html;
}

function injectSidebarLoader(html, relPathToComponent) {
  const loader = `
  <div id="sidebar-root"></div>
  <script>
  (function(){
    const rel = "${relPathToComponent.replace(/"/g,'\\"')}";
    fetch(rel).then(r => r.text()).then(html => {
      const root = document.getElementById('sidebar-root');
      if (root) root.innerHTML = html;
      // set active link
      const links = document.querySelectorAll('.sidebar-nav a');
      const current = window.location.pathname.split('/').pop() || '';
      links.forEach(a => {
        const href = (a.getAttribute('href') || '').split('/').pop();
        if (href === current) a.classList.add('active');
        a.addEventListener('click', () => { links.forEach(l=>l.classList.remove('active')); a.classList.add('active'); });
      });
    }).catch(e => {
      console.warn('Sidebar load failed', e);
    });
  })();
  </script>
  `;
  // if body tag exists, insert after opening body tag
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body[^>]*>/i, match => match + '\n' + loader + '\n');
  }
  // otherwise prepend
  return loader + html;
}

function relPath(from, to) {
  let r = path.relative(path.dirname(from), to).replace(/\\/g, '/');
  if (!r.startsWith('.')) r = './' + r;
  return r;
}

function processHtml(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  const original = html;
  // backup
  backup(filePath);

  // remove existing sidebar <aside class="sidebar"> blocks
  html = removeExistingSidebar(html);

  // ensure styles link (relative path from this html to src/styles.css)
  const relToStyles = relPath(filePath, stylesPath).replace(/styles\.css$/,''); // folder path or './'
  html = ensureStylesLink(html, relToStyles);

  // ensure components directory exists and component file will be at components/sidebar.html relative to src
  const compAbs = sidebarPath;
  const relToComponent = relPath(filePath, compAbs);

  // inject loader/placeholder
  html = injectSidebarLoader(html, relToComponent);

  fs.writeFileSync(filePath, html, 'utf8');
  console.log('Updated:', path.relative(srcDir, filePath));
}

function main() {
  ensureDir(componentsDir);
  // write sidebar component (overwrite)
  fs.writeFileSync(sidebarPath, sidebarHTML, 'utf8');
  console.log('Wrote component:', path.relative(srcDir, path.relative(srcDir, sidebarPath)));

  // append sidebar CSS to styles.css if marker not present
  if (!fs.existsSync(stylesPath)) {
    fs.writeFileSync(stylesPath, sidebarCSS, 'utf8');
    console.log('Created styles.css and injected sidebar styles.');
  } else {
    const styles = fs.readFileSync(stylesPath, 'utf8');
    if (!styles.includes(SIDEBAR_MARKER)) {
      fs.appendFileSync(stylesPath, '\n\n' + sidebarCSS, 'utf8');
      console.log('Appended sidebar styles to styles.css');
    } else {
      console.log('styles.css already contains sidebar styles; no change.');
    }
  }

  // walk all html files under src and process
  const htmlFiles = walk(srcDir);
  htmlFiles.forEach(processHtml);

  console.log('Integration complete. Backups created with .bak.<timestamp>');
}

main();