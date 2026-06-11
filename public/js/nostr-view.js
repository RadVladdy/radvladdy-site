// View layer for the /nostr viewer (the njump replacement) and the essay
// comments section. Everything renders in the site theme, live from relays.
// All relay-sourced strings pass through esc() before touching the DOM;
// URLs only become href/src after an http(s) check.

import {
  RAD_PUBKEY, decode, npubEncode, noteEncode, naddrEncode,
  query, latestPer, tagValue, replyTarget, rootTarget,
  zapTotals, fetchProfiles, fetchEventById, fetchAddr,
} from '/js/nostr.js';

const esc = (s) => String(s ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

const isHttp = (u) => /^https?:\/\//i.test(u);
const IMG_RE = /\.(png|jpe?g|gif|webp|avif)(\?[^\s]*)?$/i;

const fmtSats = (n) => n.toLocaleString('en-US');
const fmtDate = (ts) => {
  const d = new Date(ts * 1000);
  return d.toISOString().slice(0, 10) + ' ' + d.toISOString().slice(11, 16) + ' utc';
};

const shortBech = (b) => b.slice(0, 10) + '…' + b.slice(-4);
const entityHref = (b) => '/nostr/' + b;

function nameOf(profiles, pubkey) {
  const p = profiles.get(pubkey);
  return p?.display_name || p?.name || shortBech(npubEncode(pubkey));
}

// ---- content rendering (kind 1 notes) ----

// Escape first, then lift URLs / nostr entities into links and inline images.
export function renderContent(text) {
  let out = '';
  const parts = String(text || '').split(/(\s+)/);
  for (const part of parts) {
    if (/^\s+$/.test(part)) { out += esc(part); continue; }
    const clean = part.replace(/[.,;:!?)]+$/, '');
    const tail = esc(part.slice(clean.length));
    if (isHttp(clean)) {
      out += IMG_RE.test(clean)
        ? `<img src="${esc(clean)}" alt="" loading="lazy">` + tail
        : `<a href="${esc(clean)}" rel="noopener nofollow">${esc(clean)}</a>` + tail;
      continue;
    }
    const ent = /^(?:nostr:)?((?:npub|nprofile|note|nevent|naddr)1[02-9ac-hj-np-z]{6,})$/.exec(clean);
    if (ent) {
      out += `<a href="${entityHref(ent[1])}">${esc(shortBech(ent[1]))}</a>` + tail;
      continue;
    }
    out += esc(part);
  }
  return '<p>' + out.replaceAll('\n\n', '</p><p>').replaceAll('\n', '<br>') + '</p>';
}

// ---- markdown rendering (NIP-23 long-form) ----

// Deliberately minimal: the common subset (headings, emphasis, links, images,
// code, quotes, lists, hr). Long-form posts that go beyond it degrade to
// readable text, never to broken markup.
function inlineMd(s) {
  let out = esc(s);
  out = out.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  out = out.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener nofollow">$1</a>');
  out = out.replace(/\[([^\]]+)\]\(((?:nostr:)?(?:npub|nprofile|note|nevent|naddr)1[02-9ac-hj-np-z]{6,})\)/g,
    (_, t, e) => `<a href="${entityHref(e.replace(/^nostr:/, ''))}">${t}</a>`);
  out = out.replace(/(^|\s)((?:nostr:)(?:npub|nprofile|note|nevent|naddr)1[02-9ac-hj-np-z]{6,})/g,
    (_, sp, e) => `${sp}<a href="${entityHref(e.replace(/^nostr:/, ''))}">${esc(shortBech(e.replace(/^nostr:/, '')))}</a>`);
  out = out.replace(/(^|\s)(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '$1<a href="$2" rel="noopener nofollow">$2</a>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  out = out.replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>');
  return out;
}

