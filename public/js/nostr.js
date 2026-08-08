// Client-side nostr protocol module — the njump replacement runs on this.
// Zero dependencies by design: a bech32/NIP-19 codec, a tiny relay pool over
// native WebSocket, and query helpers. Display-only viewer: events are not
// signature-verified in the browser (v2 = worker-side SSR can add that).

// Identity + relays are GENERATED from the Nostr registry (nostr-publisher) —
// this file carried its own literals until 2026-08-08. Healthy relays sort
// first; the degraded one rides last for reach, never load-bearing.
export { RELAYS, RAD_PUBKEY } from './nostr-registry.generated.js';

// ---- bech32 (BIP-173, no length cap per NIP-19) ----

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values) {
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((b >> i) & 1) chk ^= GEN[i];
  }
  return chk;
}

function hrpExpand(hrp) {
  const out = [];
  for (const c of hrp) out.push(c.charCodeAt(0) >> 5);
  out.push(0);
  for (const c of hrp) out.push(c.charCodeAt(0) & 31);
  return out;
}

function bech32Decode(str) {
  const s = str.toLowerCase();
  const pos = s.lastIndexOf('1');
  if (pos < 1) throw new Error('not bech32');
  const hrp = s.slice(0, pos);
  const words = [...s.slice(pos + 1)].map((c) => CHARSET.indexOf(c));
  if (words.includes(-1) || polymod([...hrpExpand(hrp), ...words]) !== 1) {
    throw new Error('bad bech32 checksum');
  }
  return { hrp, words: words.slice(0, -6) };
}

function bech32Encode(hrp, words) {
  const values = [...hrpExpand(hrp), ...words, 0, 0, 0, 0, 0, 0];
  const mod = polymod(values) ^ 1;
  const checksum = [];
  for (let i = 0; i < 6; i++) checksum.push((mod >> (5 * (5 - i))) & 31);
  return hrp + '1' + [...words, ...checksum].map((w) => CHARSET[w]).join('');
}

function fromWords(words) {
  let acc = 0, bits = 0;
  const out = [];
  for (const w of words) {
    acc = (acc << 5) | w;
    bits += 5;
    while (bits >= 8) { bits -= 8; out.push((acc >> bits) & 0xff); }
  }
  return new Uint8Array(out);
}

function toWords(bytes) {
  let acc = 0, bits = 0;
  const out = [];
  for (const b of bytes) {
    acc = (acc << 8) | b;
    bits += 8;
    while (bits >= 5) { bits -= 5; out.push((acc >> bits) & 31); }
  }
  if (bits) out.push((acc << (5 - bits)) & 31);
  return out;
}

const toHex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) => new Uint8Array(hex.match(/../g).map((h) => parseInt(h, 16)));
const utf8 = (bytes) => new TextDecoder().decode(bytes);

// ---- NIP-19 entities ----

export function decode(nip19) {
  const { hrp, words } = bech32Decode(nip19.replace(/^nostr:/, ''));
  const data = fromWords(words);
  if (hrp === 'npub') return { type: 'npub', pubkey: toHex(data) };
  if (hrp === 'note') return { type: 'note', id: toHex(data) };
  const tlv = {};
  for (let i = 0; i + 1 < data.length; ) {
    const t = data[i], l = data[i + 1];
    (tlv[t] ??= []).push(data.slice(i + 2, i + 2 + l));
    i += 2 + l;
  }
  const relays = (tlv[1] || []).map(utf8);
  if (hrp === 'nprofile') return { type: 'nprofile', pubkey: toHex(tlv[0][0]), relays };
  if (hrp === 'nevent') {
    return {
      type: 'nevent', id: toHex(tlv[0][0]), relays,
      author: tlv[2] ? toHex(tlv[2][0]) : null,
      kind: tlv[3] ? u32(tlv[3][0]) : null,
    };
  }
  if (hrp === 'naddr') {
    return {
      type: 'naddr', identifier: utf8(tlv[0][0]), relays,
      pubkey: toHex(tlv[2][0]), kind: u32(tlv[3][0]),
    };
  }
  throw new Error('unsupported entity: ' + hrp);
}

const u32 = (b) => (b[0] << 24 | b[1] << 16 | b[2] << 8 | b[3]) >>> 0;

export const npubEncode = (hex) => bech32Encode('npub', toWords(fromHex(hex)));
export const noteEncode = (hex) => bech32Encode('note', toWords(fromHex(hex)));

export function naddrEncode({ identifier, pubkey, kind }) {
  const id = new TextEncoder().encode(identifier);
  const pk = fromHex(pubkey);
  const kd = new Uint8Array([kind >> 24 & 0xff, kind >> 16 & 0xff, kind >> 8 & 0xff, kind & 0xff]);
  const tlv = new Uint8Array([0, id.length, ...id, 2, pk.length, ...pk, 3, 4, ...kd]);
  return bech32Encode('naddr', toWords(tlv));
}

// ---- relay pool ----

const sockets = new Map();

