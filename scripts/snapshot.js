"use strict";
// Relève chaque jour le nombre de téléchargements de chaque fichier des Releases GitHub et l'ajoute à
// l'historique CHIFFRÉ data/stats-history.enc.json (AES-256-GCM, clé dérivée du mot de passe STATS_KEY).
// Sans le mot de passe, personne ne peut lire l'historique : la page /#/stats le déchiffre dans le navigateur.
const fs = require("fs");
const path = require("path");
const { webcrypto } = require("crypto");
const subtle = webcrypto.subtle;
const ROOT = path.join(__dirname, "..");
const ENC = path.join(ROOT, "data", "stats-history.enc.json");
const PLAIN = path.join(ROOT, "data", "stats-history.json"); // ancien format non chiffré (migré puis supprimé)
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "site.json"), "utf8"));
const PASS = process.env.STATS_KEY;
const ITER = 600000;
const b64 = (u) => Buffer.from(u).toString("base64");
const unb64 = (s) => new Uint8Array(Buffer.from(s, "base64"));

async function deriveKey(pw, salt, iter) {
  const k = await subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, k, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function encrypt(obj, pw) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16)), iv = webcrypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pw, salt, ITER);
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return { v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(ct)) };
}
async function decrypt(o, pw) {
  const key = await deriveKey(pw, unb64(o.salt), o.iter);
  return JSON.parse(new TextDecoder().decode(await subtle.decrypt({ name: "AES-GCM", iv: unb64(o.iv) }, key, unb64(o.data))));
}
async function fetchReleases() {
  if (process.env.SNAPSHOT_FIXTURE) return JSON.parse(fs.readFileSync(process.env.SNAPSHOT_FIXTURE, "utf8"));
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const headers = { Accept: "application/vnd.github+json", "User-Agent": "florindolab-stats" };
    if (process.env.GITHUB_TOKEN) headers.Authorization = "Bearer " + process.env.GITHUB_TOKEN;
    const r = await fetch(`https://api.github.com/repos/${site.repo}/releases?per_page=100&page=${page}`, { headers });
    if (!r.ok) throw new Error("API GitHub : erreur " + r.status);
    const l = await r.json();
    out.push(...l);
    if (l.length < 100) break;
  }
  return out;
}

(async () => {
  if (!PASS || PASS.length < 8) throw new Error("Le secret STATS_KEY est absent ou trop court : l'historique ne peut pas être chiffré.");
  const releases = (await fetchReleases()).filter((r) => !r.draft);
  const counts = {};
  for (const r of releases) {
    const a = {};
    for (const x of r.assets || []) a[x.name] = x.download_count || 0;
    counts[r.tag_name] = a;
  }
  let hist = { days: [] };
  if (fs.existsSync(ENC)) hist = await decrypt(JSON.parse(fs.readFileSync(ENC, "utf8")), PASS);
  else if (fs.existsSync(PLAIN)) hist = JSON.parse(fs.readFileSync(PLAIN, "utf8"));
  const today = process.env.SNAPSHOT_DATE || new Date().toISOString().slice(0, 10);
  hist.days = (hist.days || []).filter((d) => d.d !== today);
  hist.days.push({ d: today, c: counts });
  hist.days.sort((a, b) => a.d.localeCompare(b.d));
  hist.updated = new Date().toISOString();
  fs.writeFileSync(ENC, JSON.stringify(await encrypt(hist, PASS)) + "\n");
  if (fs.existsSync(PLAIN)) fs.rmSync(PLAIN);
  console.log(`Relevé du ${today} : ${Object.keys(counts).length} Release(s), ${hist.days.length} jour(s) d'historique (chiffré).`);
})().catch((e) => { console.error(e.message); process.exit(1); });
