/* =====================================================
   ImageCDN Hub — Application Logic (app.js)
   ===================================================== */

'use strict';

/* ── Site Registry ──────────────────────────────────── */
// Each site has an id, label, and folder path inside the repo.
// Images are bucketed per site. Add more sites here freely.
const SITES = [
  { id: 'all',           label: '🌐 All Sites',     folder: 'images'              },
  { id: 'site-shared',  label: '🔗 Shared',         folder: 'images/shared'       },
  { id: 'site-1',       label: '🛍️ Decorepublic',   folder: 'images/decorepublic' },
  { id: 'site-2',       label: '🏪 Shopify Store',  folder: 'images/shopify-store'},
];

/* ── Image Registry ─────────────────────────────────── */
// path is relative to repo root. site matches a SITES id.
const IMAGES = [
  // ── Shared assets ──
  {
    id:       'hero-cyberpunk',
    name:     'Cyberpunk City',
    filename: 'hero-cyberpunk.png',
    path:     'images/shared/hero-cyberpunk.png',
    site:     'site-shared',
    type:     'background',
    tags:     ['background', 'neon', 'city', 'night', 'cyberpunk'],
  },
  {
    id:       'abstract-glass',
    name:     'Abstract Glassmorphism',
    filename: 'abstract-glass.png',
    path:     'images/shared/abstract-glass.png',
    site:     'site-shared',
    type:     'background',
    tags:     ['background', 'glass', 'abstract', '3d', 'purple'],
  },
  // ── Decorepublic assets ──
  {
    id:       'workspace-minimal',
    name:     'Minimal Workspace',
    filename: 'workspace-minimal.png',
    path:     'images/decorepublic/workspace-minimal.png',
    site:     'site-1',
    type:     'workspace',
    tags:     ['workspace', 'minimal', 'desk', 'productivity'],
  },
  // ── Shopify Store assets ──
  {
    id:       'avatar-robot',
    name:     'AI Robot Avatar',
    filename: 'avatar-robot.png',
    path:     'images/shopify-store/avatar-robot.png',
    site:     'site-2',
    type:     'avatar',
    tags:     ['avatar', 'robot', 'ai', 'cyberpunk', 'neon'],
  },
  {
    id:       'space-nebula',
    name:     'Cosmic Nebula',
    filename: 'space-nebula.png',
    path:     'images/shopify-store/space-nebula.png',
    site:     'site-2',
    type:     'background',
    tags:     ['background', 'space', 'galaxy', 'stars', 'nebula'],
  },
];

/* ── CDN Base URL Builders ───────────────────────────── */
const CDN_PLATFORMS = {
  jsdelivr:   ({ user, repo, branch }) =>
    `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/`,
  statically: ({ user, repo, branch }) =>
    `https://cdn.statically.io/gh/${user}/${repo}/${branch}/`,
  ghpages:    ({ user, repo }) =>
    `https://${user}.github.io/${repo}/`,
  raw:        ({ user, repo, branch }) =>
    `https://raw.githubusercontent.com/${user}/${repo}/${branch}/`,
};

/* ── State ──────────────────────────────────────────── */
const state = {
  user:          'your-username',
  repo:          'images-deliver',
  branch:        'main',
  platform:      'jsdelivr',
  activeSite:    'all',      // site id from SITES
  filter:        'all',      // image type filter
  search:        '',
  viewMode:      'grid',
  activeImage:   null,
  activeSnippet: 'html',
};

/* ── Helpers ────────────────────────────────────────── */
function cdnBase() {
  const fn = CDN_PLATFORMS[state.platform] || CDN_PLATFORMS.jsdelivr;
  return fn({ user: state.user, repo: state.repo, branch: state.branch });
}

function cdnUrl(img) {
  return cdnBase() + img.path;
}

// GitHub web upload link for the current active site's folder
function ghUploadUrl() {
  const site = SITES.find(s => s.id === state.activeSite);
  const folder = (site && site.id !== 'all') ? site.folder : 'images/shared';
  return `https://github.com/${state.user}/${state.repo}/upload/${state.branch}/${folder}`;
}

// GitHub file-browse link for a site folder
function ghBrowseUrl(siteId) {
  const site = SITES.find(s => s.id === siteId);
  if (!site || site.id === 'all') return `https://github.com/${state.user}/${state.repo}`;
  return `https://github.com/${state.user}/${state.repo}/tree/${state.branch}/${site.folder}`;
}

