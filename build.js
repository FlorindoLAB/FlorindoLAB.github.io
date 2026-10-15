"use strict";
// Génère le site final dans ./dist : copie des fichiers + pages statiques pour le référencement
// (accueil et fiches d'outils, en français et en anglais), sitemap.xml et robots.txt.
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;
const OUT = path.join(ROOT, "dist");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const json = (p) => JSON.parse(read(p));
const S = json("data/site.json");
const T = json("data/tools.json");
const I = { fr: json("i18n/fr.json"), en: json("i18n/en.json") };
const DOMAIN = fs.existsSync(path.join(ROOT, "CNAME")) ? read("CNAME").trim() : "florindolab.com";
const ORIGIN = "https://" + DOMAIN;
const TPL = read("index.html");

const FB = {
  new: { fr: "Nouveau", en: "New" },
  nav_contact: { fr: "Contact", en: "Contact" },
  dlgh: { fr: "Télécharger sur GitHub", en: "Download on GitHub" },
  suffix: { fr: "logiciel gratuit", en: "free software" },
};
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const tx = (lang, k) => (I[lang] && I[lang][k]) || (FB[k] && FB[k][lang]) || "";
const loc = (o, lang) => (o && (o[lang] || o.en || o.fr)) || "";
const abs = (u) => (/^(https?:)?\/\//.test(u) || u.charAt(0) === "/" ? u : "/" + u);
const turl = (id, lang) => (lang === "en" ? "/en/tools/" : "/outils/") + encodeURIComponent(id) + "/";
const homeU = (lang) => (lang === "en" ? "/en/" : "/");
const sub = (s, re, fn) => { if (!re.test(s)) throw new Error("Motif introuvable dans index.html : " + re); return s.replace(re, () => fn); };

// mini rendu du texte, même syntaxe que sur le site (## titre, - liste, **gras**, [mot](adresse))
function rich(q) {
  return esc(q)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\b[0-9A-Fa-f]{64}\b/g, '<code class="hash">$&</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|#\/[^)\s]*)\)/g, (m, a, u) => `<a href="${u}"${u[0] === "#" ? "" : ' target="_blank" rel="noopener"'}>${a}</a>`)
    .replace(/\n/g, "<br>");
}
function blk(q) {
  q = q.trim();
  if (!q) return "";
  if (/^## /.test(q)) {
    const n = q.indexOf("\n"), r = n < 0 ? "" : q.slice(n + 1).trim();
    return "<h3>" + rich((n < 0 ? q : q.slice(0, n)).slice(3)) + "</h3>" + (r ? blk(r) : "");
  }
  const ls = q.split("\n");
  if (ls.every((l) => /^- /.test(l.trim()))) return "<ul>" + ls.map((l) => "<li>" + rich(l.trim().slice(2)) + "</li>").join("") + "</ul>";
  return "<p>" + rich(q) + "</p>";
}
const bodyHtml = (s) => (s ? s.replace(/\r/g, "").split(/\n\s*\n/).map(blk).join("") : "");

function tags(x, lang) {
  const c = (x.categories || []).map((id) => {
    const k = T.categories.find((y) => y.id === id);
    return `<span class="tag cat">${esc(k ? loc(k, lang) : id)}</span>`;
  });
  if (x.isNew) c.unshift(`<span class="tag new">${esc(tx(lang, "new"))}</span>`);
  const p = (x.platforms || []).map((id) => `<span class="tag">${esc(tx(lang, "p_" + id))}</span>`);
  if (x.status === "soon") p.push(`<span class="tag soon">${esc(tx(lang, "soon"))}</span>`);
  return `<div class="tags">${c.concat(p).join("")}</div>`;
}

function homeMain(lang) {
  const rows = T.tools.map((x) => {
    const soon = x.status === "soon", u = turl(x.id, lang);
    return `<article class="tool"><div><h3><a href="${u}">${esc(loc(x.name, lang))}</a></h3>${tags(x, lang)}</div><p>${esc(loc(x.summary, lang))}</p><a class="btn${soon ? "" : " main"}" href="${u}">${esc(tx(lang, soon ? "soon" : "open"))}</a></article>`;
  }).join("");
  return `<div class="hero"><div><h1>${esc(tx(lang, "hero_title"))}</h1><p>${esc(tx(lang, "hero_text"))}</p></div></div><section class="sec" id="tools-sec"><h2>${esc(tx(lang, "tools"))}</h2><p class="lead">${esc(tx(lang, "tools_lead"))}</p>${rows}</section>`;
}
function toolMain(x, lang) {
  const web = x.webUrl ? `<p><a class="btn main" href="${esc(abs(x.webUrl))}">${esc(tx(lang, "open_web"))}</a></p>` : "";
  const dl = x.releasePrefix ? `<p><a class="btn main" href="https://github.com/${esc(S.repo)}/releases">${esc(tx(lang, "dlgh"))}</a></p>` : "";
  return `<a class="back" href="${homeU(lang)}#/tools">${esc(tx(lang, "back"))}</a><header class="th"><h1 class="tt">${esc(loc(x.name, lang))}</h1>${tags(x, lang)}<p class="lead">${esc(loc(x.summary, lang))}</p></header><div class="tg"><div class="tmain">${bodyHtml(loc(x.description, lang))}</div><aside class="tside">${web}${dl}<p class="lic"><a href="#/license">${esc(tx(lang, "license_link"))}</a></p></aside></div>`;
}

function render(o) {
  const url = ORIGIN + o.path;
  const head = [
    `<link rel="canonical" href="${url}">`,
    `<link rel="alternate" hreflang="fr" href="${ORIGIN + o.fr}">`,
    `<link rel="alternate" hreflang="en" href="${ORIGIN + o.en}">`,
    `<link rel="alternate" hreflang="x-default" href="${ORIGIN + o.fr}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="FlorindoLAB">`,
    `<meta property="og:title" content="${esc(o.title)}">`,
    `<meta property="og:description" content="${esc(o.desc)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${ORIGIN}/assets/og-image.png">`,
    `<meta property="og:locale" content="${o.lang === "en" ? "en_US" : "fr_FR"}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<script type="application/ld+json">${JSON.stringify(o.ld).replace(/</g, "\\u003c")}</script>`,
  ].join("\n");
  let h = TPL;
  h = sub(h, /<html lang="fr">/, `<html lang="${o.lang}" data-fixed-lang="${o.lang}" data-route="${o.route}">`);
  h = sub(h, /<title>[^<]*<\/title>/, `<title>${esc(o.title)}</title>`);
  h = sub(h, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(o.desc)}">\n${head}`);
  h = sub(h, /<main id="app" class="wrap">[\s\S]*?<\/main>/, `<main id="app" class="wrap">${o.main}</main>`);
  h = h.replace(/(data-i18n="([a-z_]+)"[^>]*>)([^<]*)</g, (m, a, k, t) => a + esc(tx(o.lang, k) || t) + "<");
  return h;
}

// ---- copie du site ----
const SKIP = new Set([".git", ".github", "dist", "node_modules", "build.js", "README.md"]);
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (src === ROOT && SKIP.has(e.name)) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}
fs.rmSync(OUT, { recursive: true, force: true });
copyDir(ROOT, OUT);
const write = (rel, content) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };

