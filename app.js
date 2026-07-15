/* =====================================================
   ImageCDN Hub — Application Logic (app.js)
   ===================================================== */

'use strict';

/* ── Site Registry ──────────────────────────────────── */
const SITES = [
  { id: 'all',          label: '🌐 All Sites',    folder: 'images'               },
  { id: 'site-shared',  label: '🔗 Shared',        folder: 'images/shared'        },
  { id: 'site-1',       label: '🛍️ Decorepublic',  folder: 'images/decorepublic'  },
  { id: 'site-2',       label: '🏪 Shopify Store', folder: 'images/shopify-store' },
];

/* ── Image Registry ─────────────────────────────────── */
const IMAGES = [
  {
    id: 'hero-cyberpunk', name: 'Cyberpunk City',
    filename: 'hero-cyberpunk.png', path: 'images/shared/hero-cyberpunk.png',
    site: 'site-shared', type: 'background',
    tags: ['background', 'neon', 'city', 'night', 'cyberpunk'],
  },
  {
    id: 'abstract-glass', name: 'Abstract Glassmorphism',
    filename: 'abstract-glass.png', path: 'images/shared/abstract-glass.png',
    site: 'site-shared', type: 'background',
    tags: ['background', 'glass', 'abstract', '3d', 'purple'],
  },
  {
    id: 'workspace-minimal', name: 'Minimal Workspace',
    filename: 'workspace-minimal.png', path: 'images/decorepublic/workspace-minimal.png',
    site: 'site-1', type: 'workspace',
    tags: ['workspace', 'minimal', 'desk', 'productivity'],
  },
  {
    id: 'avatar-robot', name: 'AI Robot Avatar',
    filename: 'avatar-robot.png', path: 'images/shopify-store/avatar-robot.png',
    site: 'site-2', type: 'avatar',
    tags: ['avatar', 'robot', 'ai', 'cyberpunk', 'neon'],
  },
  {
    id: 'space-nebula', name: 'Cosmic Nebula',
    filename: 'space-nebula.png', path: 'images/shopify-store/space-nebula.png',
    site: 'site-2', type: 'background',
    tags: ['background', 'space', 'galaxy', 'stars', 'nebula'],
  },
];

/* ── CDN Platform URL Builders ──────────────────────── */
const CDN_PLATFORMS = {
  jsdelivr:   ({ user, repo, branch }) => `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/`,
  statically: ({ user, repo, branch }) => `https://cdn.statically.io/gh/${user}/${repo}/${branch}/`,
  ghpages:    ({ user, repo })          => `https://${user}.github.io/${repo}/`,
  raw:        ({ user, repo, branch }) => `https://raw.githubusercontent.com/${user}/${repo}/${branch}/`,
};

/* ── App State ──────────────────────────────────────── */
const state = {
  user:          'your-username',
  repo:          'images-deliver',
  branch:        'main',
  platform:      'jsdelivr',
  activeSite:    'all',
  filter:        'all',
  search:        '',
  viewMode:      'grid',
  activeImage:   null,
  activeSnippet: 'html',
};

/* ── CDN Helpers ────────────────────────────────────── */
function cdnBase() {
  const fn = CDN_PLATFORMS[state.platform] || CDN_PLATFORMS.jsdelivr;
  return fn({ user: state.user, repo: state.repo, branch: state.branch });
}
function cdnUrl(img)    { return cdnBase() + img.path; }
function localThumb(img) { return 'images/' + img.filename; }
function toPascal(str)  { return str.split(/[-_]/).map(w => w[0].toUpperCase() + w.slice(1)).join(''); }
function siteLabel(id)  { const s = SITES.find(x => x.id === id); return s ? s.label : id; }

/* ── Snippet Generators ─────────────────────────────── */
const SNIPPETS = {
  html:     img => `<img\n  src="${cdnUrl(img)}"\n  alt="${img.name}"\n  loading="lazy"\n  width="1024"\n  height="1024"\n/>`,
  css:      img => `.element {\n  background-image: url("${cdnUrl(img)}");\n  background-size: cover;\n  background-position: center;\n  background-repeat: no-repeat;\n}`,
  react:    img => `const CDN_BASE = "${cdnBase()}";\n\nexport default function ${toPascal(img.id)}() {\n  return (\n    <img\n      src={\`\${CDN_BASE}${img.path}\`}\n      alt="${img.name}"\n      loading="lazy"\n    />\n  );\n}`,
  nextjs:   img => `import Image from 'next/image';\n\nexport default function ${toPascal(img.id)}() {\n  return (\n    <Image\n      src="${cdnUrl(img)}"\n      alt="${img.name}"\n      width={1024}\n      height={1024}\n      priority\n    />\n  );\n}`,
  markdown: img => `![${img.name}](${cdnUrl(img)})`,
  raw:      img => cdnUrl(img),
};