export function renderMarkdown(md) {
  const lines = String(md || '').replaceAll('\r\n', '\n').split('\n');
  let html = '', para = [], list = null, quote = [], code = null;
  const flushPara = () => { if (para.length) { html += `<p>${inlineMd(para.join(' '))}</p>`; para = []; } };
  const flushList = () => { if (list) { html += `<${list.tag}>${list.items.map((i) => `<li>${inlineMd(i)}</li>`).join('')}</${list.tag}>`; list = null; } };
  const flushQuote = () => { if (quote.length) { html += `<blockquote><p>${inlineMd(quote.join(' '))}</p></blockquote>`; quote = []; } };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };

  for (const line of lines) {
    if (code !== null) {
      if (/^```/.test(line)) { html += `<pre><code>${esc(code.join('\n'))}</code></pre>`; code = null; }
      else code.push(line);
      continue;
    }
    if (/^```/.test(line)) { flushAll(); code = []; continue; }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) { flushAll(); html += `<h${h[1].length}>${inlineMd(h[2])}</h${h[1].length}>`; continue; }
    if (/^\s*([-*_])\s*\1\s*\1[\s\-*_]*$/.test(line)) { flushAll(); html += '<hr>'; continue; }
    const q = /^>\s?(.*)$/.exec(line);
    if (q) { flushPara(); flushList(); quote.push(q[1]); continue; }
    const ul = /^\s*[-*+]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (ul || ol) {
      flushPara(); flushQuote();
      const tag = ul ? 'ul' : 'ol';
      if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
      list.items.push((ul || ol)[1]);
      continue;
    }
    if (!line.trim()) { flushAll(); continue; }
    flushList(); flushQuote();
    para.push(line.trim());
  }
  if (code !== null) html += `<pre><code>${esc(code.join('\n'))}</code></pre>`;
  flushAll();
  return html;
}

// ---- building blocks ----

function avatarImg(profiles, pubkey, size) {
  const pic = profiles.get(pubkey)?.picture;
  return pic && isHttp(pic)
    ? `<img class="nv-avatar" style="width:${size}px;height:${size}px" src="${esc(pic)}" alt="" loading="lazy">`
    : `<span class="nv-avatar nv-avatar-blank" style="width:${size}px;height:${size}px"></span>`;
}

// The little two-overlapping-boxes copy button.
const copyBtn = (value) => `<button class="nv-cic" data-copy="${esc(value)}" title="copy" aria-label="copy">` +
  '<svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.3">' +
  '<rect x="5" y="5" width="7.5" height="7.5" rx="1.5"/><path d="M9.5 2.8H3.3A1.3 1.3 0 0 0 2 4.1v6.2"/></svg></button>';

function zapBadge(z) {
  return z && z.sats > 0
    ? ` · <span class="nv-zap">⚡ ${fmtSats(z.sats)} sats${z.count > 1 ? ` <span class="dim">(${z.count})</span>` : ''}</span>`
    : '';
}

function noteCard(ev, profiles, zaps, { focus = false, depth = 0 } = {}) {
  const note = noteEncode(ev.id);
  const z = zaps.get(ev.id);
  return `
    <article class="nv-note${focus ? ' nv-focus' : ''}" style="margin-left:${Math.min(depth, 3) * 18}px">
      <div class="nv-head">
        ${avatarImg(profiles, ev.pubkey, 30)}
        <a class="nv-author" href="${entityHref(npubEncode(ev.pubkey))}">${esc(nameOf(profiles, ev.pubkey))}</a>
        <span class="nv-meta"><a class="dim" href="${entityHref(note)}">${fmtDate(ev.created_at)}</a>${zapBadge(z)}</span>
      </div>
      <div class="nv-content">${renderContent(ev.content)}</div>
    </article>`;
}

function statusLine(root, msg) {
  root.innerHTML = `<p class="nv-status dim">${esc(msg)}</p>`;
}

// ---- views ----