// ---- pages ----
const urls = [];
const OSNAME = { windows: "Windows", android: "Android", web: "Web browser", dctl: "DaVinci Resolve" };
const MEDIA = ["video", "vfx", "photo", "dessin", "son"];
for (const lang of ["fr", "en"]) {
  const sep = lang === "en" ? ": " : " : ";
  write(lang === "en" ? "en/index.html" : "index.html", render({
    lang, route: "home", path: homeU(lang), fr: homeU("fr"), en: homeU("en"),
    title: "FlorindoLAB" + sep + tx(lang, "tagline"), desc: tx(lang, "hero_text"), main: homeMain(lang),
    ld: { "@context": "https://schema.org", "@type": "WebSite", name: "FlorindoLAB", url: ORIGIN + "/", inLanguage: lang },
  }));
  for (const x of T.tools) {
    const name = loc(x.name, lang), summary = loc(x.summary, lang);
    write((lang === "en" ? "en/tools/" : "outils/") + x.id + "/index.html", render({
      lang, route: "tool/" + x.id, path: turl(x.id, lang), fr: turl(x.id, "fr"), en: turl(x.id, "en"),
      title: name.includes("FlorindoLAB") ? name + sep + tx(lang, "suffix") : name + " | FlorindoLAB",
      desc: summary, main: toolMain(x, lang),
      ld: {
        "@context": "https://schema.org", "@type": "SoftwareApplication", name, description: summary, url: ORIGIN + turl(x.id, lang), inLanguage: lang,
        applicationCategory: (x.categories || []).some((c) => MEDIA.includes(c)) ? "MultimediaApplication" : "UtilitiesApplication",
        operatingSystem: (x.platforms || []).map((p) => OSNAME[p] || p).join(", "),
        isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        image: ORIGIN + "/assets/og-image.png", publisher: { "@type": "Organization", name: "FlorindoLAB", url: ORIGIN },
      },
    }));
  }
}

// ---- sitemap et robots ----
const entries = [[homeU("fr"), homeU("en")], ...T.tools.map((x) => [turl(x.id, "fr"), turl(x.id, "en")])];
const alt = (f, e) => `<xhtml:link rel="alternate" hreflang="fr" href="${ORIGIN + f}"/><xhtml:link rel="alternate" hreflang="en" href="${ORIGIN + e}"/><xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN + f}"/>`;
const sm = entries.flatMap(([f, e]) => [f, e].map((u) => `<url><loc>${ORIGIN + u}</loc>${alt(f, e)}</url>`)).join("\n");
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sm}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
console.log("Site généré dans dist/ :", entries.length * 2, "pages dans le sitemap");
