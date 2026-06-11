/* ═══════════════════════════════════════════════════════════════
   MINDMAP JOURNAL — app.js
   PDF Spec: Pillar 3 — vanilla JS, basic state management,
             interactive functionality. No frameworks.
   ═══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────
   DATA & STATE
   ───────────────────────────────────────── */
const MOOD_COLORS = {
  joy:      '#c8a96e',
  calm:     '#74c7b8',
  sad:      '#a0d4e0',
  angry:    '#c47a5a',
  anxious:  '#a5856f',
  grateful: '#7bc67e',
  inspired: '#d4a76a',
  tired:    '#8899aa'
};

const MOOD_EMOJI = {
  joy:      '😄',
  calm:     '😌',
  sad:      '😢',
  angry:    '😤',
  anxious:  '😰',
  grateful: '🙏',
  inspired: '✨',
  tired:    '😴'
};

let entries       = JSON.parse(localStorage.getItem('mmj_entries') || '[]');
let selectedMood  = 'all';
let searchQuery   = '';
let currentView   = 'canvas';
let activeEntryId = null;

function save() {
  localStorage.setItem('mmj_entries', JSON.stringify(entries));
}

function filteredEntries() {
  return entries.filter(e => {
    const matchMood   = selectedMood === 'all' || e.mood === selectedMood;
    const q           = searchQuery.toLowerCase();
    const matchSearch = !q
      || e.title.toLowerCase().includes(q)
      || e.body.toLowerCase().includes(q)
      || e.tags.some(t => t.toLowerCase().includes(q));
    return matchMood && matchSearch;
  });
}

/* ─────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────── */
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function prevDay(d) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() - 1);
  return dt.toISOString().split('T')[0];
}

/* ─────────────────────────────────────────
   SIDEBAR ENTRY LIST
   ───────────────────────────────────────── */
function renderEntryList() {
  const list = document.getElementById('entryList');
  const fe   = filteredEntries();

  if (!fe.length) {
    list.innerHTML = '<p class="empty-msg">No entries yet.<br>Hit <strong>+ New Entry</strong> to begin.</p>';
    return;
  }

  list.innerHTML = fe.map(e => `
    <article
      class="entry-item ${activeEntryId === e.id ? 'active' : ''}"
      style="--mood-color:${MOOD_COLORS[e.mood] || 'var(--mocha)'}"
      data-id="${e.id}"
      role="listitem"
      tabindex="0"
      aria-label="${escHtml(e.title)}"
    >
      <div class="entry-item-title">${escHtml(e.title)}</div>
      <div class="entry-item-meta">
        <span class="entry-item-mood"
          style="background:${MOOD_COLORS[e.mood] || 'var(--mocha)'};color:#1a1714">
          ${MOOD_EMOJI[e.mood] || ''} ${e.mood}
        </span>
        <span>${fmtDate(e.date)}</span>
      </div>
      ${e.body ? `<p class="entry-item-preview">${escHtml(e.body)}</p>` : ''}
    </article>
  `).join('');

  list.querySelectorAll('.entry-item').forEach(el => {
    el.addEventListener('click', () => openRead(el.dataset.id));
    el.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') openRead(el.dataset.id);
    });
  });
}

/* ─────────────────────────────────────────
   GRID VIEW
   ───────────────────────────────────────── */
function renderGrid() {
  const grid = document.getElementById('gridEntries');
  const fe   = filteredEntries();

  if (!fe.length) {
    grid.innerHTML = '<p style="color:var(--text3);grid-column:1/-1;text-align:center;padding:3rem 0;">No entries yet — write your first one!</p>';
    return;
  }

  grid.innerHTML = fe.map(e => `
    <article
      class="grid-card"
      data-id="${e.id}"
      style="--mood-color:${MOOD_COLORS[e.mood] || 'var(--mocha)'}"
      tabindex="0"
      aria-label="${escHtml(e.title)}"
    >
      <h3 class="grid-card-title">${escHtml(e.title)}</h3>
      ${e.body ? `<p class="grid-card-body">${escHtml(e.body)}</p>` : ''}
      <footer class="grid-card-footer">
        <span class="grid-card-date">${fmtDate(e.date)}</span>
        <div class="grid-card-tags">
          <span style="font-size:.72rem;padding:.15rem .5rem;border-radius:100px;background:${MOOD_COLORS[e.mood]}22;color:${MOOD_COLORS[e.mood]};font-weight:500">
            ${MOOD_EMOJI[e.mood]} ${e.mood}
          </span>
          ${e.tags.slice(0, 2).map(t => `<span class="mini-tag">${escHtml(t)}</span>`).join('')}
        </div>
      </footer>
    </article>
  `).join('');

  grid.querySelectorAll('.grid-card').forEach(el => {
    el.addEventListener('click', () => openRead(el.dataset.id));
    el.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') openRead(el.dataset.id);
    });
  });
}