async function viewProfile(root, pubkey) {
  statusLine(root, 'connecting to relays…');
  const events = await query([
    { kinds: [0], authors: [pubkey] },
    { kinds: [1], authors: [pubkey], limit: 25 },
    { kinds: [30023], authors: [pubkey], limit: 20 },
  ]);
  const kind0 = latestPer(events.filter((e) => e.kind === 0))[0];
  const notes = events.filter((e) => e.kind === 1).sort((a, b) => b.created_at - a.created_at).slice(0, 25);
  const articles = latestPer(events.filter((e) => e.kind === 30023)).sort((a, b) => b.created_at - a.created_at);
  if (!kind0 && !notes.length && !articles.length) {
    statusLine(root, 'nothing found on the relays for this profile.');
    return;
  }

  let profile = {};
  try { profile = kind0 ? JSON.parse(kind0.content) : {}; } catch { /* junk kind-0 */ }
  const npub = npubEncode(pubkey);
  const profiles = new Map([[pubkey, profile]]);

  const banner = profile.banner && isHttp(profile.banner)
    ? `<div class="nv-banner" data-banner="${esc(profile.banner)}"></div>` : '';
  // No website badge: on your own profile it just points at the site
  // you're standing on, and elsewhere it's clutter — the about text and
  // nip05 already carry the domain.
  const nip05 = profile.nip05
    ? `<span class="nv-badge"><span class="nv-tag">[NIP-05]</span> ${esc(profile.nip05)}${copyBtn(profile.nip05)}</span>` : '';
  const lud16 = profile.lud16
    ? `<span class="nv-badge"><span class="nv-bolt">⚡︎</span> ${esc(profile.lud16)}${copyBtn(profile.lud16)}</span>` : '';

  root.innerHTML = `
    ${banner}
    <div class="nv-profile">
      ${avatarImg(profiles, pubkey, 84)}
      <div class="nv-name">${esc(profile.display_name || profile.name || shortBech(npub))}</div>
    </div>
    ${nip05 || lud16 ? `<div class="nv-idrow">${nip05}${lud16}</div>` : ''}
    <div class="nv-npub"><code>${npub}</code> <button class="nv-copy" data-copy="${npub}">copy</button>
      <a class="nv-open" href="nostr:${npub}">app ↗</a>
      <a class="nv-open" href="https://primal.net/p/${npub}" rel="noopener">web ↗</a></div>
    ${profile.about ? `<div class="nv-about">${renderContent(profile.about)}</div>` : ''}
    ${articles.length ? `<p class="sec-label">~/long-form</p><div class="nv-articles">${articles.map((a) => {
      const naddr = naddrEncode({ identifier: tagValue(a, 'd') || '', pubkey: a.pubkey, kind: 30023 });
      return `<a class="list-item" href="${entityHref(naddr)}">
        <span class="t">${esc(tagValue(a, 'title') || tagValue(a, 'd') || 'untitled')}</span>
        <span class="d">${fmtDate(parseInt(tagValue(a, 'published_at'), 10) || a.created_at).slice(0, 10)}</span></a>`;
    }).join('')}</div>` : ''}
    <p class="sec-label">~/notes — latest</p>
    <div class="nv-list">${notes.map((n) => noteCard(n, profiles, new Map())).join('') || '<p class="dim">no notes found on these relays.</p>'}</div>`;

  wireUp(root);

  // Hydrate zap badges after first paint.
  if (notes.length) {
    const receipts = await query([{ kinds: [9735], '#e': notes.map((n) => n.id), limit: 500 }]);
    const zaps = groupZaps(receipts);
    root.querySelectorAll('.nv-note').forEach((card, i) => {
      const meta = card.querySelector('.nv-meta');
      const z = zaps.get(notes[i]?.id);
      if (meta && z) meta.insertAdjacentHTML('beforeend', zapBadge(z));
    });
  }
}

function groupZaps(receipts) {
  const by = new Map();
  for (const r of receipts) {
    const e = tagValue(r, 'e') || tagValue(r, 'a');
    if (!e) continue;
    (by.get(e) || by.set(e, []).get(e)).push(r);
  }
  return new Map([...by].map(([k, v]) => [k, zapTotals(v)]));
}