function localThumb(img) {
  // During local preview, images live in the old flat `images/` folder.
  // Map them back to the original filename for local serving.
  return 'images/' + img.filename;
}

/* ── Snippet Generators ─────────────────────────────── */
function toPascal(str) {
  return str.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

const SNIPPETS = {
  html: (img) =>
`<img
  src="${cdnUrl(img)}"
  alt="${img.name}"
  loading="lazy"
  width="1024"
  height="1024"
/>`,

  css: (img) =>
`.element {
  background-image: url("${cdnUrl(img)}");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}`,

  react: (img) =>
`const CDN_BASE = "${cdnBase()}";

export default function ${toPascal(img.id)}() {
  return (
    <img
      src={\`\${CDN_BASE}${img.path}\`}
      alt="${img.name}"
      loading="lazy"
    />
  );
}`,

  nextjs: (img) =>
`import Image from 'next/image';

export default function ${toPascal(img.id)}() {
  return (
    <Image
      src="${cdnUrl(img)}"
      alt="${img.name}"
      width={1024}
      height={1024}
      priority
    />
  );
}`,

  markdown: (img) =>
`![${img.name}](${cdnUrl(img)})`,

  raw: (img) => cdnUrl(img),
};

/* ── DOM Refs ───────────────────────────────────────── */
const $ = id => document.getElementById(id);

const els = {
  ghUsername:       $('ghUsername'),
  ghRepo:           $('ghRepo'),
  ghBranch:         $('ghBranch'),
  urlPreviewText:   $('urlPreviewText'),
  imageGrid:        $('imageGrid'),
  searchInput:      $('searchInput'),
  snippetModal:     $('snippetModal'),
  modalClose:       $('modalClose'),
  modalImg:         $('modalImg'),
  snippetCode:      $('snippetCode'),
  snippetLang:      $('snippetLang'),
  copySnippetBtn:   $('copySnippetBtn'),
  toastContainer:   $('toastContainer'),
  statImages:       $('statImages'),
  navGallery:       $('navGallery'),
  navUpload:        $('navUpload'),
  navGuide:         $('navGuide'),
  gallerySection:   $('gallerySection'),
  uploadSection:    $('uploadSection'),
  guideSection:     $('guideSection'),
  gridViewBtn:      $('gridViewBtn'),
  listViewBtn:      $('listViewBtn'),
  themeToggle:      $('themeToggle'),
  helpBtn:          $('helpBtn'),
  siteSelector:     $('siteSelector'),
  siteTabsContainer:$('siteTabsContainer'),
  sitePathHint:     $('sitePathHint'),
  // Upload tab
  patInput:         $('patInput'),
  savePatBtn:       $('savePatBtn'),
  clearPatBtn:      $('clearPatBtn'),
  changePatBtn:     $('changePatBtn'),
  patStatus:        $('patStatus'),
  patSavedRow:      $('patSavedRow'),
  patCard:          $('patCard'),
  dropZone:         $('dropZone'),
  fileInput:        $('fileInput'),
  uploadQueue:      $('uploadQueue'),
  uploadActions:    $('uploadActions'),
  uploadAllBtn:     $('uploadAllBtn'),
  clearQueueBtn:    $('clearQueueBtn'),
  resultsCard:      $('resultsCard'),
  uploadResults:    $('uploadResults'),
  clearResultsBtn:  $('clearResultsBtn'),
  uploadSiteSelect: $('uploadSiteSelect'),
  uploadPathPreview:$('uploadPathPreview'),
};

/* ── Render Site Tabs ───────────────────────────────── */
function renderSiteTabs() {
  if (!els.siteTabsContainer) return;
  els.siteTabsContainer.innerHTML = '';
  SITES.forEach(site => {
    const btn = document.createElement('button');
    btn.className = 'site-tab' + (state.activeSite === site.id ? ' active' : '');
    btn.dataset.siteId = site.id;
    btn.textContent = site.label;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', state.activeSite === site.id);
    btn.setAttribute('aria-label', `Filter images for ${site.label}`);
    els.siteTabsContainer.appendChild(btn);
  });
}

/* ── Update Upload Link & Site Path ─────────────────── */
function updateSiteControls() {
  if (els.uploadLink) {
    els.uploadLink.href = ghUploadUrl();
    els.uploadLink.textContent = '📤 Upload to GitHub';
  }

  // show folder path hint for active site
  if (els.sitePathHint) {
    const site = SITES.find(s => s.id === state.activeSite);
    if (site && site.id !== 'all') {
      els.sitePathHint.textContent = `Folder: ${site.folder}/`;
      els.sitePathHint.style.display = 'block';
    } else {
      els.sitePathHint.style.display = 'none';
    }
  }

  // Update the sidebar site selector if present
  if (els.siteSelector) {
    els.siteSelector.value = state.activeSite;
  }
}

/* ── Render Gallery ─────────────────────────────────── */
function filteredImages() {
  return IMAGES.filter(img => {
    const matchSite   = state.activeSite === 'all' || img.site === state.activeSite;
    const matchFilter = state.filter === 'all' || img.type === state.filter;
    const matchSearch = !state.search ||
      img.name.toLowerCase().includes(state.search) ||
      img.tags.some(t => t.includes(state.search)) ||
      img.filename.toLowerCase().includes(state.search) ||
      img.path.toLowerCase().includes(state.search);
    return matchSite && matchFilter && matchSearch;
  });
}

function siteLabel(siteId) {
  const site = SITES.find(s => s.id === siteId);
  return site ? site.label : siteId;
}

function buildCard(img, index) {
  const url   = cdnUrl(img);
  const thumb = localThumb(img);
  const siteLbl = siteLabel(img.site);

  const card = document.createElement('div');
  card.className = 'image-card';
  card.style.animationDelay = `${index * 0.06}s`;
  card.setAttribute('role', 'listitem');
  card.setAttribute('data-id', img.id);

  card.innerHTML = `
    <div class="card-thumb">
      <img src="${thumb}" alt="${img.name}" loading="lazy" />
      <div class="card-overlay">
        <button class="overlay-btn primary open-snippet-btn" data-id="${img.id}" aria-label="Get code snippets for ${img.name}">
          &lt;/&gt; Get Snippets
        </button>
        <button class="overlay-btn copy-url-btn" data-url="${url}" aria-label="Copy CDN URL for ${img.name}">
          🔗 Copy URL
        </button>
      </div>
      <span class="card-type-badge">${img.type}</span>
    </div>
    <div class="card-body">
      <div class="card-name">${img.name}</div>
      <div class="card-path" title="${img.path}">${img.path}</div>
      <div class="card-meta">
        <span class="card-site-badge">${siteLbl}</span>
        <button class="copy-all-btn" data-id="${img.id}" aria-label="Get snippets for ${img.name}">📋 Snippets</button>
      </div>
    </div>
  `;
  return card;
}

function renderGallery() {
  const imgs = filteredImages();
  els.imageGrid.innerHTML = '';

  if (imgs.length === 0) {
    els.imageGrid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-muted);">
        <div style="font-size:3rem;margin-bottom:12px">🔍</div>
        <div style="font-size:0.9rem">No images match your filter.</div>
      </div>`;
    return;
  }

  imgs.forEach((img, i) => els.imageGrid.appendChild(buildCard(img, i)));
  els.statImages.textContent = imgs.length;
}

/* ── Modal ──────────────────────────────────────────── */
function openModal(imgId) {
  const img = IMAGES.find(i => i.id === imgId);
  if (!img) return;
  state.activeImage   = img;
  state.activeSnippet = 'html';

  els.modalImg.src = localThumb(img);
  els.modalImg.alt = img.name;
  document.getElementById('modalTitle').textContent = img.name;
  document.getElementById('modalSiteBadge').textContent = siteLabel(img.site);
  document.getElementById('modalPathBadge').textContent = img.path;

  document.querySelectorAll('.snippet-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.snippet === 'html')
  );

  updateSnippetCode();
  els.snippetModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  els.modalClose.focus();
}

function closeModal() {
  els.snippetModal.classList.remove('open');
  document.body.style.overflow = '';
  state.activeImage = null;
}

function updateSnippetCode() {
  if (!state.activeImage) return;
  const gen  = SNIPPETS[state.activeSnippet];
  const code = gen ? gen(state.activeImage) : '';
  els.snippetCode.textContent = code;
  els.snippetLang.textContent = state.activeSnippet.toUpperCase();
}

/* ── URL Preview ────────────────────────────────────── */
function updateUrlPreview() {
  const site = SITES.find(s => s.id === state.activeSite);
  const folder = (site && site.id !== 'all') ? site.folder + '/' : 'images/';
  els.urlPreviewText.textContent = cdnBase() + folder;
  updateSiteControls();
}

/* ── Copy to Clipboard ──────────────────────────────── */
async function copyText(text, btn = null) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('✅ Copied to clipboard!');
    if (btn) {
      const original = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = '✅ Copied';
      setTimeout(() => { btn.innerHTML = original; btn.classList.remove('copied'); }, 2000);
    }
  } catch {
    showToast('⚠️ Copy failed — please copy manually.', 'warning');
  }
}

/* ── Toast ──────────────────────────────────────────── */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  const color = type === 'warning' ? 'var(--warning)' : 'var(--success)';
  toast.style.borderColor = color;
  toast.innerHTML = `<span class="toast-icon" style="color:${color}">${type === 'warning' ? '⚠️' : '✔️'}</span>${message}`;
  els.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 2800);
}

/* ── Section Navigation ─────────────────────────────── */
/* switchSection defined below in the upload module */

/* ── Event Listeners ────────────────────────────────── */
function attachEvents() {

  // Config inputs
  els.ghUsername.addEventListener('input', e => {
    state.user = e.target.value || 'your-username';
    updateUrlPreview(); renderGallery();
  });
  els.ghRepo.addEventListener('input', e => {
    state.repo = e.target.value || 'images-deliver';
    updateUrlPreview(); renderGallery();
  });
  els.ghBranch.addEventListener('input', e => {
    state.branch = e.target.value || 'main';
    updateUrlPreview(); renderGallery();
  });

  // Platform selector
  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.platform-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      state.platform = btn.dataset.platform;
      updateUrlPreview(); renderGallery();
    });
  });

  // Site tab clicks (delegated)
  els.siteTabsContainer.addEventListener('click', e => {
    const tab = e.target.closest('.site-tab');
    if (!tab) return;
    state.activeSite = tab.dataset.siteId;
    renderSiteTabs();
    updateUrlPreview();
    renderGallery();
  });

  // Search
  els.searchInput.addEventListener('input', e => {
    state.search = e.target.value.toLowerCase().trim();
    renderGallery();
  });

  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.filter = tab.dataset.filter;
      renderGallery();
    });
  });

  // View toggle
  els.gridViewBtn.addEventListener('click', () => {
    state.viewMode = 'grid';
    els.imageGrid.classList.remove('list-view');
    els.gridViewBtn.classList.add('active');
    els.listViewBtn.classList.remove('active');
  });
  els.listViewBtn.addEventListener('click', () => {
    state.viewMode = 'list';
    els.imageGrid.classList.add('list-view');
    els.listViewBtn.classList.add('active');
    els.gridViewBtn.classList.remove('active');
  });

  // Gallery delegation
  els.imageGrid.addEventListener('click', e => {
    const openBtn    = e.target.closest('.open-snippet-btn');
    const copyUrlBtn = e.target.closest('.copy-url-btn');
    const snippetsBtn = e.target.closest('.copy-all-btn');
    if (openBtn)     openModal(openBtn.dataset.id);
    else if (copyUrlBtn)  copyText(copyUrlBtn.dataset.url, copyUrlBtn);
    else if (snippetsBtn) openModal(snippetsBtn.dataset.id);
  });

  // Modal close
  els.modalClose.addEventListener('click', closeModal);
  els.snippetModal.addEventListener('click', e => { if (e.target === els.snippetModal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Snippet tabs
  document.querySelectorAll('.snippet-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.snippet-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeSnippet = tab.dataset.snippet;
      updateSnippetCode();
    });
  });

  // Copy snippet button
  els.copySnippetBtn.addEventListener('click', () =>
    copyText(els.snippetCode.textContent, els.copySnippetBtn)
  );

  // Guide code copy buttons
  document.querySelectorAll('.copy-btn[data-code]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.code);
      if (target) copyText(target.textContent, btn);
    });
  });
}  /* end of old attachEvents — superseded below */

/* ── Upload Module ──────────────────────────────────── */

// -- File queue state
const uploadQueue = [];   // { file, objectUrl, status: 'pending'|'uploading'|'done'|'error' }

// -- PAT helpers
const PAT_KEY = 'imagecdn_github_pat';

function loadPat() {
  return localStorage.getItem(PAT_KEY) || '';
}
function savePat(token) {
  localStorage.setItem(PAT_KEY, token);
}
function clearPat() {
  localStorage.removeItem(PAT_KEY);
}

function updatePatUI() {
  const token = loadPat();
  const hasPat = !!token;
  els.patStatus.textContent  = hasPat ? 'Token saved ✓' : 'Not set';
  els.patStatus.className    = 'pat-status' + (hasPat ? ' saved' : '');
  els.patSavedRow.style.display  = hasPat ? 'flex' : 'none';
  els.patInput.style.display     = hasPat ? 'none' : '';
  els.savePatBtn.style.display   = hasPat ? 'none' : '';
  els.clearPatBtn.style.display  = hasPat ? 'inline-flex' : 'none';
  els.changePatBtn && (els.changePatBtn.style.display = hasPat ? '' : 'none');
}

// -- Site select for upload panel
function renderUploadSiteSelect() {
  if (!els.uploadSiteSelect) return;
  els.uploadSiteSelect.innerHTML = '';
  SITES.filter(s => s.id !== 'all').forEach(site => {
    const opt = document.createElement('option');
    opt.value = site.id;
    opt.textContent = site.label;
    if (site.id === state.activeSite || site.id === 'site-shared') opt.selected = true;
    els.uploadSiteSelect.appendChild(opt);
  });
  updateUploadPathPreview();
}

function uploadDestinationFolder() {
  const siteId = els.uploadSiteSelect ? els.uploadSiteSelect.value : 'site-shared';
  const site = SITES.find(s => s.id === siteId);
  return site ? site.folder : 'images/shared';
}

function updateUploadPathPreview() {
  if (!els.uploadPathPreview) return;
  const folder = uploadDestinationFolder();
  const base = CDN_PLATFORMS[state.platform]({ user: state.user, repo: state.repo, branch: state.branch });
  els.uploadPathPreview.textContent = base + folder + '/<filename>';
}

// -- File queue rendering
function formatBytes(bytes) {
  if (bytes < 1024)       return bytes + ' B';
  if (bytes < 1024*1024)  return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/(1024*1024)).toFixed(1) + ' MB';
}

function renderQueue() {
  if (uploadQueue.length === 0) {
    els.uploadQueue.style.display  = 'none';
    els.uploadActions.style.display = 'none';
    return;
  }
  els.uploadQueue.style.display   = '';
  els.uploadActions.style.display = '';
  els.uploadQueue.innerHTML = '';
  uploadQueue.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'queue-item';
    el.dataset.idx = idx;
    el.innerHTML = `
      <img class="queue-thumb" src="${item.objectUrl}" alt="${item.file.name}" />
      <div class="queue-info">
        <div class="queue-name">${item.file.name}</div>
        <div class="queue-size">${formatBytes(item.file.size)}</div>
      </div>
      <span class="queue-status ${item.status}">${item.status}</span>
      ${item.status === 'pending' ? `<button class="queue-remove" data-idx="${idx}" aria-label="Remove ${item.file.name}">✕</button>` : ''}
    `;
    els.uploadQueue.appendChild(el);
  });
}

function addFilesToQueue(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const objectUrl = URL.createObjectURL(file);
    uploadQueue.push({ file, objectUrl, status: 'pending' });
  });
  renderQueue();
}

// -- GitHub API upload
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);  // strip data:image/...;base64,
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadFileToGitHub(item) {
  const token  = loadPat();
  const folder = uploadDestinationFolder();
  const path   = `${folder}/${item.file.name}`;
  const url    = `https://api.github.com/repos/${state.user}/${state.repo}/contents/${path}`;

  item.status = 'uploading';
  renderQueue();

  try {
    const content = await fileToBase64(item.file);

    // Check if file already exists (need its SHA to update)
    let sha;
    try {
      const check = await fetch(url, {
        headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
      });
      if (check.ok) {
        const existing = await check.json();
        sha = existing.sha;
      }
    } catch { /* new file, no SHA needed */ }

    const body = {
      message: `upload: ${item.file.name} via ImageCDN Hub`,
      content,
      branch: state.branch,
      ...(sha ? { sha } : {}),
    };

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept:        'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || res.statusText);
    }

    item.status = 'done';
    item.cdnUrl = cdnBase() + path;
    return { ok: true, cdnUrl: item.cdnUrl, file: item.file, objectUrl: item.objectUrl };

  } catch (err) {
    item.status = 'error';
    item.errorMsg = err.message;
    return { ok: false, error: err.message, file: item.file };
  }
}