/* ─────────────────────────────────────────
   STATS BAR
   ───────────────────────────────────────── */
function renderStats() {
  document.getElementById('statTotal').textContent = entries.length;

  const words = entries.reduce((a, e) => {
    return a + (e.body ? e.body.split(/\s+/).filter(Boolean).length : 0);
  }, 0);
  document.getElementById('statWords').textContent =
    words > 999 ? Math.round(words / 1000) + 'k' : words;

  // Streak
  const dates = [...new Set(entries.map(e => e.date.split('T')[0]))].sort().reverse();
  let streak = 0;
  if (dates.length) {
    const today = new Date().toISOString().split('T')[0];
    if (dates[0] === today || dates[0] === prevDay(today)) {
      streak = 1;
      for (let i = 1; i < dates.length; i++) {
        if (dates[i] === prevDay(dates[i - 1])) streak++;
        else break;
      }
    }
  }
  document.getElementById('statStreak').textContent = streak;

  // Top mood
  const moodCount = {};
  entries.forEach(e => { moodCount[e.mood] = (moodCount[e.mood] || 0) + 1; });
  const top = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('statTopMood').textContent = top ? MOOD_EMOJI[top[0]] : '—';
}

/* ─────────────────────────────────────────
   MIND MAP CANVAS
   ───────────────────────────────────────── */
const canvas = document.getElementById('mindmap');
const ctx    = canvas.getContext('2d');

let cam         = { x: 0, y: 0, scale: 1 };
let nodes       = [];
let isDragging  = false;
let dragStart   = { x: 0, y: 0 };
let camStart    = { x: 0, y: 0 };
let hoveredNode = null;

const CENTER_NODE = { x: 0, y: 0, r: 52, label: 'My Journal', isCenter: true };

function buildNodes() {
  const fe  = filteredEntries();
  nodes = [CENTER_NODE];
  if (!fe.length) return;

  const rings = [
    { entries: fe.slice(0,  Math.min(6,  fe.length)), radius: 190 },
    { entries: fe.slice(6,  Math.min(14, fe.length)), radius: 340 },
    { entries: fe.slice(14),                          radius: 500 }
  ];

  rings.forEach(ring => {
    if (!ring.entries.length) return;
    const angleStep = (Math.PI * 2) / ring.entries.length;
    ring.entries.forEach((e, i) => {
      const angle = i * angleStep - Math.PI / 2;
      nodes.push({
        x:     Math.cos(angle) * ring.radius,
        y:     Math.sin(angle) * ring.radius,
        r:     36,
        label: e.title,
        mood:  e.mood,
        id:    e.id,
        color: MOOD_COLORS[e.mood] || '#a5856f'
      });
    });
  });
}

function resizeCanvas() {
  const parent = document.getElementById('canvas-view');
  canvas.width  = parent.clientWidth;
  canvas.height = parent.clientHeight;
  if (cam.x === 0 && cam.y === 0) {
    cam.x = canvas.width  / 2;
    cam.y = canvas.height / 2;
  }
  draw();
}