async function viewNote(root, id) {
  statusLine(root, 'fetching the thread from relays…');
  const [ev, related] = await Promise.all([
    fetchEventById(id),
    query([
      { kinds: [1], '#e': [id], limit: 300 },
      { kinds: [9735], '#e': [id], limit: 500 },
    ]),
  ]);
  if (!ev) { statusLine(root, 'event not found on these relays.'); return; }

  const replies = related.filter((e) => e.kind === 1);
  const zaps = groupZaps(related.filter((e) => e.kind === 9735));
  const pubkeys = [...new Set([ev.pubkey, ...replies.map((r) => r.pubkey)])];
  const profiles = await fetchProfiles(pubkeys);

  // Thread tree: a fetched event is a child of whatever its NIP-10 reply
  // target points to — the focused note, or another fetched reply. Targets
  // outside the fetched set fold up to the focused note so nothing vanishes.
  const knownIds = new Set([id, ...replies.map((r) => r.id)]);
  const children = new Map();
  for (const r of replies.sort((a, b) => a.created_at - b.created_at)) {
    if (r.id === id) continue;
    const target = replyTarget(r);
    const parent = knownIds.has(target) ? target : id;
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(r);
  }
  const renderBranch = (parentId, depth) => (children.get(parentId) || [])
    .map((r) => noteCard(r, profiles, zaps, { depth }) + renderBranch(r.id, depth + 1)).join('');

  const parent = replyTarget(ev);
  const root_ = rootTarget(ev);
  const crumbs = [
    root_ && root_ !== parent ? `<a href="${entityHref(noteEncode(root_))}">↑ thread root</a>` : '',
    parent ? `<a href="${entityHref(noteEncode(parent))}">↑ replying to</a>` : '',
  ].filter(Boolean).join(' · ');

  const replyCount = [...children.values()].reduce((n, c) => n + c.length, 0);
  root.innerHTML = `
    ${crumbs ? `<p class="nv-crumbs dim">${crumbs}</p>` : ''}
    ${noteCard(ev, profiles, zaps, { focus: true })}
    <p class="nv-actions"><a href="nostr:${noteEncode(ev.id)}">open in app ↗</a> · <a href="https://primal.net/e/${noteEncode(ev.id)}" rel="noopener">web ↗</a> — reply or zap from there.</p>
    ${replyCount ? `<p class="sec-label">~/replies (${replyCount})</p>${renderBranch(id, 0)}` : '<p class="dim">no replies on these relays yet.</p>'}`;
  wireUp(root);
  document.title = `${nameOf(profiles, ev.pubkey)} on nostr — RadVladdy`;
}

async function viewAddr(root, ptr) {
  statusLine(root, 'fetching the article from relays…');
  const ev = await fetchAddr(ptr);
  if (!ev) { statusLine(root, 'article not found on these relays.'); return; }
  const coord = `${ptr.kind}:${ptr.pubkey}:${ptr.identifier}`;
  const [related, profiles] = await Promise.all([
    query([
      { kinds: [1, 1111], '#a': [coord], limit: 300 },
      { kinds: [9735], '#a': [coord], limit: 500 },
    ]),
    fetchProfiles([ev.pubkey]),
  ]);
  const comments = related.filter((e) => e.kind !== 9735).sort((a, b) => a.created_at - b.created_at);
  const zaps = zapTotals(related.filter((e) => e.kind === 9735));
  const commentProfiles = await fetchProfiles([...new Set(comments.map((c) => c.pubkey))]);
  for (const [k, v] of commentProfiles) profiles.set(k, v);

  const title = tagValue(ev, 'title') || ptr.identifier;
  const published = parseInt(tagValue(ev, 'published_at'), 10) || ev.created_at;
  root.innerHTML = `
    <h1>${esc(title)}</h1>
    ${tagValue(ev, 'summary') ? `<p class="post-subtitle">${esc(tagValue(ev, 'summary'))}</p>` : ''}
    <p class="byline">
      <a href="${entityHref(npubEncode(ev.pubkey))}">${esc(nameOf(profiles, ev.pubkey))}</a>
      · ${fmtDate(published).slice(0, 10)} · long-form on nostr${zaps.sats ? zapBadge(zaps) : ''}
      · <a href="nostr:${naddrEncode(ptr)}">open in app ↗</a> · <a href="https://primal.net/a/${naddrEncode(ptr)}" rel="noopener">web ↗</a>
    </p>
    <div class="prose">${renderMarkdown(ev.content)}</div>
    <p class="sec-label">~/comments (${comments.length})</p>
    ${comments.map((c) => noteCard(c, profiles, new Map())).join('') || '<p class="dim">no comments on these relays yet.</p>'}`;
  wireUp(root);
  document.title = `${title} — nostr — RadVladdy`;
}

// ---- wiring ----

// Clipboard API with the old textarea trick as fallback (the API is
// permission-gated in some embedded browsers).
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

