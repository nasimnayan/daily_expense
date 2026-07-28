/* খাতা vault — passphrase, encryption, and on-device storage.
   Everything that touches the key or localStorage lives in this one file. */

const enc = new TextEncoder(), dec = new TextDecoder();

/* PBKDF2 cost. Unlock runs every time the app opens, so this is a balance:
   high enough to matter if the device is stolen, low enough that a mid-range
   phone still opens quickly. The count a blob was written with is stored
   beside it, so this default can move later without locking anyone out of
   data they already have. */
export const ITER = 310000;
const ITER_V1 = 250000;

const K = {
  blob: 'khata.blob', salt: 'khata.salt', meta: 'khata.meta',
  tok: 'khata.tok', iter: 'khata.iter',
};

/* Base64 over a whole buffer, in chunks.
   The obvious one-liner — btoa(String.fromCharCode(...new Uint8Array(b))) —
   spreads every byte into an argument list and overflows the call stack past
   roughly 100 KB. Since every write path goes through seal(), that single
   line used to break local save, GitHub sync and backup export at the same
   moment, silently, at around 700 entries. */
export function b64(buf) {
  const u = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}
export const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export async function deriveKey(pass, salt, iter = ITER) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function seal(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
  return { iv: b64(iv), ct: b64(ct) };
}
export async function unseal(key, pack) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(pack.iv) }, key, unb64(pack.ct));
  return JSON.parse(dec.decode(pt));
}

/* ---------------- vault lifecycle ---------------- */

export const hasVault = () => !!localStorage.getItem(K.blob);

export function storedIter() {
  const n = Number(localStorage.getItem(K.iter));
  if (n) return n;
  return hasVault() ? ITER_V1 : ITER;   // a blob with no recorded count is v1
}

/* First run. Returns the key; the caller then saves a fresh state. */
export async function createVault(pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(pass, salt, ITER);
  localStorage.setItem(K.salt, b64(salt));
  localStorage.setItem(K.iter, String(ITER));
  return key;
}

/* Returns {key, state}. Throws if the passphrase is wrong. */
export async function unlockVault(pass) {
  const salt = unb64(localStorage.getItem(K.salt));
  const key = await deriveKey(pass, salt, storedIter());
  const state = await unseal(key, JSON.parse(localStorage.getItem(K.blob)));
  return { key, state };
}

/* Re-key everything under a new passphrase, at the current cost.
   Carries the sync token across so changing the passphrase does not
   quietly break sync. */
export async function rekey(oldKey, pass, state) {
  const tok = oldKey ? await loadToken(oldKey) : '';
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(pass, salt, ITER);
  localStorage.setItem(K.salt, b64(salt));
  localStorage.setItem(K.iter, String(ITER));
  await saveState(key, state);
  if (tok) await saveToken(key, tok);
  return key;
}

/* Throws on failure, deliberately. The caller must surface it — a save that
   fails quietly is the worst thing this app can do. */
export async function saveState(key, state) {
  state.updatedAt = new Date().toISOString();
  const pack = await seal(key, state);
  localStorage.setItem(K.blob, JSON.stringify(pack));
  setMeta({ dirty: true, updatedAt: state.updatedAt });
}

export function meta() { try { return JSON.parse(localStorage.getItem(K.meta)) || {}; } catch { return {}; } }
export function setMeta(o) { localStorage.setItem(K.meta, JSON.stringify({ ...meta(), ...o })); }

/* The sync token is encrypted at rest too. It only grants write access to one
   private repo, but there is no reason to leave it sitting in the clear. */
export async function saveToken(key, tok) {
  if (!tok) { localStorage.removeItem(K.tok); return; }
  localStorage.setItem(K.tok, JSON.stringify(await seal(key, tok)));
}
export async function loadToken(key) {
  const raw = localStorage.getItem(K.tok);
  if (!raw) return '';
  try {
    const p = JSON.parse(raw);
    if (p && p.iv && p.ct) return await unseal(key, p);
    return '';
  } catch {
    return raw;   // a v1 plaintext token: still usable, re-sealed on next save
  }
}

export const blobSize = () => (localStorage.getItem(K.blob) || '').length;

export function wipeLocal() {
  Object.values(K).forEach(k => localStorage.removeItem(k));
}

/* ---------------- backup file ---------------- */

export async function exportBlob(key, state) {
  const pack = await seal(key, state);
  return JSON.stringify(
    { khata: 2, salt: localStorage.getItem(K.salt), iter: storedIter(), ...pack }, null, 1);
}

/* Decrypts a backup using the salt and cost recorded inside the file, so a
   file written under older settings still restores. */
export async function importBlob(text, pass) {
  const j = JSON.parse(text);
  const key = await deriveKey(pass, unb64(j.salt), Number(j.iter) || ITER_V1);
  return unseal(key, j);
}