function draw() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Dot-grid background — warmth
  ctx.save();
  ctx.fillStyle = 'rgba(165,133,111,0.045)';
  const dotSpacing = 28 * cam.scale;
  const offsetX = (cam.x % dotSpacing + dotSpacing) % dotSpacing;
  const offsetY = (cam.y % dotSpacing + dotSpacing) % dotSpacing;
  for (let x = offsetX - dotSpacing; x < W + dotSpacing; x += dotSpacing) {
    for (let y = offsetY - dotSpacing; y < H + dotSpacing; y += dotSpacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.scale(cam.scale, cam.scale);

  // Edges
  nodes.forEach(n => {
    if (n.isCenter) return;
    const isHov = hoveredNode && hoveredNode.id === n.id;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(n.x, n.y);
    ctx.strokeStyle = isHov ? (n.color || '#a5856f') : 'rgba(165,133,111,0.12)';
    ctx.lineWidth   = isHov ? 1.5 : 1;
    ctx.setLineDash(isHov ? [] : [4, 6]);
    ctx.stroke();
    ctx.restore();
  });

  // Nodes
  nodes.forEach(n => {
    const isHov = hoveredNode && (n.isCenter ? hoveredNode.isCenter : hoveredNode.id === n.id);
    ctx.save();

    if (n.isCenter) {
      // Glow
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 2.5);
      grd.addColorStop(0, 'rgba(165,133,111,0.3)');
      grd.addColorStop(1, 'rgba(165,133,111,0)');
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = '#7a5c47';
      ctx.fill();
      ctx.strokeStyle = '#c8a96e';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#f2f0ea';
      ctx.font = '700 13px "Montserrat", sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.label, n.x, n.y);

    } else {
      const scale = isHov ? 1.12 : 1;
      const r     = n.r * scale;

      if (isHov) {
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2);
        grd.addColorStop(0, n.color + '44');
        grd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 2, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle   = '#2a2622';
      ctx.fill();
      ctx.strokeStyle = n.color;
      ctx.lineWidth   = isHov ? 2.5 : 1.5;
      ctx.stroke();

      // Emoji
      ctx.font         = `${isHov ? 18 : 16}px serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(MOOD_EMOJI[n.mood] || '📓', n.x, n.y - 4);

      // Title label
      const fs    = 10;
      ctx.font      = `500 ${fs}px "Roboto", sans-serif`;
      ctx.fillStyle = isHov ? '#f2f0ea' : 'rgba(242,240,234,0.6)';
      const maxW  = r * 1.8;
      const words = n.label.split(' ');
      let line    = '', lines = [];
      words.forEach(w => {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW) { if (line) lines.push(line); line = w; }
        else line = test;
      });
      if (line) lines.push(line);
      lines = lines.slice(0, 2);
      const lineH  = fs + 2;
      const startY = n.y + r * 0.4 + 2;
      lines.forEach((l, i) => ctx.fillText(l, n.x, startY + i * lineH));
    }

    ctx.restore();
  });

  ctx.restore();
}

/* Canvas interaction — mouse */
function getHoveredNode(mx, my) {
  const wx = (mx - cam.x) / cam.scale;
  const wy = (my - cam.y) / cam.scale;
  return nodes.find(n => {
    const dx = wx - n.x, dy = wy - n.y;
    return Math.sqrt(dx * dx + dy * dy) < n.r + 8;
  }) || null;
}

canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  isDragging = true;
  dragStart  = { x: e.clientX, y: e.clientY };
  camStart   = { x: cam.x,     y: cam.y     };
});

canvas.addEventListener('mousemove', e => {
  if (isDragging) {
    cam.x = camStart.x + (e.clientX - dragStart.x);
    cam.y = camStart.y + (e.clientY - dragStart.y);
    draw();
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const mx   = e.clientX - rect.left;
  const my   = e.clientY - rect.top;
  const prev = hoveredNode;
  hoveredNode = getHoveredNode(mx, my);
  if (hoveredNode !== prev) draw();

  const tip = document.getElementById('nodeTooltip');
  if (hoveredNode && !hoveredNode.isCenter) {
    tip.textContent    = hoveredNode.label;
    tip.style.left     = (mx + 12) + 'px';
    tip.style.top      = (my - 36) + 'px';
    tip.classList.add('visible');
    tip.setAttribute('aria-hidden', 'false');
    canvas.style.cursor = 'pointer';
  } else {
    tip.classList.remove('visible');
    tip.setAttribute('aria-hidden', 'true');
    canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
  }
});

canvas.addEventListener('mouseup', e => {
  if (!isDragging) return;
  const moved = Math.abs(e.clientX - dragStart.x) + Math.abs(e.clientY - dragStart.y);
  isDragging  = false;
  if (moved < 5) {
    const rect = canvas.getBoundingClientRect();
    const n    = getHoveredNode(e.clientX - rect.left, e.clientY - rect.top);
    if (n && !n.isCenter) openRead(n.id);
  }
});

canvas.addEventListener('mouseleave', () => {
  isDragging  = false;
  hoveredNode = null;
  draw();
  const tip = document.getElementById('nodeTooltip');
  tip.classList.remove('visible');
  tip.setAttribute('aria-hidden', 'true');
});

/* Touch support */
let lastTouch = null;
canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    isDragging = true;
    dragStart  = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    camStart   = { x: cam.x, y: cam.y };
    lastTouch  = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
}, { passive: true });

canvas.addEventListener('touchmove', e => {
  if (isDragging && e.touches.length === 1) {
    cam.x = camStart.x + (e.touches[0].clientX - dragStart.x);
    cam.y = camStart.y + (e.touches[0].clientY - dragStart.y);
    draw();
  }
}, { passive: true });

canvas.addEventListener('touchend', e => {
  if (!isDragging) return;
  const t     = e.changedTouches[0];
  const moved = Math.abs(t.clientX - dragStart.x) + Math.abs(t.clientY - dragStart.y);
  isDragging  = false;
  if (moved < 8 && lastTouch) {
    const rect = canvas.getBoundingClientRect();
    const n    = getHoveredNode(t.clientX - rect.left, t.clientY - rect.top);
    if (n && !n.isCenter) openRead(n.id);
  }
});

/* Scroll zoom */
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const rect  = canvas.getBoundingClientRect();
  const mx    = e.clientX - rect.left;
  const my    = e.clientY - rect.top;
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const ns    = Math.min(3, Math.max(0.3, cam.scale * delta));
  cam.x       = mx - (mx - cam.x) * (ns / cam.scale);
  cam.y       = my - (my - cam.y) * (ns / cam.scale);
  cam.scale   = ns;
  draw();
}, { passive: false });

document.getElementById('zoomIn').addEventListener('click', () => {
  cam.scale = Math.min(3, cam.scale * 1.2); draw();
});
document.getElementById('zoomOut').addEventListener('click', () => {
  cam.scale = Math.max(0.3, cam.scale * 0.8); draw();
});
document.getElementById('resetView').addEventListener('click', () => {
  cam = { x: canvas.width / 2, y: canvas.height / 2, scale: 1 }; draw();
});

window.addEventListener('resize', resizeCanvas);

/* ─────────────────────────────────────────
   VIEW SWITCHING
   ───────────────────────────────────────── */
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentView = btn.dataset.view;
    document.querySelectorAll('.view-btn').forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
    });
    document.getElementById('canvas-view').classList.toggle('hidden', currentView !== 'canvas');
    document.getElementById('grid-view').classList.toggle('hidden', currentView !== 'grid');
    if (currentView === 'canvas') resizeCanvas();
    else renderGrid();
  });
});

/* ─────────────────────────────────────────
   MOOD FILTER
   ───────────────────────────────────────── */
document.getElementById('moodFilters').addEventListener('click', e => {
  const chip = e.target.closest('.mood-chip');
  if (!chip) return;
  selectedMood = chip.dataset.mood;
  document.querySelectorAll('.mood-chip').forEach(c => {
    const mc = MOOD_COLORS[c.dataset.mood];
    c.classList.toggle('active', c === chip);
    if (c === chip && mc) {
      c.style.background  = mc;
      c.style.color       = '#1a1714';
      c.style.borderColor = 'transparent';
    } else if (c === chip) {
      c.style.background  = 'var(--mocha)';
      c.style.color       = 'var(--grey)';
      c.style.borderColor = 'var(--mocha)';
    } else {
      c.style.background  = '';
      c.style.color       = '';
      c.style.borderColor = '';
    }
  });
  renderAll();
});

/* ─────────────────────────────────────────
   SEARCH
   ───────────────────────────────────────── */
document.getElementById('searchInput').addEventListener('input', e => {
  searchQuery = e.target.value;
  renderAll();
});

/* ─────────────────────────────────────────
   ADD ENTRY MODAL
   ───────────────────────────────────────── */
let selectedMoodAdd = null;
let addTags         = [];

function openAddModal() {
  selectedMoodAdd = null;
  addTags         = [];
  document.getElementById('entryTitle').value = '';
  document.getElementById('entryBody').value  = '';
  document.getElementById('tagInput').value   = '';
  renderTagsUI();
  document.querySelectorAll('.mood-option').forEach(o => {
    o.classList.remove('selected');
    o.style.background  = '';
    o.style.borderColor = '';
    o.setAttribute('aria-checked', 'false');
  });
  document.getElementById('addModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('entryTitle').focus();
}

function closeAddModal() {
  document.getElementById('addModal').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('openAddModal').addEventListener('click', openAddModal);
document.getElementById('closeAddModal').addEventListener('click', closeAddModal);
document.getElementById('cancelAdd').addEventListener('click', closeAddModal);
document.getElementById('addModal').addEventListener('click', e => {
  if (e.target === document.getElementById('addModal')) closeAddModal();
});

/* Mood picker */
document.getElementById('moodPicker').addEventListener('click', e => {
  const opt = e.target.closest('.mood-option');
  if (!opt) return;
  selectedMoodAdd = opt.dataset.mood;
  document.querySelectorAll('.mood-option').forEach(o => {
    const sel = o === opt;
    o.classList.toggle('selected', sel);
    o.style.background  = sel ? MOOD_COLORS[o.dataset.mood] + '33' : '';
    o.style.borderColor = sel ? MOOD_COLORS[o.dataset.mood] : '';
    o.style.color       = sel ? '#f2f0ea' : '';
    o.setAttribute('aria-checked', sel ? 'true' : 'false');
  });
});

/* Tags */
document.getElementById('tagsWrap').addEventListener('click', () => {
  document.getElementById('tagInput').focus();
});

document.getElementById('tagInput').addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ',') && e.target.value.trim()) {
    e.preventDefault();
    const tag = e.target.value.trim().replace(/,/g, '');
    if (tag && !addTags.includes(tag)) { addTags.push(tag); renderTagsUI(); }
    e.target.value = '';
  }
  if (e.key === 'Backspace' && !e.target.value && addTags.length) {
    addTags.pop(); renderTagsUI();
  }
});

function renderTagsUI() {
  const wrap  = document.getElementById('tagsWrap');
  const input = document.getElementById('tagInput');
  wrap.querySelectorAll('.tag-pill').forEach(p => p.remove());
  addTags.forEach((tag, i) => {
    const pill = document.createElement('span');
    pill.className   = 'tag-pill';
    pill.innerHTML   = `${escHtml(tag)}<button aria-label="Remove ${escHtml(tag)}">×</button>`;
    pill.querySelector('button').addEventListener('click', () => {
      addTags.splice(i, 1); renderTagsUI();
    });
    wrap.insertBefore(pill, input);
  });
}

document.getElementById('saveEntry').addEventListener('click', () => {
  const title = document.getElementById('entryTitle').value.trim();
  const body  = document.getElementById('entryBody').value.trim();
  if (!title) { document.getElementById('entryTitle').focus(); return; }
  if (!selectedMoodAdd) { alert('Please select a mood!'); return; }

  const entry = {
    id:    Date.now().toString(),
    title, body,
    mood:  selectedMoodAdd,
    tags:  [...addTags],
    date:  new Date().toISOString()
  };
  entries.unshift(entry);
  save();
  closeAddModal();
  renderAll();
});

/* ─────────────────────────────────────────
   READ ENTRY MODAL
   ───────────────────────────────────────── */
function openRead(id) {
  const e = entries.find(en => en.id === id);
  if (!e) return;
  activeEntryId = id;

  document.getElementById('readModalTitle').textContent = e.title;

  const badge = document.getElementById('readMoodBadge');
  badge.textContent   = `${MOOD_EMOJI[e.mood] || ''} ${e.mood}`;
  badge.style.background = MOOD_COLORS[e.mood] + '33';
  badge.style.color      = MOOD_COLORS[e.mood];
  badge.style.border     = `1px solid ${MOOD_COLORS[e.mood]}55`;

  document.getElementById('readBody').textContent = e.body || '(No text written)';
  document.getElementById('readDate').textContent = new Date(e.date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const tagsEl = document.getElementById('readTags');
  tagsEl.innerHTML = e.tags.map(t =>
    `<span class="mini-tag" style="font-size:.78rem;padding:.25rem .7rem;">${escHtml(t)}</span>`
  ).join('');

  document.getElementById('readModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderEntryList();
}

function closeReadModal() {
  document.getElementById('readModal').classList.remove('open');
  document.body.style.overflow = '';
  activeEntryId = null;
  renderEntryList();
}

document.getElementById('closeReadModal').addEventListener('click', closeReadModal);
document.getElementById('readModal').addEventListener('click', e => {
  if (e.target === document.getElementById('readModal')) closeReadModal();
});
document.getElementById('deleteEntry').addEventListener('click', () => {
  if (!confirm('Delete this entry?')) return;
  entries     = entries.filter(e => e.id !== activeEntryId);
  save();
  activeEntryId = null;
  document.getElementById('readModal').classList.remove('open');
  document.body.style.overflow = '';
  renderAll();
});

/* ─────────────────────────────────────────
   MOBILE SIDEBAR
   ───────────────────────────────────────── */
const burger   = document.getElementById('burger');
const sidebar  = document.getElementById('sidebar');
const backdrop = document.getElementById('sidebarBackdrop');

burger.addEventListener('click', () => {
  const open = sidebar.classList.toggle('open');
  backdrop.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
  backdrop.setAttribute('aria-hidden', String(!open));
});

backdrop.addEventListener('click', () => {
  sidebar.classList.remove('open');
  backdrop.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  backdrop.setAttribute('aria-hidden', 'true');
});

/* ─────────────────────────────────────────
   KEYBOARD SHORTCUTS
   ───────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      m.classList.remove('open');
    });
    document.body.style.overflow = '';
    activeEntryId = null;
    renderEntryList();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    openAddModal();
  }
});

/* ─────────────────────────────────────────
   RENDER ALL
   ───────────────────────────────────────── */
function renderAll() {
  renderEntryList();
  renderStats();
  buildNodes();
  if (currentView === 'canvas') draw();
  else renderGrid();
}

/* ─────────────────────────────────────────
   SEED DATA (first run only)
   ───────────────────────────────────────── */
function seedData() {
  if (entries.length) return;
  const seeds = [
    {
      title: 'First Day at DecodeLabs',
      body:  'Today was incredible — stepped into the world of full-stack development. The team is welcoming and the project brief is exciting. Feeling ready to build something meaningful.',
      mood:  'inspired',
      tags:  ['internship', 'coding', 'decodelabs']
    },
    {
      title: 'Wrestled with CSS Grid',
      body:  'Spent 3 hours trying to align that sidebar. Finally clicked when I stopped fighting the browser and started thinking in rows and columns. Grid is beautiful once you understand it.',
      mood:  'calm',
      tags:  ['css', 'learning', 'grid']
    },
  
    {
      title: 'Debugging nightmare 😅',
      body:  'Three hours to find a missing semicolon. THREE HOURS. I need to sleep more and rubber-duck debug earlier. At least I fixed it. The app works now.',
      mood:  'tired',
      tags:  ['debugging', 'javascript']
    },

  ];
  const now = Date.now();
  entries = seeds.map((s, i) => ({
    ...s,
    id:   (now - i * 86400000).toString(),
    date: new Date(now - i * 86400000).toISOString()
  }));
  save();
}

/* ─────────────────────────────────────────
   INIT
   ───────────────────────────────────────── */
seedData();
resizeCanvas();
renderAll();
