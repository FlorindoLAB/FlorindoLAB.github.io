"use strict";
// Relève chaque jour le nombre de téléchargements de chaque fichier des Releases GitHub
// et l'ajoute à data/stats-history.json (utilisé par la page /#/stats pour tracer les courbes).
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const FILE = path.join(ROOT, "data", "stats-history.json");
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "site.json"), "utf8"));

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
  const releases = (await fetchReleases()).filter((r) => !r.draft);
  const counts = {};
  for (const r of releases) {
    const a = {};
    for (const x of r.assets || []) a[x.name] = x.download_count || 0;
    counts[r.tag_name] = a;
  }
  const hist = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : { days: [] };
  const today = process.env.SNAPSHOT_DATE || new Date().toISOString().slice(0, 10);
  hist.days = (hist.days || []).filter((d) => d.d !== today);
  hist.days.push({ d: today, c: counts });
  hist.days.sort((a, b) => a.d.localeCompare(b.d));
  hist.updated = new Date().toISOString();
  fs.writeFileSync(FILE, JSON.stringify(hist) + "\n");
  console.log(`Relevé du ${today} : ${Object.keys(counts).length} Release(s), ${hist.days.length} jour(s) d'historique.`);
})().catch((e) => { console.error(e.message); process.exit(1); });