/* ── DOM Shortcut ───────────────────────────────────── */
const $ = id => document.getElementById(id);

/* ── Section Switcher ───────────────────────────────── */
function switchSection(name) {
  const MAP = {
    gallery: { sec: 'gallerySection', nav: 'navGallery' },
    upload:  { sec: 'uploadSection',  nav: 'navUpload'  },
    guide:   { sec: 'guideSection',   nav: 'navGuide'   },
  };
  Object.entries(MAP).forEach(([key, { sec, nav }]) => {
    const active = key === name;
    const secEl  = $(sec);
    const navEl  = $(nav);
    if (secEl) secEl.style.display = active ? '' : 'none';
    if (navEl) { navEl.classList.toggle('active', active); navEl.setAttribute('aria-selected', active); }
  });
  // Hide search/filter when not in gallery
  const isGallery = name === 'gallery';
  [$('filterTabsGroup'), $('galleryControls')].forEach(el => {
    if (el) el.style.display = isGallery ? '' : 'none';
  });
}

/* ── Gallery ────────────────────────────────────────── */
function filteredImages() {
  return IMAGES.filter(img => {
    const matchSite   = state.activeSite === 'all' || img.site === state.activeSite;
    const matchFilter = state.filter === 'all' || img.type === state.filter;
    const q           = state.search;
    const matchSearch = !q || img.name.toLowerCase().includes(q)
      || img.tags.some(t => t.includes(q))
      || img.filename.toLowerCase().includes(q)
      || img.path.toLowerCase().includes(q);
    return matchSite && matchFilter && matchSearch;
  });
}

function buildCard(img, index) {
  const card = document.createElement('div');
  card.className = 'image-card';
  card.style.animationDelay = `${index * 0.06}s`;
  card.setAttribute('role', 'listitem');
  card.innerHTML = `
    <div class="card-thumb">
      <img src="${localThumb(img)}" alt="${img.name}" loading="lazy" />
      <div class="card-overlay">
        <button class="overlay-btn primary open-snippet-btn" data-id="${img.id}">
          &lt;/&gt; Get Snippets
        </button>
        <button class="overlay-btn copy-url-btn" data-url="${cdnUrl(img)}">
          🔗 Copy URL
        </button>
      </div>
      <span class="card-type-badge">${img.type}</span>
    </div>
    <div class="card-body">
      <div class="card-name">${img.name}</div>
      <div class="card-path" title="${img.path}">${img.path}</div>
      <div class="card-meta">
        <span class="card-site-badge">${siteLabel(img.site)}</span>
        <button class="copy-all-btn" data-id="${img.id}">📋 Snippets</button>
      </div>
    </div>`;
  return card;
}

function renderGallery() {
  const grid = $('imageGrid');
  const imgs  = filteredImages();
  grid.innerHTML = '';
  if (!imgs.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-muted)"><div style="font-size:3rem;margin-bottom:12px">🔍</div><div>No images match your filter.</div></div>`;
    return;
  }
  imgs.forEach((img, i) => grid.appendChild(buildCard(img, i)));
  $('statImages').textContent = imgs.length;
}

/* ── URL Preview ────────────────────────────────────── */
function updateUrlPreview() {
  const site   = SITES.find(s => s.id === state.activeSite);
  const folder = (site && site.id !== 'all') ? site.folder + '/' : 'images/';
  $('urlPreviewText').textContent = cdnBase() + folder;

  const hint = $('sitePathHint');
  if (hint) {
    if (site && site.id !== 'all') {
      hint.textContent   = 'Folder: ' + site.folder + '/';
      hint.style.display = 'block';
    } else {
      hint.style.display = 'none';
    }
  }
  updateUploadPathPreview();
}

/* ── Site Tabs (sidebar) ────────────────────────────── */
function renderSiteTabs() {
  const container = $('siteTabsContainer');
  if (!container) return;
  container.innerHTML = '';
  SITES.forEach(site => {
    const btn = document.createElement('button');
    btn.className = 'site-tab' + (state.activeSite === site.id ? ' active' : '');
    btn.dataset.siteId = site.id;
    btn.textContent = site.label;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', state.activeSite === site.id);
    container.appendChild(btn);
  });
}