async function uploadAll() {
  const token = loadPat();
  if (!token) {
    showToast('⚠️ Please save your GitHub PAT first.', 'warning');
    return;
  }
  const pending = uploadQueue.filter(i => i.status === 'pending');
  if (pending.length === 0) {
    showToast('⚠️ No pending files in queue.', 'warning');
    return;
  }

  els.uploadAllBtn.disabled = true;
  const results = [];

  for (const item of pending) {
    const result = await uploadFileToGitHub(item);
    results.push(result);
    renderQueue();
  }

  els.uploadAllBtn.disabled = false;

  const successes = results.filter(r => r.ok);
  const failures  = results.filter(r => !r.ok);

  if (successes.length > 0) {
    showToast(`✅ Uploaded ${successes.length} image${successes.length > 1 ? 's' : ''} successfully!`);
    showResults(successes);
  }
  if (failures.length > 0) {
    failures.forEach(f => showToast(`❌ Failed: ${f.file.name} — ${f.error}`, 'warning'));
  }
}

function showResults(successes) {
  els.resultsCard.style.display = '';
  successes.forEach(r => {
    const el = document.createElement('div');
    el.className = 'result-item';
    el.innerHTML = `
      <img class="result-thumb" src="${r.objectUrl}" alt="${r.file.name}" />
      <div class="result-info">
        <div class="result-name">${r.file.name}</div>
        <div class="result-url">${r.cdnUrl}</div>
      </div>
      <button class="result-copy" data-url="${r.cdnUrl}">📋 Copy</button>
    `;
    els.uploadResults.appendChild(el);
  });
}