function wireUp(root) {
  root.querySelectorAll('.nv-copy, .nv-cic').forEach((btn) => {
    btn.addEventListener('click', () => {
      copyText(btn.dataset.copy).then((ok) => {
        if (!ok) return;
        const orig = btn.innerHTML;
        btn.innerHTML = '✓';
        setTimeout(() => { btn.innerHTML = orig; }, 1400);
      });
    });
  });
  root.querySelectorAll('.nv-banner[data-banner]').forEach((el) => {
    const u = el.dataset.banner;
    if (isHttp(u)) el.style.backgroundImage = `url("${u.replace(/["\\]/g, '')}")`;
  });
}

function fail(root, err) {
  statusLine(root, 'could not load: ' + (err?.message || err));
}

export function initHome(root) {
  viewProfile(root, RAD_PUBKEY).catch((e) => fail(root, e));
}

// Entity pages: the worker rewrites /nostr/<bech32> to this shell; the
// ?id= form is the dev-server fallback (no worker in `astro dev`).
export function initEntity(root) {
  const m = /^\/nostr\/((?:npub|nprofile|note|nevent|naddr)1[02-9ac-hj-np-z]+)\/?$/.exec(location.pathname);
  const raw = m ? m[1] : new URLSearchParams(location.search).get('id');
  if (!raw) { statusLine(root, 'no nostr identifier in the url. expected /nostr/npub1… | note1… | nevent1… | naddr1…'); return; }
  let ptr;
  try { ptr = decode(raw.trim()); } catch (e) { fail(root, e); return; }
  if (ptr.type === 'npub' || ptr.type === 'nprofile') viewProfile(root, ptr.pubkey).catch((e) => fail(root, e));
  else if (ptr.type === 'note') viewNote(root, ptr.id).catch((e) => fail(root, e));
  else if (ptr.type === 'nevent') viewNote(root, ptr.id).catch((e) => fail(root, e));
  else if (ptr.type === 'naddr') viewAddr(root, ptr).catch((e) => fail(root, e));
}

// Essay pages: comments ride the same machinery. `pointer` is a note/nevent
// id or naddr from src/data/nostr-posts.js.
export async function renderComments(root, pointer) {
  const list = root.querySelector('.nc-list');
  try {
    const ptr = decode(pointer.trim());
    let filters, openLink, webLink, count = 0;
    if (ptr.type === 'naddr') {
      const coord = `${ptr.kind}:${ptr.pubkey}:${ptr.identifier}`;
      filters = [{ kinds: [1, 1111], '#a': [coord], limit: 200 }, { kinds: [9735], '#a': [coord], limit: 500 }];
      openLink = `nostr:${naddrEncode(ptr)}`;
      webLink = `https://primal.net/a/${naddrEncode(ptr)}`;
    } else {
      filters = [{ kinds: [1], '#e': [ptr.id], limit: 200 }, { kinds: [9735], '#e': [ptr.id], limit: 500 }];
      openLink = `nostr:${noteEncode(ptr.id)}`;
      webLink = `https://primal.net/e/${noteEncode(ptr.id)}`;
    }
    const related = await query(filters);
    const comments = related.filter((e) => e.kind !== 9735).sort((a, b) => a.created_at - b.created_at);
    const zaps = zapTotals(related.filter((e) => e.kind === 9735));
    const profiles = await fetchProfiles([...new Set(comments.map((c) => c.pubkey))]);
    count = comments.length;

    root.querySelector('.nc-status').innerHTML =
      `${count ? `${count} comment${count > 1 ? 's' : ''}` : 'no comments yet'}` +
      (zaps.sats ? ` · <span class="nv-zap">⚡ ${fmtSats(zaps.sats)} sats</span>` : '') +
      ` — <a href="${esc(openLink)}">reply in your app ↗</a>` +
      ` · <a href="${esc(webLink)}" rel="noopener">web ↗</a>` +
      ` · <a href="${entityHref(pointer.trim())}">view on /nostr</a>`;
    list.innerHTML = comments.map((c) => noteCard(c, profiles, new Map())).join('');
    wireUp(root);
  } catch (e) {
    root.querySelector('.nc-status').textContent = 'comments unavailable: ' + (e?.message || e);
  }
}