/* ── Snippet Modal ──────────────────────────────────── */
function openModal(imgId) {
  const img = IMAGES.find(i => i.id === imgId);
  if (!img) return;
  state.activeImage   = img;
  state.activeSnippet = 'html';
  $('modalImg').src         = localThumb(img);
  $('modalImg').alt         = img.name;
  $('modalTitle').textContent   = img.name;
  $('modalSiteBadge').textContent = siteLabel(img.site);
  $('modalPathBadge').textContent = img.path;
  document.querySelectorAll('.snippet-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.snippet === 'html')
  );
  updateSnippetCode();
  $('snippetModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('snippetModal').classList.remove('open');
  document.body.style.overflow = '';
  state.activeImage = null;
}

function updateSnippetCode() {
  if (!state.activeImage) return;
  const gen = SNIPPETS[state.activeSnippet];
  $('snippetCode').textContent = gen ? gen(state.activeImage) : '';
  $('snippetLang').textContent = state.activeSnippet.toUpperCase();
}

/* ── Clipboard & Toast ──────────────────────────────── */
async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('✅ Copied!');
    if (btn) {
      const orig = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = '✅ Copied';
      setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 2000);
    }
  } catch { showToast('⚠️ Copy failed — try manually.', 'warning'); }
}

function showToast(msg, type = 'success') {
  const container = $('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  const color = type === 'warning' ? 'var(--warning)' : 'var(--success)';
  toast.style.borderColor = color;
  toast.innerHTML = `<span class="toast-icon" style="color:${color}">${type === 'warning' ? '⚠️' : '✔️'}</span>${msg}`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('fade-out'); toast.addEventListener('animationend', () => toast.remove()); }, 2800);
}

/* ─────────────────────────────────────────────────────
   UPLOAD MODULE
   ───────────────────────────────────────────────────── */

const uploadQueue = [];
const PAT_KEY = 'imagecdn_github_pat';

const loadPat   = ()       => localStorage.getItem(PAT_KEY) || '';
const savePat   = token    => localStorage.setItem(PAT_KEY, token);
const clearPat  = ()       => localStorage.removeItem(PAT_KEY);

function updatePatUI() {
  const hasPat = !!loadPat();
  $('patStatus').textContent = hasPat ? 'Token saved ✓' : 'Not set';
  $('patStatus').className   = 'pat-status' + (hasPat ? ' saved' : '');
  $('patSavedRow').style.display = hasPat ? 'flex'   : 'none';
  $('patInput').style.display    = hasPat ? 'none'   : '';
  $('savePatBtn').style.display  = hasPat ? 'none'   : '';
  $('clearPatBtn').style.display = hasPat ? 'inline-flex' : 'none';
  const chg = $('changePatBtn');
  if (chg) chg.style.display    = hasPat ? ''      : 'none';
}

/* Site select for upload panel */
function renderUploadSiteSelect() {
  const sel = $('uploadSiteSelect');
  if (!sel) return;
  sel.innerHTML = '';
  SITES.filter(s => s.id !== 'all').forEach(site => {
    const opt = document.createElement('option');
    opt.value = site.id;
    opt.textContent = site.label;
    if (site.id === 'site-shared') opt.selected = true;
    sel.appendChild(opt);
  });
  updateUploadPathPreview();
}

function uploadDestFolder() {
  const sel    = $('uploadSiteSelect');
  const siteId = sel ? sel.value : 'site-shared';
  const site   = SITES.find(s => s.id === siteId);
  return site ? site.folder : 'images/shared';
}

function updateUploadPathPreview() {
  const preview = $('uploadPathPreview');
  if (!preview) return;
  const folder = uploadDestFolder();
  preview.textContent = cdnBase() + folder + '/<filename>';
}

/* File helpers */
function formatBytes(b) {
  if (b < 1024)       return b + ' B';
  if (b < 1048576)    return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function renderQueue() {
  const queueEl   = $('uploadQueue');
  const actionsEl = $('uploadActions');
  if (!uploadQueue.length) {
    queueEl.style.display   = 'none';
    actionsEl.style.display = 'none';
    return;
  }
  queueEl.style.display   = '';
  actionsEl.style.display = '';
  queueEl.innerHTML = '';
  uploadQueue.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'queue-item';
    el.innerHTML = `
      <img class="queue-thumb" src="${item.objectUrl}" alt="${item.file.name}" />
      <div class="queue-info">
        <div class="queue-name">${item.file.name}</div>
        <div class="queue-size">${formatBytes(item.file.size)}</div>
      </div>
      <span class="queue-status ${item.status}">${item.status}</span>
      ${item.status === 'pending' ? `<button class="queue-remove" data-idx="${idx}" aria-label="Remove">✕</button>` : ''}`;
    queueEl.appendChild(el);
  });
}

