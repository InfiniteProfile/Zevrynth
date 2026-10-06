(() => {
'use strict';

const $ = s => document.querySelector(s);
const M32 = 0xffffffffn, START = 847293847293847293847293n;
const WIN = 36, B = 8, BN = 8n; // max cards in DOM, batch size

/* ---------- word banks ---------- */
const w = t => t.split(' '), s = t => t.split('|');
const W = {
  on: w('Zev Ory Vael Nyth Qel Ely Kae Thal Syr Ael Vor Ixa Mor Uzh Phel Cael Drev Yvo Sael Quor Nex Ilu Hael Oru Vyx Lun Zel Rue Xan Ulv Eir Tae Bry Ghe Fen Ohr Wyl Jor Nim Sev Aur Kyr Lys Mael'),
  mid: w('ry za vel lq ther ar ion eth ora ys aen um ix or il an ev ul ae ith ox esh qu ia yr'),
  end: w('nth lle ora vane aris rion eth ium yx ael enne ova is un ath orae ys aal oth ine en ur ax elle ior ume'),
  c1: w('Astral Lattice Resonant Hollow Tidal Veiled Cryo Umbral Lucent Fractal Chrono Void Silent Mirrored Aether Stellar Quantum Nocturne Glacial Prismatic'),
  c2: w('Entity Construct Phenomenon Organism Archive Sovereign Drift Engine Sentinel Remnant Signal Weaver Choir Anomaly Bloom Tide'),
  p1: w('Silent Hollow Veiled Pale Sunken Obsidian Drifting Fractured Quiet Lunar Ashen Glass Distant Inverted Slow Ivory'),
  p2: w('Meridian Reach Basin Spire Threshold Expanse Lattice Tide Gate Vault Margin Shelf Orbit Corridor Horizon'),
  e1: w('Pale Sleeping Folded Hollow Silent Nameless Slow Unwritten Drifting Glass'),
  e2: w('Echoes Tides Signals Ashes Mirrors Choirs Thresholds Lanterns Archives Maps'),
  st: w('Dormant Active Drifting Sealed Unmapped Fading Observed Recursive Awakening Dispersed'),
  u: w('vel qor ael nyx thar'),
  adj: w('luminous fractured patient unmapped resonant dormant weightless mirrored ancient restless hollow veiled'),
  vb: s('drifts beyond|hums beneath|records|orbits|remembers|bends|dissolves into|guards|unwinds|listens to'),
  ob: s('the mapped boundary|the edge of the known sky|its own reflection|forgotten coordinates|the slow tides of {w}|a language no one speaks|the seam between layers|the quiet orbit of {w}'),
  s2: s('Observers disagree on its origin.|No two surveys measure it alike.|It answers only to {c}.|Its signal repeats but never matches.|Records of it contradict one another.|The {a} is said to hold its key.|It was first logged by {c} cartographers.')
};
const RAR = ['Common', 'Uncommon', 'Rare', 'Exotic', 'Mythic', 'Singular'];

/* ---------- seeded RNG: any BigInt -> 128-bit state -> sfc32 ---------- */
function rngFor(id, salt) {
  const neg = id < 0n;
  let x = neg ? -id : id, i = 0;
  const h = [0x9e3779b9 ^ salt, 0x85ebca6b, 0xc2b2ae35, neg ? 0x27d4eb2f : 0x165667b1];
  do {
    const v32 = Number(x & M32); x >>= 32n;
    for (let j = 0; j < 4; j++) {
      let v = Math.imul(h[j] ^ (v32 + j * 0x9e3779b9 + i), 0x85ebca6b);
      v = ((v << 13) | (v >>> 19)) ^ h[(j + 1) & 3];
      h[j] = (Math.imul(v, 5) + 0xe6546b64) | 0;
    }
    i++;
  } while (x > 0n);
  let a = h[0], b = h[1], c = h[2], d = h[3];
  const next = () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return t >>> 0;
  };
  for (let k = 0; k < 16; k++) next();
  return next;
}

/* ---------- generators ---------- */
const J = (a, b) => (a.slice(-1) === b[0] ? a + b.slice(1) : a + b);

function nameOf(id) {
  const r = rngFor(id, 1), p = a => a[r() % a.length], f = r() % 10;
  let n = p(W.on);
  if (f >= 3) n = J(n, p(W.mid));
  if (f === 9) n = J(n, p(W.mid));
  return J(n, p(W.end));
}

// a related record: another deterministic 128-bit ID whose own Name equals the reference name
function deriveId(id, k) {
  const r = rngFor(id, 100 + k), g = () => BigInt(r());
  return (g() << 96n) | (g() << 64n) | (g() << 32n) | g();
}

function glyph(id) {
  const r = rngFor(id, 2), n = m => r() % m;
  const k = 3 + n(5), sg = 2 + n(2), dot = n(2), ring = n(3), pat = [];
  for (let j = 0; j < sg; j++) pat.push([4 + j * 5 + n(3), (n(9) - 4) * 0.09]);
  let d = '', dots = '';
  for (let i = 0; i < k; i++) {
    const a = i * 6.2832 / k;
    const pts = pat.map(p => [20 + p[0] * Math.cos(a + p[1]), 20 + p[0] * Math.sin(a + p[1])]);
    d += pts.map((p, j) => (j ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
    if (dot) { const q = pts[sg - 1]; dots += `<circle class="vi" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="1.5"/>`; }
  }
  return `<svg class="glyph" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/>${dots}<circle class="vi" cx="20" cy="20" r="1.8"/>${ring ? `<circle cx="20" cy="20" r="18.5" stroke-width=".7" opacity=".5"${ring === 2 ? ' stroke-dasharray="1.5 2.5"' : ''}/>` : ''}</svg>`;
}

let manual = []; // optional records from data.txt (never limits the universe)
const KEYS = { species: 'species', world: 'world', civilization: 'civ', civ: 'civ', dimension: 'dim', dim: 'dim', artifact: 'art', art: 'art' };

function applyManual(P, id) {
  const r = rngFor(id, 7);
  if (!manual.length || r() % 32) return; // roughly 1 in 32 records echoes a manual entry
  const m = manual[r() % manual.length];
  for (const k in m) {
    const v = m[k];
    if (k === 'name') P.name = v;
    else if (k === 'type') P.cls = v;
    else if (KEYS[k]) P[KEYS[k]].name = v;
    else if (k === 'location') P.loc = v;
    else if (k === 'description' || k === 'desc') P.desc = v;
    else if (k === 'era' || k === 'energy' || k === 'status') P[k] = v;
    else if (k === 'rarity') {
      const i = RAR.findIndex(x => x.toLowerCase() === v.toLowerCase());
      if (i >= 0) { P.rank = i; P.rarity = RAR[i]; }
    }
  }
  P.origin = 'Archive entry (data.txt)';
}

function gen(id) {
  const r = rngFor(id, 0), p = a => a[r() % a.length], n = m => r() % m;
  const ref = k => { const i = deriveId(id, k); return { id: i, name: nameOf(i) }; };
  const P = { id, name: nameOf(id), cls: p(W.c1) + ' ' + p(W.c2),
    species: ref(1), world: ref(2), civ: ref(3), dim: ref(4), art: ref(5) };
  P.loc = p(W.p1) + ' ' + p(W.p2) + ', sector ' + (n(9000) + 100);
  P.era = 'Age of ' + p(W.e1) + ' ' + p(W.e2);
  const q = n(1000);
  P.rank = q < 420 ? 0 : q < 700 ? 1 : q < 870 ? 2 : q < 960 ? 3 : q < 994 ? 4 : 5;
  P.rarity = RAR[P.rank];
  P.energy = (n(900) + 100) + ' ' + p(W.u);
  P.status = p(W.st);
  const adj = p(W.adj);
  P.desc = ((/^[aeiou]/.test(adj) ? 'An ' : 'A ') + adj + ' ' + P.cls.toLowerCase() + ' that ' + p(W.vb) + ' ' + p(W.ob) + '. ' + p(W.s2))
    .replace(/\{w\}/g, P.world.name).replace(/\{c\}/g, P.civ.name).replace(/\{a\}/g, P.art.name);
  P.origin = 'Procedural';
  applyManual(P, id);
  P.sym = glyph(id);
  return P;
}

/* ---------- data.txt ---------- */
function parseData(t) {
  return t.replace(/\r/g, '').split(/^[ \t]*-[ \t]*$/m).map(b => {
    const o = {};
    b.split('\n').forEach(l => {
      const m = l.match(/^\s*([A-Za-z ]+?)\s*:\s*(.+?)\s*$/);
      if (m) o[m[1].toLowerCase()] = m[2];
    });
    return o;
  }).filter(o => o.name);
}

/* ---------- cards ---------- */
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function fillCard(e, id) {
  const P = gen(id);
  e.className = 'card r' + P.rank;
  e.dataset.id = String(id);
  e.innerHTML = `${P.sym}<div class="body"><p class="id">${P.id}</p><div class="hd"><h2>${esc(P.name)}</h2><span class="tg">${P.rarity}</span></div><p class="meta"><i>Type</i>${esc(P.cls)}</p><p class="meta"><i>World</i>${esc(P.world.name)}</p><p class="desc">${esc(P.desc)}</p><button class="open" type="button">OPEN</button></div>`;
}
function cardEl(id) { const e = document.createElement('article'); fillCard(e, id); return e; }

/* ---------- virtualized infinite feed ---------- */
const feed = $('#feed'), list = $('#list'), up = $('#up'), dn = $('#dn');
let lo = 0n, hi = 0n; // IDs of first/last card in the DOM

function trim(dropTop) {
  const x = list.children.length - 2 - WIN;
  if (x <= 0) return;
  if (dropTop) {
    let keep = up.nextElementSibling;
    for (let i = 0; i < x; i++) keep = keep.nextElementSibling;
    const y = keep.offsetTop;
    for (let i = 0; i < x; i++) list.removeChild(up.nextElementSibling);
    lo += BigInt(x);
    feed.scrollTop += keep.offsetTop - y;
  } else {
    for (let i = 0; i < x; i++) list.removeChild(dn.previousElementSibling);
    hi -= BigInt(x);
  }
}
function append() {
  const f = document.createDocumentFragment();
  for (let i = 0; i < B; i++) { hi++; f.appendChild(cardEl(hi)); }
  list.insertBefore(f, dn);
  trim(true);
}
function prepend() {
  const first = up.nextElementSibling;
  if (!first || first === dn) return;
  const y = first.offsetTop, f = document.createDocumentFragment();
  lo -= BN;
  for (let i = 0n; i < BN; i++) f.appendChild(cardEl(lo + i));
  list.insertBefore(f, first);
  feed.scrollTop += first.offsetTop - y;
  trim(false);
}

let io = null;
const watch = () => { if (io) [up, dn].forEach(e => { io.unobserve(e); io.observe(e); }); };
if ('IntersectionObserver' in window) {
  io = new IntersectionObserver(es => {
    for (const e of es) {
      if (!e.isIntersecting) continue;
      if (e.target === up) prepend(); else append();
      io.unobserve(e.target); io.observe(e.target); // re-check until the margin is filled
    }
  }, { root: feed, rootMargin: '800px 0px' });
} else {
  feed.addEventListener('scroll', () => {
    const fr = feed.getBoundingClientRect();
    if (up.getBoundingClientRect().bottom > fr.top - 800) prepend();
    if (dn.getBoundingClientRect().top < fr.bottom + 800) append();
  }, { passive: true });
}

function jumpTo(id, hit) {
  while (up.nextElementSibling !== dn) list.removeChild(up.nextElementSibling);
  const f = document.createDocumentFragment();
  for (let i = -8n; i <= 18n; i++) f.appendChild(cardEl(id + i));
  lo = id - 8n; hi = id + 18n;
  list.insertBefore(f, dn);
  const c = list.children[9];
  if (hit) c.classList.add('hit');
  feed.scrollTop = c.offsetTop - 10;
  watch();
}

list.addEventListener('click', e => {
  const c = e.target.closest('.card');
  if (c && !String(window.getSelection()).length) openM(BigInt(c.dataset.id));
});

/* ---------- modal ---------- */
const modal = $('#modal'), mb = $('#mbody');
let cur = 0n, from = 0n, opener = null;
const F = [['Classification', 'cls'], ['Species', 'species', 1], ['World', 'world', 1], ['Location', 'loc'],
  ['Civilization', 'civ', 1], ['Dimension', 'dim', 1], ['Artifact', 'art', 1], ['Era', 'era'],
  ['Rarity', 'rarity'], ['Energy', 'energy'], ['Status', 'status'], ['Origin', 'origin']];
const setHash = h => { try { history.replaceState(null, '', h); } catch (e) { /* ignore */ } };

function show(id) {
  cur = id;
  const P = gen(id);
  mb.innerHTML = `<div class="mh">${P.sym}<div><p class="id">${P.id}</p><h3>${esc(P.name)}</h3></div></div><p class="mp">${esc(P.desc)}</p><dl>${
    F.map(([l, k, r]) => `<div class="row"><dt>${l}</dt><dd>${r ? `<button class="ref" type="button" data-ref="${P[k].id}">${esc(P[k].name)}</button>` : esc(P[k])}</dd></div>`).join('')
  }</dl><p class="hint">Underlined names open related records.</p>`;
  mb.scrollTop = 0;
  setHash('#' + id);
}
function openM(id) {
  from = id; opener = document.activeElement;
  show(id);
  modal.classList.add('on'); modal.setAttribute('aria-hidden', 'false');
  $('#close').focus();
}
function closeM() {
  modal.classList.remove('on'); modal.setAttribute('aria-hidden', 'true');
  setHash(location.pathname + location.search);
  if (cur !== from) jumpTo(cur, true);
  if (opener && opener.focus) opener.focus();
}

modal.addEventListener('click', e => {
  if (e.target === modal) return closeM();
  const ref = e.target.closest('[data-ref]');
  if (ref) return show(BigInt(ref.dataset.ref));
  const act = e.target.closest('[data-act]');
  if (!act) return;
  if (act.dataset.act === 'prev') show(cur - 1n);
  else if (act.dataset.act === 'next') show(cur + 1n);
  else closeM();
});
document.addEventListener('keydown', e => {
  if (!modal.classList.contains('on')) return;
  if (e.key === 'Escape') closeM();
  else if (e.key === 'ArrowLeft') show(cur - 1n);
  else if (e.key === 'ArrowRight') show(cur + 1n);
});

/* ---------- search + discover ---------- */
const q = $('#q'), msg = $('#msg');
$('#sf').addEventListener('submit', e => {
  e.preventDefault();
  const v = q.value.trim().replace(/[\s,_]/g, '').replace(/^\+/, '');
  if (!/^-?\d{1,500}$/.test(v)) { msg.textContent = 'Enter a whole number, such as 999999999999999999999999999999999999.'; return; }
  msg.textContent = '';
  const id = BigInt(v);
  jumpTo(id, true);
  openM(id);
  q.blur();
});
$('#disc').addEventListener('click', () => {
  const u = new Uint32Array(4), c = window.crypto;
  if (c && c.getRandomValues) c.getRandomValues(u);
  else for (let i = 0; i < 4; i++) u[i] = Math.random() * 4294967296;
  let id = 0n;
  for (const x of u) id = (id << 32n) | BigInt(x);
  id += 1n;
  msg.textContent = '';
  jumpTo(id, true);
  openM(id);
});

/* ---------- boot ---------- */
const hs = location.hash.slice(1), fromHash = /^-?\d{1,500}$/.test(hs);
const start = fromHash ? BigInt(hs) : START;
jumpTo(start, fromHash);
if (fromHash) openM(start);

if (typeof fetch === 'function') {
  fetch('data.txt').then(r => (r.ok ? r.text() : '')).then(t => {
    manual = parseData(t);
    if (!manual.length) return;
    list.querySelectorAll('.card').forEach(e => {
      const h = e.classList.contains('hit');
      fillCard(e, BigInt(e.dataset.id));
      if (h) e.classList.add('hit');
    });
    if (modal.classList.contains('on')) show(cur);
  }).catch(() => { /* data.txt is optional */ });
}
})();