// -- Upload event listeners
function attachUploadEvents() {
  // PAT save
  els.savePatBtn.addEventListener('click', () => {
    const val = els.patInput.value.trim();
    if (!val) { showToast('⚠️ Please enter a token first.', 'warning'); return; }
    savePat(val);
    els.patInput.value = '';
    updatePatUI();
    showToast('✅ GitHub token saved!');
  });

  // PAT clear
  els.clearPatBtn.addEventListener('click', () => {
    clearPat();
    updatePatUI();
    showToast('Token cleared.');
  });

  // PAT change
  if (els.changePatBtn) {
    els.changePatBtn.addEventListener('click', () => {
      clearPat();
      updatePatUI();
    });
  }

  // Site select → update path preview
  if (els.uploadSiteSelect) {
    els.uploadSiteSelect.addEventListener('change', updateUploadPathPreview);
  }

  // Drop zone click → open file picker
  els.dropZone.addEventListener('click', () => els.fileInput.click());
  els.dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') els.fileInput.click(); });

  // File input change
  els.fileInput.addEventListener('change', e => {
    addFilesToQueue(e.target.files);
    e.target.value = '';
  });

  // Drag events
  els.dropZone.addEventListener('dragover', e => { e.preventDefault(); els.dropZone.classList.add('dragover'); });
  els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('dragover'));
  els.dropZone.addEventListener('drop', e => {
    e.preventDefault();
    els.dropZone.classList.remove('dragover');
    addFilesToQueue(e.dataTransfer.files);
  });

  // Remove from queue
  els.uploadQueue.addEventListener('click', e => {
    const btn = e.target.closest('.queue-remove');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx, 10);
    URL.revokeObjectURL(uploadQueue[idx].objectUrl);
    uploadQueue.splice(idx, 1);
    renderQueue();
  });

  // Upload all
  els.uploadAllBtn.addEventListener('click', uploadAll);

  // Clear queue
  els.clearQueueBtn.addEventListener('click', () => {
    uploadQueue.forEach(i => URL.revokeObjectURL(i.objectUrl));
    uploadQueue.length = 0;
    renderQueue();
  });

  // Clear results
  els.clearResultsBtn.addEventListener('click', () => {
    els.uploadResults.innerHTML = '';
    els.resultsCard.style.display = 'none';
  });

  // Result copy buttons (delegated)
  els.uploadResults.addEventListener('click', e => {
    const btn = e.target.closest('.result-copy');
    if (!btn) return;
    copyText(btn.dataset.url, btn);
  });
}