function addFilesToQueue(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    uploadQueue.push({ file, objectUrl: URL.createObjectURL(file), status: 'pending' });
  });
  renderQueue();
}

/* GitHub API upload */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadOneFile(item) {
  const token  = loadPat();
  const folder = uploadDestFolder();
  const path   = `${folder}/${item.file.name}`;
  const apiUrl = `https://api.github.com/repos/${state.user}/${state.repo}/contents/${path}`;

  item.status = 'uploading';
  renderQueue();

  try {
    const content = await fileToBase64(item.file);

    // Check for existing SHA (needed to update an existing file)
    let sha;
    try {
      const chk = await fetch(apiUrl, {
        headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
      });
      if (chk.ok) sha = (await chk.json()).sha;
    } catch { /* new file */ }

    const body = { message: `upload: ${item.file.name} via ImageCDN Hub`, content, branch: state.branch, ...(sha ? { sha } : {}) };

    const res = await fetch(apiUrl, {
      method: 'PUT',
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) { const e = await res.json(); throw new Error(e.message || res.statusText); }

    item.status = 'done';
    item.cdnUrl = cdnBase() + path;
    return { ok: true, file: item.file, objectUrl: item.objectUrl, cdnUrl: item.cdnUrl };
  } catch (err) {
    item.status = 'error';
    return { ok: false, file: item.file, error: err.message };
  }
}

async function uploadAll() {
  if (!loadPat()) { showToast('⚠️ Save your GitHub PAT first.', 'warning'); return; }
  const pending = uploadQueue.filter(i => i.status === 'pending');
  if (!pending.length) { showToast('⚠️ No pending files in queue.', 'warning'); return; }

  $('uploadAllBtn').disabled = true;
  const results = [];
  for (const item of pending) { results.push(await uploadOneFile(item)); renderQueue(); }
  $('uploadAllBtn').disabled = false;

  const ok  = results.filter(r => r.ok);
  const err = results.filter(r => !r.ok);
  if (ok.length)  { showToast(`✅ Uploaded ${ok.length} image${ok.length > 1 ? 's' : ''}!`); showResults(ok); }
  if (err.length) err.forEach(r => showToast(`❌ ${r.file.name}: ${r.error}`, 'warning'));
}

function showResults(successes) {
  const card    = $('resultsCard');
  const results = $('uploadResults');
  card.style.display = '';
  successes.forEach(r => {
    const el = document.createElement('div');
    el.className = 'result-item';
    el.innerHTML = `
      <img class="result-thumb" src="${r.objectUrl}" alt="${r.file.name}" />
      <div class="result-info">
        <div class="result-name">${r.file.name}</div>
        <div class="result-url">${r.cdnUrl}</div>
      </div>
      <button class="result-copy" data-url="${r.cdnUrl}">📋 Copy</button>`;
    results.appendChild(el);
  });
}

/* ─────────────────────────────────────────────────────
   EVENT LISTENERS (single, authoritative)
   ───────────────────────────────────────────────────── */
function attachEvents() {

  /* ── Config inputs ── */
  $('ghUsername').addEventListener('input', e => { state.user   = e.target.value || 'your-username';  updateUrlPreview(); renderGallery(); });
  $('ghRepo')    .addEventListener('input', e => { state.repo   = e.target.value || 'images-deliver'; updateUrlPreview(); renderGallery(); });
  $('ghBranch')  .addEventListener('input', e => { state.branch = e.target.value || 'main';           updateUrlPreview(); renderGallery(); });

  /* ── Platform buttons ── */
  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.platform-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-checked', 'false'); });
      btn.classList.add('active'); btn.setAttribute('aria-checked', 'true');
      state.platform = btn.dataset.platform;
      updateUrlPreview(); renderGallery();
    });
  });

  /* ── Site tabs ── */
  $('siteTabsContainer').addEventListener('click', e => {
    const tab = e.target.closest('.site-tab');
    if (!tab) return;
    state.activeSite = tab.dataset.siteId;
    renderSiteTabs(); updateUrlPreview(); renderGallery();
  });

  /* ── Search & filter ── */
  $('searchInput').addEventListener('input', e => { state.search = e.target.value.toLowerCase().trim(); renderGallery(); });
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.filter = tab.dataset.filter;
      renderGallery();
    });
  });

  /* ── View toggle ── */
  $('gridViewBtn').addEventListener('click', () => { state.viewMode = 'grid'; $('imageGrid').classList.remove('list-view'); $('gridViewBtn').classList.add('active'); $('listViewBtn').classList.remove('active'); });
  $('listViewBtn').addEventListener('click', () => { state.viewMode = 'list'; $('imageGrid').classList.add('list-view');    $('listViewBtn').classList.add('active'); $('gridViewBtn').classList.remove('active'); });

  /* ── Gallery card clicks ── */
  $('imageGrid').addEventListener('click', e => {
    const open    = e.target.closest('.open-snippet-btn');
    const copyUrl = e.target.closest('.copy-url-btn');
    const snip    = e.target.closest('.copy-all-btn');
    if (open)    openModal(open.dataset.id);
    else if (copyUrl) copyText(copyUrl.dataset.url, copyUrl);
    else if (snip)    openModal(snip.dataset.id);
  });

  /* ── Modal ── */
  $('modalClose').addEventListener('click', closeModal);
  $('snippetModal').addEventListener('click', e => { if (e.target === $('snippetModal')) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  document.querySelectorAll('.snippet-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.snippet-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active'); state.activeSnippet = tab.dataset.snippet; updateSnippetCode();
    });
  });
  $('copySnippetBtn').addEventListener('click', () => copyText($('snippetCode').textContent, $('copySnippetBtn')));

  /* ── Guide copy buttons ── */
  document.querySelectorAll('.copy-btn[data-code]').forEach(btn => {
    btn.addEventListener('click', () => { const el = $(btn.dataset.code); if (el) copyText(el.textContent, btn); });
  });

  /* ── Section nav ── */
  $('navGallery').addEventListener('click', () => switchSection('gallery'));
  $('navUpload') .addEventListener('click', () => switchSection('upload'));
  $('navGuide')  .addEventListener('click', () => switchSection('guide'));
  $('helpBtn')   .addEventListener('click', () => switchSection('guide'));

  /* ── Theme toggle ── */
  $('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    $('themeToggle').textContent = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
  });

  /* ── PAT ── */
  $('savePatBtn').addEventListener('click', () => {
    const val = $('patInput').value.trim();
    if (!val) { showToast('⚠️ Please enter a token.', 'warning'); return; }
    savePat(val); $('patInput').value = ''; updatePatUI(); showToast('✅ GitHub token saved!');
  });
  $('clearPatBtn').addEventListener('click', () => { clearPat(); updatePatUI(); showToast('Token cleared.'); });
  const chgBtn = $('changePatBtn');
  if (chgBtn) chgBtn.addEventListener('click', () => { clearPat(); updatePatUI(); });

  /* ── Upload site select ── */
  const uploadSel = $('uploadSiteSelect');
  if (uploadSel) uploadSel.addEventListener('change', updateUploadPathPreview);

  /* ── Drop zone ── */
  const dropZone  = $('dropZone');
  const fileInput = $('fileInput');
  dropZone.addEventListener('click',   () => fileInput.click());
  dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
  fileInput.addEventListener('change', e => { addFilesToQueue(e.target.files); e.target.value = ''; });
  dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('dragover'); addFilesToQueue(e.dataTransfer.files); });

  /* ── Queue remove ── */
  $('uploadQueue').addEventListener('click', e => {
    const btn = e.target.closest('.queue-remove');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx, 10);
    URL.revokeObjectURL(uploadQueue[idx].objectUrl);
    uploadQueue.splice(idx, 1);
    renderQueue();
  });

  /* ── Upload / clear ── */
  $('uploadAllBtn').addEventListener('click', uploadAll);
  $('clearQueueBtn').addEventListener('click', () => { uploadQueue.forEach(i => URL.revokeObjectURL(i.objectUrl)); uploadQueue.length = 0; renderQueue(); });
  $('clearResultsBtn').addEventListener('click', () => { $('uploadResults').innerHTML = ''; $('resultsCard').style.display = 'none'; });

  /* ── Result copy (delegated) ── */
  $('uploadResults').addEventListener('click', e => {
    const btn = e.target.closest('.result-copy');
    if (btn) copyText(btn.dataset.url, btn);
  });
}

/* ── Init ───────────────────────────────────────────── */
function init() {
  renderSiteTabs();
  updateUrlPreview();
  renderGallery();
  renderUploadSiteSelect();
  updatePatUI();
  attachEvents();
}

document.addEventListener('DOMContentLoaded', init);
