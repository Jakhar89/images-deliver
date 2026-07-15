/* =====================================================
   ImageCDN Hub — Application Logic (app.js)
   ===================================================== */

'use strict';

/* ── Image Registry ─────────────────────────────────── */
const IMAGES = [
  {
    id:       'hero-cyberpunk',
    name:     'Cyberpunk City',
    filename: 'hero-cyberpunk.png',
    path:     'images/hero-cyberpunk.png',
    type:     'background',
    tags:     ['background', 'neon', 'city', 'night', 'cyberpunk'],
  },
  {
    id:       'abstract-glass',
    name:     'Abstract Glassmorphism',
    filename: 'abstract-glass.png',
    path:     'images/abstract-glass.png',
    type:     'background',
    tags:     ['background', 'glass', 'abstract', '3d', 'purple'],
  },
  {
    id:       'workspace-minimal',
    name:     'Minimal Workspace',
    filename: 'workspace-minimal.png',
    path:     'images/workspace-minimal.png',
    type:     'workspace',
    tags:     ['workspace', 'minimal', 'desk', 'productivity'],
  },
  {
    id:       'avatar-robot',
    name:     'AI Robot Avatar',
    filename: 'avatar-robot.png',
    path:     'images/avatar-robot.png',
    type:     'avatar',
    tags:     ['avatar', 'robot', 'ai', 'cyberpunk', 'neon'],
  },
  {
    id:       'space-nebula',
    name:     'Cosmic Nebula',
    filename: 'space-nebula.png',
    path:     'images/space-nebula.png',
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
  user:       'your-username',
  repo:       'images-deliver',
  branch:     'main',
  platform:   'jsdelivr',
  filter:     'all',
  search:     '',
  viewMode:   'grid',          // 'grid' | 'list'
  activeImage: null,
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

function localThumb(img) {
  return img.path;   // served locally for preview
}

/* ── Snippet Generators ─────────────────────────────── */
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

function toPascal(str) {
  return str
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/* ── DOM Refs ───────────────────────────────────────── */
const $ = id => document.getElementById(id);

const els = {
  ghUsername:   $('ghUsername'),
  ghRepo:       $('ghRepo'),
  ghBranch:     $('ghBranch'),
  urlPreviewText: $('urlPreviewText'),
  imageGrid:    $('imageGrid'),
  searchInput:  $('searchInput'),
  snippetModal: $('snippetModal'),
  modalClose:   $('modalClose'),
  modalImg:     $('modalImg'),
  snippetCode:  $('snippetCode'),
  snippetLang:  $('snippetLang'),
  copySnippetBtn: $('copySnippetBtn'),
  toastContainer: $('toastContainer'),
  statImages:   $('statImages'),
  navGallery:   $('navGallery'),
  navGuide:     $('navGuide'),
  gallerySection: $('gallerySection'),
  guideSection: $('guideSection'),
  gridViewBtn:  $('gridViewBtn'),
  listViewBtn:  $('listViewBtn'),
  themeToggle:  $('themeToggle'),
  helpBtn:      $('helpBtn'),
};

/* ── Render Gallery ─────────────────────────────────── */
function filteredImages() {
  return IMAGES.filter(img => {
    const matchFilter  = state.filter === 'all' || img.type === state.filter;
    const matchSearch  = !state.search ||
      img.name.toLowerCase().includes(state.search) ||
      img.tags.some(t => t.includes(state.search)) ||
      img.filename.toLowerCase().includes(state.search);
    return matchFilter && matchSearch;
  });
}

function buildCard(img, index) {
  const url = cdnUrl(img);
  const thumb = localThumb(img);

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
      <div class="card-filename">${img.filename}</div>
      <div class="card-meta">
        <span>PNG · 1024×1024</span>
        <button class="copy-all-btn" data-id="${img.id}" aria-label="Copy all snippets for ${img.name}">📋 Snippets</button>
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

  imgs.forEach((img, i) => {
    els.imageGrid.appendChild(buildCard(img, i));
  });

  els.statImages.textContent = IMAGES.length;
}

/* ── Modal ──────────────────────────────────────────── */
function openModal(imgId) {
  const img = IMAGES.find(i => i.id === imgId);
  if (!img) return;
  state.activeImage = img;
  state.activeSnippet = 'html';

  els.modalImg.src = localThumb(img);
  els.modalImg.alt = img.name;
  document.getElementById('modalTitle').textContent = img.name;

  // reset snippet tab active state
  document.querySelectorAll('.snippet-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.snippet === 'html');
  });

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
  const gen = SNIPPETS[state.activeSnippet];
  const code = gen ? gen(state.activeImage) : '';
  els.snippetCode.textContent = code;
  els.snippetLang.textContent = state.activeSnippet.toUpperCase();
}

/* ── URL Preview ────────────────────────────────────── */
function updateUrlPreview() {
  els.urlPreviewText.textContent = cdnBase() + 'images/';
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
      setTimeout(() => {
        btn.innerHTML = original;
        btn.classList.remove('copied');
      }, 2000);
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
function switchSection(section) {
  const isGallery = section === 'gallery';
  els.navGallery.classList.toggle('active', isGallery);
  els.navGuide.classList.toggle('active', !isGallery);
  els.navGallery.setAttribute('aria-selected', isGallery);
  els.navGuide.setAttribute('aria-selected', !isGallery);
  els.gallerySection.style.display = isGallery ? '' : 'none';
  els.guideSection.style.display   = isGallery ? 'none' : '';
  // Hide search/filter in guide
  const filterGroup = document.getElementById('filterTabsGroup');
  const galleryControls = document.getElementById('galleryControls');
  if (filterGroup)     filterGroup.style.display = isGallery ? '' : 'none';
  if (galleryControls) galleryControls.style.display = isGallery ? '' : 'none';
}

/* ── Event Listeners ────────────────────────────────── */
function attachEvents() {

  // Config inputs
  els.ghUsername.addEventListener('input', e => {
    state.user = e.target.value || 'your-username';
    updateUrlPreview();
    renderGallery(); // re-render to refresh overlay URLs
  });
  els.ghRepo.addEventListener('input', e => {
    state.repo = e.target.value || 'images-deliver';
    updateUrlPreview();
    renderGallery();
  });
  els.ghBranch.addEventListener('input', e => {
    state.branch = e.target.value || 'main';
    updateUrlPreview();
    renderGallery();
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
      updateUrlPreview();
      renderGallery();
    });
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

  // Gallery delegation (open modal / copy URL)
  els.imageGrid.addEventListener('click', e => {
    const openBtn = e.target.closest('.open-snippet-btn');
    const copyUrlBtn = e.target.closest('.copy-url-btn');
    const snippetsBtn = e.target.closest('.copy-all-btn');

    if (openBtn) {
      openModal(openBtn.dataset.id);
    } else if (copyUrlBtn) {
      copyText(copyUrlBtn.dataset.url, copyUrlBtn);
    } else if (snippetsBtn) {
      openModal(snippetsBtn.dataset.id);
    }
  });

  // Modal close
  els.modalClose.addEventListener('click', closeModal);
  els.snippetModal.addEventListener('click', e => {
    if (e.target === els.snippetModal) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

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
  els.copySnippetBtn.addEventListener('click', () => {
    copyText(els.snippetCode.textContent, els.copySnippetBtn);
  });

  // Guide code copy buttons
  document.querySelectorAll('.copy-btn[data-code]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.code);
      if (target) copyText(target.textContent, btn);
    });
  });

  // Section navigation
  els.navGallery.addEventListener('click', () => switchSection('gallery'));
  els.navGuide.addEventListener('click', () => switchSection('guide'));

  // Help button
  els.helpBtn.addEventListener('click', () => switchSection('guide'));

  // Theme toggle (basic light-mode override)
  els.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    els.themeToggle.textContent = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
  });
}

/* ── Init ───────────────────────────────────────────── */
function init() {
  updateUrlPreview();
  renderGallery();
  attachEvents();
}

document.addEventListener('DOMContentLoaded', init);