/* ── Section Navigation ─────────────────────────────── */
function switchSection(section) {
  const sections = { gallery: 'gallerySection', upload: 'uploadSection', guide: 'guideSection' };
  const navBtns  = { gallery: 'navGallery',     upload: 'navUpload',     guide: 'navGuide' };

  Object.keys(sections).forEach(key => {
    const secEl = $(sections[key]);
    const navEl = $(navBtns[key]);
    const active = key === section;
    if (secEl) secEl.style.display = active ? '' : 'none';
    if (navEl) {
      navEl.classList.toggle('active', active);
      navEl.setAttribute('aria-selected', active);
    }
  });

  const filterGroup     = $('filterTabsGroup');
  const galleryControls = $('galleryControls');
  const isGallery = section === 'gallery';
  if (filterGroup)     filterGroup.style.display     = isGallery ? '' : 'none';
  if (galleryControls) galleryControls.style.display = isGallery ? '' : 'none';
}

/* ── Event Listeners ────────────────────────────────── */
function attachEvents() {

  // Config inputs
  els.ghUsername.addEventListener('input', e => {
    state.user = e.target.value || 'your-username';
    updateUrlPreview(); renderGallery(); updateUploadPathPreview();
  });
  els.ghRepo.addEventListener('input', e => {
    state.repo = e.target.value || 'images-deliver';
    updateUrlPreview(); renderGallery(); updateUploadPathPreview();
  });
  els.ghBranch.addEventListener('input', e => {
    state.branch = e.target.value || 'main';
    updateUrlPreview(); renderGallery(); updateUploadPathPreview();
  });

  // Platform selector
  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.platform-btn').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-checked', 'true');
      state.platform = btn.dataset.platform;
      updateUrlPreview(); renderGallery(); updateUploadPathPreview();
    });
  });

  // Site tab clicks
  els.siteTabsContainer.addEventListener('click', e => {
    const tab = e.target.closest('.site-tab');
    if (!tab) return;
    state.activeSite = tab.dataset.siteId;
    renderSiteTabs();
    updateUrlPreview();
    renderGallery();
  });

  // Search
  els.searchInput.addEventListener('input', e => {
    state.search = e.target.value.toLowerCase().trim();
    renderGallery();
  });

  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.filter = tab.dataset.filter;
      renderGallery();
    });
  });

  // View toggle
  els.gridViewBtn.addEventListener('click', () => {
    state.viewMode = 'grid';
    els.imageGrid.classList.remove('list-view');
    els.gridViewBtn.classList.add('active');
    els.listViewBtn.classList.remove('active');
  });
  els.listViewBtn.addEventListener('click', () => {
    state.viewMode = 'list';
    els.imageGrid.classList.add('list-view');
    els.listViewBtn.classList.add('active');
    els.gridViewBtn.classList.remove('active');
  });

  // Gallery delegation
  els.imageGrid.addEventListener('click', e => {
    const openBtn     = e.target.closest('.open-snippet-btn');
    const copyUrlBtn  = e.target.closest('.copy-url-btn');
    const snippetsBtn = e.target.closest('.copy-all-btn');
    if (openBtn)      openModal(openBtn.dataset.id);
    else if (copyUrlBtn)  copyText(copyUrlBtn.dataset.url, copyUrlBtn);
    else if (snippetsBtn) openModal(snippetsBtn.dataset.id);
  });

  // Modal
  els.modalClose.addEventListener('click', closeModal);
  els.snippetModal.addEventListener('click', e => { if (e.target === els.snippetModal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Snippet tabs
  document.querySelectorAll('.snippet-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.snippet-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeSnippet = tab.dataset.snippet;
      updateSnippetCode();
    });
  });
  els.copySnippetBtn.addEventListener('click', () => copyText(els.snippetCode.textContent, els.copySnippetBtn));

  // Guide code copy
  document.querySelectorAll('.copy-btn[data-code]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.code);
      if (target) copyText(target.textContent, btn);
    });
  });

  // Section nav
  els.navGallery.addEventListener('click', () => switchSection('gallery'));
  if (els.navUpload) els.navUpload.addEventListener('click', () => switchSection('upload'));
  els.navGuide.addEventListener('click',   () => switchSection('guide'));
  els.helpBtn.addEventListener('click',    () => switchSection('guide'));

  // Theme
  els.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    els.themeToggle.textContent = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
  });

  // Upload events
  attachUploadEvents();
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