function openRelay(url) {
  let entry = sockets.get(url);
  if (entry) return entry;
  const subs = new Map();
  const ready = new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.onopen = () => resolve(ws);
    ws.onerror = () => reject(new Error('relay unreachable: ' + url));
    ws.onclose = () => {
      sockets.delete(url);
      for (const sub of subs.values()) sub.onEose();
    };
    ws.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      const sub = subs.get(msg[1]);
      if (!sub) return;
      if (msg[0] === 'EVENT') sub.onEvent(msg[2]);
      else if (msg[0] === 'EOSE' || msg[0] === 'CLOSED') sub.onEose();
    };
  });
  entry = { ready, subs };
  sockets.set(url, entry);
  return entry;
}

// Run one REQ (one or more filters) against every relay; resolve with
// deduped events when all relays EOSE or the timeout lands. A dead relay
// never blocks the others.
export async function query(filters, { timeout = 6000 } = {}) {
  const seen = new Map();
  await Promise.all(RELAYS.map(async (url) => {
    try {
      const { ready, subs } = openRelay(url);
      const ws = await ready;
      await new Promise((resolve) => {
        const id = 'rv' + Math.random().toString(36).slice(2, 10);
        const timer = setTimeout(finish, timeout);
        function finish() {
          clearTimeout(timer);
          subs.delete(id);
          try { ws.send(JSON.stringify(['CLOSE', id])); } catch { /* closing */ }
          resolve();
        }
        subs.set(id, {
          onEvent: (ev) => { if (ev && ev.id && !seen.has(ev.id)) seen.set(ev.id, ev); },
          onEose: finish,
        });
        ws.send(JSON.stringify(['REQ', id, ...filters]));
      });
    } catch { /* relay down — the others carry it */ }
  }));
  return [...seen.values()];
}

// Replaceable events (kind 0, 3000x): different relays return different
// versions — keep only the newest per author(+kind+d).
export function latestPer(events) {
  const best = new Map();
  for (const ev of events) {
    const d = (ev.tags.find((t) => t[0] === 'd') || [])[1] || '';
    const key = `${ev.kind}:${ev.pubkey}:${d}`;
    if (!best.has(key) || best.get(key).created_at < ev.created_at) best.set(key, ev);
  }
  return [...best.values()];
}

export const tagValue = (ev, name) => (ev.tags.find((t) => t[0] === name) || [])[1];

// NIP-10: which event is this note replying to? Prefer the "reply" marker,
// fall back to "root", then to positional (last e-tag).
export function replyTarget(ev) {
  const etags = ev.tags.filter((t) => t[0] === 'e');
  if (!etags.length) return null;
  const marked = (m) => etags.find((t) => t[3] === m);
  return (marked('reply') || marked('root') || etags[etags.length - 1])[1];
}

export function rootTarget(ev) {
  const etags = ev.tags.filter((t) => t[0] === 'e');
  const root = etags.find((t) => t[3] === 'root');
  return root ? root[1] : etags.length ? etags[0][1] : null;
}

// ---- zaps (NIP-57 receipts, kind 9735) ----

// Amount lives in the receipt's bolt11 invoice hrp: lnbc<amount><multiplier>.
export function bolt11Sats(invoice) {
  const m = /^lnbc(\d+)([munp])?/i.exec(invoice || '');
  if (!m) return 0;
  const mult = { m: 1e-3, u: 1e-6, n: 1e-9, p: 1e-12 }[m[2]] ?? 1;
  return Math.round(parseInt(m[1], 10) * mult * 1e8);
}

export function zapTotals(receipts) {
  let sats = 0;
  for (const r of receipts) sats += bolt11Sats(tagValue(r, 'bolt11'));
  return { count: receipts.length, sats };
}

// ---- query helpers ----

export async function fetchProfiles(pubkeys) {
  if (!pubkeys.length) return new Map();
  const events = latestPer(await query([{ kinds: [0], authors: pubkeys }]));
  const map = new Map();
  for (const ev of events) {
    try { map.set(ev.pubkey, JSON.parse(ev.content)); } catch { /* junk kind-0 */ }
  }
  return map;
}

export async function fetchEventById(id) {
  const events = await query([{ ids: [id] }]);
  return events[0] || null;
}

export async function fetchAddr({ kind, pubkey, identifier }) {
  const events = latestPer(await query([{ kinds: [kind], authors: [pubkey], '#d': [identifier] }]));
  return events[0] || null;
}

// Best-effort NIP-05 check: fetch the named domain's nostr.json and compare
// pubkeys. Many domains block cross-origin reads — null means "couldn't
// check", not "fake".
export async function verifyNip05(nip05, pubkey) {
  const m = /^([a-z0-9\-_.]+)@([a-z0-9\-.]+)$/i.exec(nip05 || '');
  if (!m) return null;
  try {
    const res = await fetch(`https://${m[2]}/.well-known/nostr.json?name=${m[1]}`, { mode: 'cors' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.names?.[m[1]] === pubkey;
  } catch {
    return null;
  }
}
