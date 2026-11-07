(function () {
"use strict";
var app = document.getElementById("app"), sel = document.getElementById("lang");
var S, T, L = {}, LG = [], lang = "fr", cat = "all", pr = null;
var FIXED = document.documentElement.getAttribute("data-fixed-lang") || "", PAGE = document.documentElement.getAttribute("data-route") || "";
var APP = { contact: { fr: "contact", en: "contact" }, support: { fr: "soutenir", en: "support" }, license: { fr: "licence", en: "license" } };
function aurl(k) { return FIXED ? (lang === "en" ? "/en/" : "/") + APP[k][lang === "en" ? "en" : "fr"] + "/" : "#/" + k; }
function cur() { return (location.hash.replace(/^#\/?/, "") || PAGE.replace(/^\//, "")).split(/[\/?]/)[0]; }
function fixLink(u) {
  var m = /^#\/(contact|support|license)(\?.*)?$/.exec(u);
  if (m) return aurl(m[1]) + (m[2] || "");
  var g = /^#\/legal\/([\w-]+)$/.exec(u);
  if (g && FIXED) { var p = LG.filter(function (x) { return x.id === g[1]; })[0]; if (p) return pageUrl(p); }
  return u;
}
function hb() { return FIXED ? (FIXED === "en" ? "/en/" : "/") : ""; }
function turl(id) { return FIXED ? (lang === "en" ? "/en/tools/" : "/outils/") + id + "/" : "#/tool/" + id; }
function abs(u) { return /^(https?:)?\/\//.test(u) || u.charAt(0) === "/" ? u : "/" + u; }
var HERO = "<svg viewBox=\"0 0 640 360\" role=\"img\"><rect x=\"1\" y=\"1\" width=\"638\" height=\"358\" fill=\"none\" stroke=\"currentColor\" stroke-opacity=\".35\"/><rect class=\"safe\" x=\"32\" y=\"18\" width=\"576\" height=\"324\"/><rect class=\"safe\" x=\"64\" y=\"36\" width=\"512\" height=\"288\"/><line class=\"guide\" x1=\"213.3\" y1=\"0\" x2=\"213.3\" y2=\"360\"/><line class=\"guide\" x1=\"426.6\" y1=\"0\" x2=\"426.6\" y2=\"360\"/><line class=\"guide\" x1=\"0\" y1=\"120\" x2=\"640\" y2=\"120\"/><line class=\"guide\" x1=\"0\" y1=\"240\" x2=\"640\" y2=\"240\"/><line class=\"guide\" x1=\"0\" y1=\"360\" x2=\"640\" y2=\"0\" stroke-opacity=\".35\"/><circle class=\"guide\" cx=\"426.6\" cy=\"120\" r=\"14\"/><circle cx=\"426.6\" cy=\"120\" r=\"3\" fill=\"var(--accent)\"/></svg>";
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function loc(o) { return (o && (o[lang] || o.en || o.fr)) || ""; }
var DEF = {
  notice: { fr: "Notice d'utilisation (PDF)", en: "User guide (PDF)" },
  nav_contact: { fr: "Contact", en: "Contact" }, report_bug: { fr: "Signaler un bug ou poser une question", en: "Report a bug or ask a question" },
  contact_title: { fr: "Contact", en: "Contact" },
  contact_lead: { fr: "Un bug, une question, une idée ? Écrivez-moi : plus vous me donnez de détails, plus il me sera facile de vous aider.", en: "A bug, a question, an idea? Write to me: the more details you give, the easier it is for me to help." },
  f_type: { fr: "Type de message", en: "Message type" }, t_bug: { fr: "Bug", en: "Bug" }, t_question: { fr: "Question", en: "Question" }, t_idea: { fr: "Suggestion", en: "Suggestion" },
  f_tool: { fr: "Logiciel concerné", en: "Software concerned" }, f_other: { fr: "Autre / le site", en: "Other / the website" },
  f_name: { fr: "Votre nom", en: "Your name" }, f_email: { fr: "Votre adresse e-mail", en: "Your email address" }, f_email_hint: { fr: "Uniquement pour vous répondre.", en: "Only used to reply to you." },
  f_details: { fr: "Détails techniques (facultatif)", en: "Technical details (optional)" }, f_details_ph: { fr: "Version du logiciel, version de Windows…", en: "Software version, Windows version…" },
  f_message: { fr: "Votre message", en: "Your message" }, f_send: { fr: "Envoyer", en: "Send" }, f_sending: { fr: "Envoi…", en: "Sending…" },
  f_ok: { fr: "Merci ! Votre message est bien parti.", en: "Thank you! Your message has been sent." },
  f_err: { fr: "Impossible d'envoyer le message pour le moment. Réessayez plus tard.", en: "Could not send the message right now. Please try again later." },
  f_captcha: { fr: "Merci de valider le contrôle anti-robot.", en: "Please complete the anti-bot check." },
  f_unconfigured: { fr: "Le formulaire n'est pas encore disponible.", en: "The form is not available yet." },
  f_privacy: { fr: "Les informations saisies servent uniquement à vous répondre. Elles transitent par le service Web3Forms, et le contrôle anti-robot est assuré par hCaptcha.", en: "The information you enter is only used to reply to you. It goes through the Web3Forms service, and the anti-bot check is provided by hCaptcha." }
};
var X = {
  stats_title: ["Statistiques de téléchargement", "Download statistics"],
  stats_lead: ["Nombre de téléchargements des fichiers publiés dans les Releases GitHub, par outil et par version.", "Number of downloads of the files published in the GitHub Releases, by tool and by version."],
  stats_note: ["Ces chiffres comptent tous les téléchargements du fichier (depuis le site ou par lien direct, robots inclus) et ne mesurent pas le nombre de visiteurs.", "These figures count every download of the file (from the site or through a direct link, bots included) and do not measure the number of visitors."],
  stats_total: ["Téléchargements au total", "Total downloads"], stats_tools: ["Outils publiés", "Published tools"], stats_versions: ["Versions publiées", "Published versions"],
  stats_downloads: ["Téléchargements", "Downloads"], stats_other: ["Autres fichiers", "Other files"], dl_count: ["téléchargements", "downloads"],
  car_label: ["Aperçu des outils", "Tools preview"], car_prev: ["Précédent", "Previous"], car_next: ["Suivant", "Next"], latest_all: ["Dernières versions", "Latest versions"],
  mac_hint: ["Quel Mac ? Menu Pomme > À propos de ce Mac : « Puce Apple M… » = Apple Silicon, « Processeur Intel » = Intel.", "Which Mac? Apple menu > About This Mac: “Chip Apple M…” = Apple Silicon, “Processor Intel” = Intel."],
  copy: ["Copier", "Copy"], copied: ["Copié", "Copied"],
  banner: ["Développeur indépendant : mes logiciels ne sont pas encore signés (le certificat est payant), donc Windows et macOS affichent une alerte au premier lancement.", "Independent developer here: my software isn't code-signed yet (the certificate is paid), so Windows and macOS show a warning on first launch."],
  banner_link: ["Pourquoi, et comment faire", "Why, and what to do"],
  alertnote: ["Une alerte au premier lancement ? C'est normal : voici pourquoi et comment faire.", "A warning on first launch? That's normal: here's why and what to do."],
  stats_evo: ["Évolution des téléchargements", "Download trends"],
  stats_none_hist: ["L'historique se construit jour après jour : un relevé est enregistré chaque nuit. Revenez demain pour voir la courbe.", "The history builds up day by day: a snapshot is recorded every night. Come back tomorrow to see the chart."],
  stats_alltools: ["Tous les outils", "All tools"], stats_perday: ["Par jour", "Per day"], stats_cumul: ["Cumul", "Cumulative"],
  stats_p7: ["7 jours", "7 days"], stats_p30: ["30 jours", "30 days"], stats_p90: ["90 jours", "90 days"], stats_pall: ["Tout", "All"],
  stats_ptotal: ["Sur la période", "Over the period"], stats_best: ["Meilleur jour", "Best day"], stats_avg: ["Moyenne par jour", "Average per day"],
  stats_totshort: ["au total", "in total"], stats_since: ["Relevés depuis le", "Tracked since"],
  stats_pw: ["Mot de passe", "Password"], stats_unlock: ["Déverrouiller", "Unlock"], stats_badpw: ["Mot de passe incorrect.", "Wrong password."],
  stats_nofile: ["Les statistiques ne sont pas encore disponibles : le premier relevé n'a pas encore eu lieu.", "Statistics are not available yet: the first snapshot has not been taken."],
  car_pause: ["Mettre en pause", "Pause"], car_play: ["Reprendre", "Play"], shots: ["Captures d'écran", "Screenshots"]
};
Object.keys(X).forEach(function (k) { DEF[k] = { fr: X[k][0], en: X[k][1] }; });
function t(k) { return (L[lang] && L[lang][k]) || (L.en && L.en[k]) || (DEF[k] && (DEF[k][lang] || DEF[k].en)) || k; }
function get(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
function dt(s) { return new Date(s).toLocaleDateString(lang, { year: "numeric", month: "long", day: "numeric" }); }
function sz(n) { var m = n > 1048576, v = m ? n / 1048576 : n / 1024; return new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(v) + (m ? " MB" : " KB"); }
function note(s) { s = (s || "").replace(/\s*\n+\s*/g, " ").trim(); return s.length > 140 ? s.slice(0, 140) + "…" : s; }

function tags(x) {
  var c = (x.categories || []).map(function (v) { return '<span class="tag cat">' + esc(catLabel(v)) + "</span>"; });
  var p = (x.platforms || []).map(function (id) { return '<span class="tag">' + esc(plat(id)) + "</span>"; });
  if (x.isNew) c.unshift('<span class="tag new">' + esc(t("new")) + "</span>");
  if (x.status === "soon") p.push('<span class="tag soon">' + esc(t("soon")) + "</span>");
  return '<div class="tags">' + c.concat(p).join("") + "</div>";
}
function chip(id, label) { return '<button type="button" class="chip" data-f="' + esc(id) + '" aria-pressed="' + (cat === id) + '">' + esc(label) + "</button>"; }
function row(x) {
  var soon = x.status === "soon";
  return '<article class="tool"><div><h3><a href="' + turl(x.id) + '">' + esc(loc(x.name)) + "</a></h3>" + tags(x) + "</div><p>" + esc(loc(x.summary)) + '</p><a class="btn' + (soon ? "" : " main") + '" href="' + turl(x.id) + '">' + esc(t(soon ? "soon" : "open")) + "</a></article>";
}
function home() {
  var list = T.tools.filter(function (x) { return cat === "all" || (x.categories || []).some(function (v) { return catKey(v) === cat; }); });
  app.innerHTML = '<div class="hero"><div><h1>' + esc(t("hero_title")) + "</h1><p>" + esc(t("hero_text")) + '</p><a class="btn main" href="#/tools">' + esc(t("see_tools")) + '</a><a class="btn" href="' + aurl("support") + '">' + esc(t("support_project")) + '</a></div>' + heroVisual() + "</div>" + feat() +
    '<section class="sec" id="tools-sec"><h2>' + esc(t("tools")) + '</h2><p class="lead">' + esc(t("tools_lead")) + '</p><div class="chips" role="group">' + chip("all", t("all")) + catList().map(function (c) { return chip(c.k, c.label); }).join("") + "</div>" +
    (list.length ? list.map(row).join("") : '<p class="empty">' + esc(t("empty")) + "</p>") + "</section>";
  app.querySelectorAll(".chip").forEach(function (b) { b.onclick = function () { cat = b.getAttribute("data-f"); home(); }; });
  carousel();
}
function releases() {
  if (!pr) pr = get("https://api.github.com/repos/" + S.repo + "/releases?per_page=100").catch(function (e) { pr = null; throw e; });
  return pr;
}
function fill(box, x, all) {
  var p = x.releasePrefix + "-v", rs = all.filter(function (r) { return !r.draft && r.tag_name.indexOf(p) === 0; });
  if (!rs.length) { box.innerHTML = '<p class="empty">' + esc(t("no_release")) + "</p>"; return; }
  var rows = rs.map(function (q) {
    return "<tr><td>" + esc(q.tag_name.slice(p.length)) + "</td><td>" + esc(dt(q.published_at)) + "</td><td>" + esc(note(q.body)) + "</td><td>" + q.assets.map(function (a) { return '<a data-dl href="' + esc(a.browser_download_url) + '">' + esc(a.name) + "</a>"; }).join("<br>") + "</td></tr>";
  }).join("");
  var gs = groups(x, rs), rl = [], head, ks = gs.map(function (g) { return g.k; });
  gs.forEach(function (g) { if (rl.indexOf(g.r) < 0) rl.push(g.r); });
  if (rl.length <= 1) {
    var r = rl[0] || rs[0];
    head = '<div class="dl-head"><div><h2>' + esc(t("latest")) + " " + esc(r.tag_name.slice(p.length)) + '</h2><p class="ver">' + esc(dt(r.published_at)) + "</p>" + cnt(rs) + "</div><div>" + gs.map(function (g) { return dlbtn(x, g.a, g.k); }).join("") + "</div></div>";
  } else {
    head = '<div class="dl-head"><h2>' + esc(t("latest_all")) + "</h2>" + cnt(rs) + "</div>" + gs.map(function (g) { return '<div class="pg"><p class="pn"><b>' + esc(plat(g.k)) + "</b> " + esc(g.r.tag_name.slice(p.length)) + ", " + esc(dt(g.r.published_at)) + "</p>" + dlbtn(x, g.a, "") + "</div>"; }).join("");
  }
  box.innerHTML = head + (ks.indexOf("macos-arm") > -1 && ks.indexOf("macos-intel") > -1 ? '<p class="hint">' + esc(t("mac_hint")) + "</p>" : "") + (secPage() ? '<p class="alertnote"><a href="' + esc(secUrl()) + '">' + esc(t("alertnote")) + "</a></p>" : "") +
    (rs.length > 1 ? "<details><summary>" + esc(t("history")) + '</summary><div class="scroll"><table><thead><tr><th>' + esc(t("version")) + "</th><th>" + esc(t("date")) + "</th><th>" + esc(t("notes")) + "</th><th>" + esc(t("files")) + "</th></tr></thead><tbody>" + rows + "</tbody></table></div></details>" : "");
}
function tool(id) {
  var x = T.tools.filter(function (y) { return y.id === id; })[0];
  if (!x) { location.hash = "#/"; return; }
  app.innerHTML = '<a class="back" href="' + hb() + '#/tools">' + esc(t("back")) + '</a><div class="th"><h1 class="tt">' + esc(loc(x.name)) + "</h1>" + tags(x) + '<p class="lead">' + esc(loc(x.summary)) + '</p></div><div class="tg"><div class="tmain">' + body(x) + '</div><aside class="tside">' +
    (x.webUrl ? '<p><a class="btn main" href="' + esc(abs(x.webUrl)) + '">' + esc(t("open_web")) + "</a></p>" : "") +
    (x.releasePrefix ? '<div class="dl" id="dl"><p>' + esc(t("loading")) + "</p></div>" : "") + notice(x) +
    '<p class="lic"><a href="' + aurl("license") + '">' + esc(t("license_link")) + "</a></p>" +
    (S.contactKey ? '<p class="lic"><a href="' + aurl("contact") + "?tool=" + esc(x.id) + '">' + esc(t("report_bug")) + "</a></p>" : "") + "</aside></div>";
  var box = document.getElementById("dl");
  if (box) releases().then(function (all) { if (box.isConnected) fill(box, x, all); }).catch(function () { if (box.isConnected) box.innerHTML = '<p class="empty">' + esc(t("load_error")) + "</p>"; });
}
function feat() {
  var f = T.tools.filter(function (x) { return x.featured; });
  if (!f.length) return "";
  return '<section class="sec feat"><h2>' + esc(t("featured")) + "</h2>" + f.map(function (x) {
    return '<article class="fi"><div><h3><a href="' + turl(x.id) + '">' + esc(loc(x.name)) + "</a></h3>" + tags(x) + "<p>" + esc(loc(x.summary)) + '</p></div><a class="btn main" href="' + turl(x.id) + '">' + esc(t(x.status === "soon" ? "soon" : "open")) + "</a></article>";
  }).join("") + "</section>";
}
function vid(u) {
  var m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/.exec(u || "");
  if (m) return "https://www.youtube-nocookie.com/embed/" + m[1];
  m = /vimeo\.com\/(\d+)/.exec(u || "");
  return m ? "https://player.vimeo.com/video/" + m[1] : "";
}
function rich(q) { return esc(q).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`\n]+)`/g, "<code>$1</code>").replace(/\b[0-9A-Fa-f]{64}\b/g, '<code class="hash">$&</code>').replace(/!\[([^\]]*)\]\((\/[^)\s]+|https?:\/\/[^)\s]+)\)/g, '<img class="mi" src="$2" alt="$1" loading="lazy">').replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|#\/[^)\s]*)\)/g, function (m, a, u) { u = fixLink(u); return '<a href="' + u + '"' + (/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : "") + ">" + a + "</a>"; }).replace(/\n/g, "<br>"); }
function blk(q) {
  q = q.trim();
  var hh = /^(#{2,3}) /.exec(q);
  if (hh) { var n = q.indexOf("\n"), r = n < 0 ? "" : q.slice(n + 1).trim(), tg = hh[1].length === 2 ? "h3" : "h4"; return "<" + tg + ">" + rich((n < 0 ? q : q.slice(0, n)).slice(hh[0].length)) + "</" + tg + ">" + (r ? blk(r) : ""); }
  var ls = q.split("\n");
  if (ls.every(function (l) { return /^- /.test(l.trim()); })) return "<ul>" + ls.map(function (l) { return "<li>" + rich(l.trim().slice(2)) + "</li>"; }).join("") + "</ul>";
  if (ls.every(function (l) { return /^\d+[.)] /.test(l.trim()); })) return "<ol>" + ls.map(function (l) { return "<li>" + rich(l.trim().replace(/^\d+[.)] /, "")) + "</li>"; }).join("") + "</ol>";
  if (ls.every(function (l) { return /^>/.test(l.trim()); })) return '<blockquote class="callout">' + ls.map(function (l) { return rich(l.trim().replace(/^> ?/, "")); }).join("<br>") + "</blockquote>";
  var hm = /\b[0-9A-Fa-f]{64}\b/.exec(q);
  if (hm) {
    var pre = q.slice(0, hm.index), k = Math.max(pre.lastIndexOf(". "), pre.lastIndexOf("! "), pre.lastIndexOf("? "));
    return (k >= 0 ? "<p>" + rich(pre.slice(0, k + 1)) + "</p>" : "") + '<p class="fp"><span class="fpl">' + rich((k >= 0 ? pre.slice(k + 2) : pre).trim()) + '</span><code class="hash">' + hm[0] + "</code>" + rich(q.slice(hm.index + 64)) + "</p>";
  }
  return "<p>" + rich(q) + "</p>";
}
function body(x) {
  var v = x.video && typeof x.video === "object" ? loc(x.video) : x.video, u = vid(v), d = loc(x.description);
  return (d ? d.replace(/\r/g, "").split(/\n\s*\n/).map(blk).join("") : "") +
    (u ? '<div class="vid"><iframe src="' + esc(u) + '" title="' + esc(loc(x.name)) + '" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>' : "") + shots(x);
}
function shotUrl(s) { return abs(s && typeof s === "object" ? s.image : s); }
function shots(x) {
  var l = (x.screenshots || []).filter(Boolean).slice(0, 12);
  return l.length ? "<h3>" + esc(t("shots")) + '</h3><div class="shots">' + l.map(function (s) { var u = shotUrl(s); return '<a href="' + esc(u) + '" target="_blank" rel="noopener"><img src="' + esc(u) + '" alt="' + esc(loc(x.name)) + '" loading="lazy" decoding="async"></a>'; }).join("") + "</div>" : "";
}
function heroVisual() {
  var s = T.tools.filter(function (x) { return x.hero; });
  if (!s.length) s = T.tools.filter(function (x) { return x.screenshots && x.screenshots.length; });
  s = s.slice(0, 8);
  if (!s.length) return '<div class="car"><div class="slide on"><div class="noimg"><span>Florindo<b class="lab">LAB</b></span></div></div></div>';
  return '<div class="car" role="region" aria-roledescription="carousel" aria-label="' + esc(t("car_label")) + '">' + s.map(function (x, i) {
    var im = (x.screenshots || []).filter(Boolean)[0];
    return '<a class="slide' + (i ? "" : " on") + '" href="' + turl(x.id) + '">' + (im ? '<img src="' + esc(shotUrl(im)) + '" alt=""' + (i ? ' loading="lazy"' : "") + ' decoding="async">' : '<div class="noimg">' + esc(loc(x.name)) + "</div>") + '<span class="cap"><b>' + esc(loc(x.name)) + "</b>" + esc(loc(x.summary)) + "</span></a>";
  }).join("") + (s.length > 1 ? '<button type="button" class="cb prev" aria-label="' + esc(t("car_prev")) + '">&#8249;</button><button type="button" class="cb next" aria-label="' + esc(t("car_next")) + '">&#8250;</button><div class="dots">' + s.map(function () { return '<button type="button" class="dot"></button>'; }).join("") + '</div><button type="button" class="cp" aria-label="' + esc(t("car_pause")) + '">&#10074;&#10074;</button>' : "") + "</div>";
}
var carT = null;
function carousel() {
  if (carT) { clearInterval(carT); carT = null; }
  var c = document.querySelector(".car");
  if (!c) return;
  var sl = c.querySelectorAll(".slide"), dots = c.querySelectorAll(".dot"), i = 0, hov = false, x0 = null;
  function go(n) {
    if (!sl.length) return;
    i = (n + sl.length) % sl.length;
    sl.forEach(function (e, k) { e.classList.toggle("on", k === i); e.setAttribute("aria-hidden", k === i ? "false" : "true"); e.tabIndex = k === i ? 0 : -1; });
    dots.forEach(function (d, k) { d.classList.toggle("on", k === i); d.setAttribute("aria-label", (k + 1) + " / " + sl.length); });
  }
  var pv = c.querySelector(".prev"), nx = c.querySelector(".next");
  if (pv) pv.onclick = function () { go(i - 1); };
  if (nx) nx.onclick = function () { go(i + 1); };
  dots.forEach(function (d, k) { d.onclick = function () { go(k); }; });
  c.addEventListener("focusin", function () { hov = true; });
  c.addEventListener("focusout", function () { hov = false; });
  var cp = c.querySelector(".cp"), paused = false;
  if (cp) cp.onclick = function () { paused = !paused; cp.innerHTML = paused ? "&#9654;" : "&#10074;&#10074;"; cp.setAttribute("aria-label", t(paused ? "car_play" : "car_pause")); };
  c.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  c.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); x0 = null; });
  if (sl.length > 1) carT = setInterval(function () { if (!document.body.contains(c)) { clearInterval(carT); carT = null; return; } if (!hov && !paused && !document.hidden) go(i + 1); }, 5000);
  go(0);
}
function thanks() {
  var d = document.getElementById("thx");
  if (!d) { d = document.createElement("dialog"); d.id = "thx"; document.body.appendChild(d); d.addEventListener("click", function (e) { if (e.target === d) d.close(); }); }
  if (d.open) return;
  d.innerHTML = '<button type="button" class="x" id="thx-x" aria-label="' + esc(t("close")) + '">&times;</button><h2>' + esc(t("thanks_title")) + "</h2><p>" + esc(t("thanks_text")) + '</p>' + (secPage() ? '<p class="soft2"><a href="' + esc(secUrl()) + '">' + esc(t("alertnote")) + "</a></p>" : "") + '<p class="soft">' + esc(t("thanks_free")) + '</p><div class="acts"><a class="btn main" href="' + esc(S.donateUrl) + '" target="_blank" rel="noopener">' + esc(t("coffee")) + "</a>" +
    (S.instagramUrl ? '<a class="btn" href="' + esc(S.instagramUrl) + '" target="_blank" rel="noopener">' + esc(t("follow_ig")) + "</a>" : "") + "</div>";
  d.querySelector("#thx-x").onclick = function () { d.close(); };
  if (d.showModal) d.showModal(); else d.setAttribute("open", "");
}
function notice(x) {
  var n = x.notice && typeof x.notice === "object" ? loc(x.notice) : x.notice;
  return n ? '<p><a class="btn" href="' + esc(n) + '" target="_blank" rel="noopener">' + esc(t("notice")) + "</a></p>" : "";
}
var HCK = "50b2fe65-b00b-4b9e-ad62-3ba471098be2", hcl = null, HID = null;
function hcap(cb) {
  if (window.hcaptcha && window.hcaptcha.render) return cb();
  if (!hcl) { hcl = document.createElement("script"); hcl.src = "https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=off"; hcl.async = true; document.head.appendChild(hcl); }
  hcl.addEventListener("load", cb);
}
function contact(toolId) {
  if (!S.contactKey) { app.innerHTML = '<p class="empty">' + esc(t("f_unconfigured")) + "</p>"; return; }
  var tl = T.tools.map(function (x) { var n = loc(x.name); return '<option value="' + esc(n) + '"' + (x.id === toolId ? " selected" : "") + ">" + esc(n) + "</option>"; }).join("");
  var ty = ["t_bug", "t_question", "t_idea"].map(function (k) { return '<option value="' + esc(t(k)) + '">' + esc(t(k)) + "</option>"; }).join("");
  app.innerHTML = '<a class="back" href="' + hb() + '#/tools">' + esc(t("back")) + '</a><section class="sec"><h1 class="tt">' + esc(t("contact_title")) + '</h1><p class="lead">' + esc(t("contact_lead")) + '</p><form id="cf" class="cf">' +
    "<label>" + esc(t("f_type")) + '<select name="type">' + ty + "</select></label>" +
    "<label>" + esc(t("f_tool")) + '<select name="logiciel">' + tl + '<option value="' + esc(t("f_other")) + '">' + esc(t("f_other")) + "</option></select></label>" +
    "<label>" + esc(t("f_name")) + '<input name="name" required autocomplete="name"></label>' +
    "<label>" + esc(t("f_email")) + '<input type="email" name="email" required autocomplete="email"><small>' + esc(t("f_email_hint")) + "</small></label>" +
    "<label>" + esc(t("f_details")) + '<input name="details" placeholder="' + esc(t("f_details_ph")) + '"></label>' +
    "<label>" + esc(t("f_message")) + '<textarea name="message" rows="7" required minlength="10"></textarea></label>' +
    '<input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" style="display:none"><div id="hc"></div><p class="note">' + esc(t("f_privacy")) + '</p><button class="btn main" type="submit">' + esc(t("f_send")) + '</button><p class="cm" id="cm" role="status" aria-live="polite"></p></form></section>';
  var f = document.getElementById("cf"), msg = document.getElementById("cm"), btn = f.querySelector("button");
  hcap(function () {
    var el = document.getElementById("hc");
    if (!el || el.firstChild) return;
    try { HID = window.hcaptcha.render(el, { sitekey: HCK, theme: window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" }); } catch (e) {}
  });
  f.onsubmit = function (e) {
    e.preventDefault();
    var tok = window.hcaptcha && HID !== null ? window.hcaptcha.getResponse(HID) : "";
    if (!tok) { msg.className = "cm err"; msg.textContent = t("f_captcha"); return; }
    var d = {}; new FormData(f).forEach(function (v, k) { d[k] = v; });
    delete d["g-recaptcha-response"];
    d.access_key = S.contactKey; d["h-captcha-response"] = tok; d.from_name = "FlorindoLAB (site)"; d.subject = "FlorindoLAB : " + d.type + " / " + d.logiciel;
    btn.disabled = true; btn.textContent = t("f_sending"); msg.className = "cm"; msg.textContent = "";
    fetch("https://api.web3forms.com/submit", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(d) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.success) throw new Error(j.message); f.innerHTML = '<p class="ok">' + esc(t("f_ok")) + "</p>"; })
      .catch(function (err) { console.error("Web3Forms :", err); msg.className = "cm err"; msg.textContent = t("f_err") + (err && err.message ? " (" + err.message + ")" : ""); btn.disabled = false; btn.textContent = t("f_send"); try { window.hcaptcha.reset(HID); } catch (x) {} });
  };
}
function legal(id) {
  var p = LG.filter(function (x) { return x.id === id; })[0];
  if (!p) { location.hash = "#/"; return; }
  app.innerHTML = '<a class="back" href="' + hb() + '#/tools">' + esc(t("back")) + '</a><section class="sec law"><h1 class="tt">' + esc(loc(p.title)) + "</h1>" + loc(p.body).replace(/\r/g, "").split(/\n\s*\n/).map(blk).join("") + "</section>";
}
var MINDL = 100;
function nf(n) { return new Intl.NumberFormat(lang).format(n); }
function dls(r) { return r.assets.reduce(function (n, a) { return n + (a.download_count || 0); }, 0); }
function cnt(rs) { var n = rs.reduce(function (s, r) { return s + dls(r); }, 0); return n >= MINDL ? '<p class="ver">' + esc(nf(n) + " " + t("dl_count")) + "</p>" : ""; }
var STD = null;
function b64d(s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }
function decryptStats(o, pw) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]).then(function (k) {
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64d(o.salt), iterations: o.iter, hash: "SHA-256" }, k, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  }).then(function (key) { return crypto.subtle.decrypt({ name: "AES-GCM", iv: b64d(o.iv) }, key, b64d(o.data)); }).then(function (b) { return JSON.parse(new TextDecoder().decode(b)); });
}
function showStats(box) {
  box.innerHTML = "<p>" + esc(t("loading")) + "</p>";
  releases().then(function (all) { if (box.isConnected) { box.innerHTML = statsHtml(all); evo(); } }).catch(function () { if (box.isConnected) box.innerHTML = '<p class="empty">' + esc(t("load_error")) + "</p>"; });
}
function openStats(box, pw) {
  return get("/data/stats-history.enc.json").then(function (o) { return decryptStats(o, pw); }).then(function (h) { STD = h; try { sessionStorage.setItem("sk", pw); } catch (e) {} showStats(box); });
}
function stats() {
  app.innerHTML = '<a class="back" href="' + hb() + '#/tools">' + esc(t("back")) + '</a><section class="sec"><h1 class="tt">' + esc(t("stats_title")) + '</h1><div id="st"></div></section>';
  var box = document.getElementById("st"), saved = null;
  try { saved = sessionStorage.getItem("sk"); } catch (e) {}
  function lock(msg) {
    box.innerHTML = '<form class="cf lk"><label>' + esc(t("stats_pw")) + '<input type="password" name="pw" autocomplete="current-password" required></label><button class="btn main" type="submit">' + esc(t("stats_unlock")) + '</button><p class="cm err" role="alert">' + esc(msg || "") + "</p></form>";
    var f = box.querySelector("form");
    f.onsubmit = function (e) {
      e.preventDefault(); f.querySelector("button").disabled = true;
      openStats(box, f.elements.pw.value).catch(function (er) { try { sessionStorage.removeItem("sk"); } catch (x) {} lock(er && er.message === "404" ? t("stats_nofile") : t("stats_badpw")); });
    };
  }
  if (STD) showStats(box); else if (saved) openStats(box, saved).catch(function (er) { lock(er && er.message === "404" ? t("stats_nofile") : ""); }); else lock();
}
function shist() { return Promise.resolve(STD); }
function nice(m) { var p = Math.pow(10, Math.floor(Math.log(m) / Math.LN10)), f = m / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }
function sdate(d) { return new Date(d + "T00:00:00Z").toLocaleDateString(lang, { day: "numeric", month: "short", timeZone: "UTC" }); }
var CW = 640, CH = 260, CL = 46, CR = 12, CT = 14, CB = 30;
function cx(i, n, mode) { var iw = CW - CL - CR; return mode === "day" ? CL + (i + 0.5) * iw / n : CL + (n < 2 ? iw / 2 : i * iw / (n - 1)); }
function chart(pts, mode) {
  var n = pts.length, iw = CW - CL - CR, ih = CH - CT - CB, mx = Math.max.apply(null, pts.map(function (p) { return p.v; }).concat([1])), step = Math.max(1, Math.ceil(nice(mx / 4))), top = Math.ceil(mx / step) * step, nt = Math.round(top / step), g = "", body = "";
  var Y = function (v) { return CT + ih - v / top * ih; };
  for (var k = 0; k <= nt; k++) { var v = step * k, y = Y(v); g += '<line x1="' + CL + '" x2="' + (CW - CR) + '" y1="' + y + '" y2="' + y + '" class="gl"/><text x="' + (CL - 8) + '" y="' + (y + 4) + '" class="ax" text-anchor="end">' + nf(Math.round(v * 10) / 10) + "</text>"; }
  if (mode === "day") { var bw = Math.max(2, iw / n * 0.7); pts.forEach(function (p, i) { var h = p.v / top * ih; body += '<rect x="' + (cx(i, n, mode) - bw / 2) + '" y="' + (CT + ih - h) + '" width="' + bw + '" height="' + h + '" rx="2" class="bar"/>'; }); }
  else { var d = pts.map(function (p, i) { return (i ? "L" : "M") + cx(i, n, mode) + " " + Y(p.v); }).join(""); body = '<path d="' + d + "L" + cx(n - 1, n, mode) + " " + (CT + ih) + "L" + cx(0, n, mode) + " " + (CT + ih) + 'Z" class="area"/><path d="' + d + '" class="ln"/>'; }
  var lab = [0, Math.floor((n - 1) / 2), n - 1].filter(function (v, i, a) { return a.indexOf(v) === i; }).map(function (i) { return '<text x="' + cx(i, n, mode) + '" y="' + (CH - 8) + '" class="ax" text-anchor="' + (i === 0 ? "start" : i === n - 1 ? "end" : "middle") + '">' + esc(sdate(pts[i].d)) + "</text>"; }).join("");
  return '<svg viewBox="0 0 ' + CW + " " + CH + '" class="chart" role="img" aria-label="' + esc(t("stats_evo")) + '">' + g + body + lab + '<line class="cur" y1="' + CT + '" y2="' + (CT + ih) + '" x1="0" x2="0" style="display:none"/></svg>';
}
function evo() {
  var box = document.getElementById("evo");
  if (!box) return;
  shist().then(function (h) {
    if (!box.isConnected) return;
    var days = ((h && h.days) || []).slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; }), head = "<h2>" + esc(t("stats_evo")) + "</h2>";
    if (days.length < 2) { box.innerHTML = head + '<p class="empty">' + esc(t("stats_none_hist")) + "</p>"; return; }
    var st = { tool: "", per: 30, mode: "day" }, tl = T.tools.filter(function (x) { return x.releasePrefix; });
    box.innerHTML = head + '<div class="evc"><select id="evt" aria-label="' + esc(t("stats_tools")) + '"><option value="">' + esc(t("stats_alltools")) + "</option>" + tl.map(function (x) { return '<option value="' + esc(x.releasePrefix) + '">' + esc(loc(x.name)) + "</option>"; }).join("") + "</select>" +
      [["day", "stats_perday"], ["cum", "stats_cumul"]].map(function (m) { return '<button type="button" class="chip" data-m="' + m[0] + '" aria-pressed="' + (st.mode === m[0]) + '">' + esc(t(m[1])) + "</button>"; }).join("") +
      [[7, "stats_p7"], [30, "stats_p30"], [90, "stats_p90"], [0, "stats_pall"]].map(function (p) { return '<button type="button" class="chip" data-p="' + p[0] + '" aria-pressed="' + (st.per === p[0]) + '">' + esc(t(p[1])) + "</button>"; }).join("") +
      '</div><div class="kpi" id="evk"></div><div class="chartbox"><div id="evg"></div><div class="tip" id="evp" hidden></div></div><p class="note">' + esc(t("stats_since") + " " + sdate(days[0].d) + ".") + "</p>";
    function draw() {
      var all = days.map(function (d) { var s = 0; Object.keys(d.c).forEach(function (tag) { if (!st.tool || tag.indexOf(st.tool + "-v") === 0) Object.keys(d.c[tag]).forEach(function (a) { s += d.c[tag][a] || 0; }); }); return { d: d.d, v: s }; });
      var day = all.slice(1).map(function (p, i) { return { d: p.d, v: Math.max(0, p.v - all[i].v) }; }), last = new Date(all[all.length - 1].d + "T00:00:00Z").getTime();
      var inP = function (p) { return !st.per || new Date(p.d + "T00:00:00Z").getTime() > last - st.per * 864e5; };
      var dsel = day.filter(inP), src = st.mode === "day" ? day : all, pts = src.filter(inP);
      if (!pts.length) pts = src.slice(-1);
      var tot = dsel.reduce(function (a, p) { return a + p.v; }, 0), best = dsel.reduce(function (b, p) { return p.v > b.v ? p : b; }, { v: 0, d: "" });
      document.getElementById("evk").innerHTML = "<div><b>" + nf(tot) + "</b><span>" + esc(t("stats_ptotal")) + "</span></div><div><b>" + nf(best.v) + "</b><span>" + esc(t("stats_best") + (best.d ? " (" + sdate(best.d) + ")" : "")) + "</span></div><div><b>" + new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(dsel.length ? tot / dsel.length : 0) + "</b><span>" + esc(t("stats_avg")) + "</span></div>";
      var g = document.getElementById("evg"), tip = document.getElementById("evp");
      g.innerHTML = chart(pts, st.mode);
      g.onpointermove = function (e) {
        var svg = g.querySelector("svg"), r = svg.getBoundingClientRect(), n = pts.length, vx = (e.clientX - r.left) / r.width * CW, iw = CW - CL - CR;
        var i = Math.max(0, Math.min(n - 1, st.mode === "day" ? Math.floor((vx - CL) / (iw / n)) : Math.round((vx - CL) / (iw / Math.max(1, n - 1))))), x = cx(i, n, st.mode), c = svg.querySelector(".cur");
        c.setAttribute("x1", x); c.setAttribute("x2", x); c.style.display = "";
        tip.hidden = false; tip.textContent = sdate(pts[i].d) + " : " + nf(pts[i].v) + " " + (st.mode === "day" ? t("dl_count") : t("stats_totshort"));
        tip.style.left = Math.max(60, Math.min(r.width - 60, x / CW * r.width)) + "px";
      };
      g.onpointerleave = function () { tip.hidden = true; var c = g.querySelector(".cur"); if (c) c.style.display = "none"; };
    }
    box.querySelector("#evt").onchange = function () { st.tool = this.value; draw(); };
    box.querySelectorAll("[data-m]").forEach(function (b) { b.onclick = function () { st.mode = b.getAttribute("data-m"); box.querySelectorAll("[data-m]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); draw(); }; });
    box.querySelectorAll("[data-p]").forEach(function (b) { b.onclick = function () { st.per = +b.getAttribute("data-p"); box.querySelectorAll("[data-p]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); draw(); }; });
    draw();
  });
}
function statsHtml(all) {
  var rel = all.filter(function (r) { return !r.draft; }), used = {}, grand = 0, nver = 0;
  var bl = T.tools.filter(function (x) { return x.releasePrefix; }).map(function (x) {
    var p = x.releasePrefix + "-v", rs = rel.filter(function (r) { return r.tag_name.indexOf(p) === 0; });
    rs.forEach(function (r) { used[r.id] = 1; });
    return { name: loc(x.name), p: p, rs: rs, tot: rs.reduce(function (n, r) { return n + dls(r); }, 0) };
  });
  var oth = rel.filter(function (r) { return !used[r.id]; });
  if (oth.length) bl.push({ name: t("stats_other"), p: "", o: true, rs: oth, tot: oth.reduce(function (n, r) { return n + dls(r); }, 0) });
  bl = bl.filter(function (b) { return b.rs.length; }).sort(function (a, b) { return b.tot - a.tot; });
  if (!bl.length) return '<p class="empty">' + esc(t("no_release")) + "</p>";
  bl.forEach(function (b) { grand += b.tot; nver += b.rs.length; });
  var ntools = bl.filter(function (b) { return !b.o; }).length;
  return '<div class="sc"><div><b>' + nf(grand) + "</b><span>" + esc(t("stats_total")) + "</span></div><div><b>" + nf(ntools) + "</b><span>" + esc(t("stats_tools")) + "</span></div><div><b>" + nf(nver) + "</b><span>" + esc(t("stats_versions")) + "</span></div></div><div class=\"evo\" id=\"evo\"></div>" +
    bl.map(function (b) {
      return '<div class="stb"><h3><span>' + esc(b.name) + "</span><span>" + nf(b.tot) + '</span></h3><div class="scroll"><table><thead><tr><th>' + esc(t("version")) + "</th><th>" + esc(t("date")) + "</th><th>" + esc(t("stats_downloads")) + "</th></tr></thead><tbody>" +
        b.rs.map(function (r) { return "<tr><td>" + esc(b.p ? r.tag_name.slice(b.p.length) : r.tag_name) + "</td><td>" + esc(dt(r.published_at)) + "</td><td>" + nf(dls(r)) + "</td></tr>"; }).join("") + "</tbody></table></div></div>";
    }).join("") + '<p class="note">' + esc(t("stats_note")) + "</p>";
}
function pageUrl(p) { var s = p.slug && (p.slug[lang] || p.slug.fr); return s ? (lang === "en" ? "/en/" : "/") + s + "/" : "#/legal/" + p.id; }
function secPage() { return LG.filter(function (p) { return p.id === "securite"; })[0]; }
function secUrl() { var p = secPage(); return p ? pageUrl(p) : ""; }
function banner() {
  var el = document.getElementById("bn"), txt = S.bannerOff ? "" : ((S.banner && loc(S.banner)) || t("banner")), off = false;
  try { off = localStorage.getItem("bn_v1") === "1"; } catch (e) {}
  if (!txt || off || !secPage()) { if (el && el.parentNode) el.parentNode.removeChild(el); return; }
  if (!el) {
    el = document.createElement("div"); el.id = "bn"; el.className = "bn"; el.setAttribute("role", "note");
    document.body.insertBefore(el, document.body.firstChild);
    el.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".bx")) { try { localStorage.setItem("bn_v1", "1"); } catch (x) {} if (el.parentNode) el.parentNode.removeChild(el); } });
  }
  el.innerHTML = "<span>" + esc(txt) + ' <a href="' + esc(secUrl()) + '">' + esc(t("banner_link")) + '</a></span><button type="button" class="bx" aria-label="' + esc(t("close")) + '">&times;</button>';
}
function norm(s) { return String(s == null ? "" : s).trim().toLowerCase(); }
function cfind(v) { var n = norm(v); return (T.categories || []).filter(function (y) { return norm(y.id) === n || norm(y.fr) === n || norm(y.en) === n; })[0]; }
function catLabel(v) { var c = cfind(v); return c ? loc(c) : String(v).trim(); }
function catKey(v) { var c = cfind(v); return c ? norm(c.id || c.fr) : norm(v); }
function catList() {
  var seen = {}, out = [];
  (T.categories || []).forEach(function (c) { var k = catKey(c.id || c.fr); if (k && !seen[k]) { seen[k] = 1; out.push({ k: k, label: loc(c) }); } });
  T.tools.forEach(function (x) { (x.categories || []).forEach(function (v) { var k = catKey(v); if (k && !seen[k]) { seen[k] = 1; out.push({ k: k, label: catLabel(v) }); } }); });
  return out;
}
function plat(v) {
  var n = norm(v), p = (T.platforms || []).filter(function (y) { return norm(y.id) === n || norm(y.fr) === n || norm(y.en) === n; })[0];
  if (p) return loc(p);
  var B = { windows: "Windows", macos: "macOS", mac: "macOS", "macos-arm": "macOS (Apple Silicon)", "macos-intel": "macOS (Intel)", linux: "Linux", ios: "iOS", android: "Android" };
  if (B[n]) return B[n];
  var k = t("p_" + n); return k === "p_" + n ? String(v).trim() : k;
}
function finfo(x, a) { var n = (a.name || "").toLowerCase(); return (x.files || []).filter(function (f) { return f && f.name && f.name.toLowerCase() === n; })[0]; }
function osOf(n) {
  n = (n || "").toLowerCase();
  var m = function (re) { return re.test(n); };
  if (m(/\.(exe|msi)$/) || m(/(^|[-_. ])win(dows)?([-_. ]|$)/)) return "windows";
  if (m(/\.(apk|aab)$/)) return "android";
  if (m(/\.(appimage|deb|rpm)$/) || m(/(^|[-_. ])linux([-_. ]|$)/)) return "linux";
  if (m(/\.(dmg|pkg)$/) || m(/(^|[-_. ])(mac|macos|osx)([-_. ]|$)/)) {
    if (m(/(^|[-_. ])universal([-_. ]|$)/)) return "macos";
    if (m(/(^|[-_. ])(arm64|aarch64|silicon|applesilicon|m1|m2|m3|m4)([-_. ]|$)/)) return "macos-arm";
    if (m(/(^|[-_. ])(intel|x64|x86_64|x86-64|amd64)([-_. ]|$)/)) return "macos-intel";
    return "macos";
  }
  return "";
}
function pkey(v) { var n = norm(v); return { mac: "macos", osx: "macos", win: "windows" }[n] || n; }
function akey(x, a) {
  var k = osOf(a.name);
  if (k) return k;
  var ps = (x.platforms || []).map(pkey).filter(function (p, i, l) { return p && l.indexOf(p) === i; });
  return ps.length === 1 ? ps[0] : "other";
}
function mine() {
  var u = navigator.userAgent || "";
  return /Windows/.test(u) ? "windows" : /Android/.test(u) ? "android" : /Macintosh|Mac OS X/.test(u) ? "macos" : /Linux/.test(u) ? "linux" : "~";
}
function groups(x, rs) {
  var seen = {}, out = [], orel = null, me = mine();
  rs.forEach(function (r) {
    r.assets.forEach(function (a) {
      var k = akey(x, a);
      if (k === "other") { if (!orel) orel = r; if (orel === r) out.push({ k: k, r: r, a: a }); return; }
      if (!seen[k]) { seen[k] = 1; out.push({ k: k, r: r, a: a }); }
    });
  });
  return out.sort(function (a, b) { return (b.k.indexOf(me) === 0 ? 1 : 0) - (a.k.indexOf(me) === 0 ? 1 : 0); });
}
function shaBox(h) {
  h = String(h).trim();
  var b = h.length === 64 ? esc(h.slice(0, 32)) + "<br>" + esc(h.slice(32)) : esc(h);
  return '<div class="sh"><span>SHA-256</span><button type="button" class="cpy" data-copy="' + esc(h) + '">' + esc(t("copy")) + '</button></div><code class="hx">' + b + "</code>";
}
function dlbtn(x, a, k) {
  var m = finfo(x, a) || {}, os = m.platform || k, s = m.size ? m.size : sz(a.size), h = m.sha256 || (/^sha256:/i.test(a.digest || "") ? a.digest.slice(7) : "");
  return '<a class="btn main" data-dl href="' + esc(a.browser_download_url) + '">' + (os && os !== "other" ? esc(plat(os)) + " : " : "") + esc(a.name) + " (" + esc(s) + ")</a>" +
    (m.version || h ? '<div class="sha">' + (m.version ? '<span class="sv">' + esc(t("version") + " " + m.version) + "</span>" : "") + (h ? shaBox(h) : "") + "</div>" : "");
}
function license() {
  get("/data/license.json").then(function (d) {
    if (cur() !== "license") return;
    var c = d[lang] || d.en || d.fr;
    app.innerHTML = '<a class="back" href="' + hb() + '#/tools">' + esc(t("back")) + '</a><section class="sec law"><h1 class="tt">' + esc(t("license_title")) + '</h1><p class="lead">' + esc(t("license_lead")) + "</p>" +
      c.map(function (s) {
        return "<h3>" + esc(s.n + ". " + s.h) + "</h3>" + s.p.map(function (q) { return '<p class="' + (/^[a-d]\) /.test(q) ? "it" : "lp") + '">' + esc(q) + "</p>"; }).join("");
      }).join("") + "</section>";
  }).catch(function () { app.innerHTML = '<p class="empty">' + esc(t("load_error")) + "</p>"; });
}
function support() {
  app.innerHTML = '<section class="sec support"><div><h1 class="tt">' + esc(t("support_title")) + "</h1><p>" + esc(t("support_text")) + '</p></div><a class="btn main coffee" href="' + esc(S.donateUrl) + '" rel="noopener">' + esc(t("coffee")) + "</a></section>";
}
function route() {
  var raw = location.hash.replace(/^#\/?/, "") || PAGE.replace(/^\//, ""), qi = raw.indexOf("?"), q = qi < 0 ? (location.search || "").replace(/^\?/, "") : raw.slice(qi + 1), h = (qi < 0 ? raw : raw.slice(0, qi)).split("/");
  if (h[0] === "tool" && h[1]) tool(decodeURIComponent(h[1])); else if (h[0] === "support") support(); else if (h[0] === "license") license();
  else if (h[0] === "stats") stats();
  else if (h[0] === "legal" && h[1]) legal(decodeURIComponent(h[1]));
  else if (h[0] === "contact") contact((/(?:^|&)tool=([^&]+)/.exec(q) || [])[1]); else home();
  return h[0];
}
function onHash() { var s = route() === "tools" && document.getElementById("tools-sec"); if (s) s.scrollIntoView(); else window.scrollTo(0, 0); }
function stat() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(function (e) { e.textContent = t(e.getAttribute("data-i18n")); });
  if (!FIXED) document.title = "FlorindoLAB – " + t("tagline");
  if (FIXED) { var br = document.querySelector(".brand"); if (br) br.setAttribute("href", hb()); var nt = document.querySelector('nav a[data-i18n="nav_tools"]'); if (nt) nt.setAttribute("href", hb() + "#/tools"); }
  var ns = document.querySelector('nav a[data-i18n="nav_support"]'), fl = document.querySelector('footer a[data-i18n="nav_license"]'), ct = document.getElementById("ct");
  if (ns) ns.setAttribute("href", aurl("support")); if (fl) fl.setAttribute("href", aurl("license")); if (ct) ct.setAttribute("href", aurl("contact"));
  var lg = document.getElementById("lg");
  if (lg) lg.innerHTML = LG.map(function (p) { return '<a href="' + esc(pageUrl(p)) + '">' + esc(loc(p.title)) + "</a>"; }).join(" ");
  banner();
}
function boot() {
  var l = null, seen = false; try { l = localStorage.getItem("lang"); seen = !!l; } catch (e) {}
  if (!l) l = (navigator.language || "fr").slice(0, 2);
  if (S.languages.indexOf(l) < 0) l = S.languages.indexOf("en") > -1 ? "en" : S.languages[0];
  if (FIXED && S.languages.indexOf(FIXED) > -1) { l = FIXED; try { localStorage.setItem("lang", l); } catch (e) {} }
  sel.innerHTML = S.languages.map(function (c) { return '<option value="' + esc(c) + '">' + esc(window.matchMedia && window.matchMedia("(max-width: 640px)").matches ? c.toUpperCase() : L[c].lang_name) + "</option>"; }).join("");
  sel.onchange = function () { var alt = FIXED && document.querySelector('link[rel="alternate"][hreflang="' + sel.value + '"]'); if (alt) { try { localStorage.setItem("lang", sel.value); } catch (e) {} location.href = alt.getAttribute("href") + location.hash; return; } lang = sel.value; try { localStorage.setItem("lang", lang); } catch (e) {} stat(); route(); };
  window.addEventListener("hashchange", onHash);
  app.addEventListener("click", function (e) { var a = e.target.closest && e.target.closest("a[data-dl]"); if (a) setTimeout(thanks, 400); });
  app.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-copy]");
    if (!b) return;
    var v = b.getAttribute("data-copy"), done = function () { b.textContent = t("copied"); setTimeout(function () { b.textContent = t("copy"); }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, function () {});
    else { var ta = document.createElement("textarea"); ta.value = v; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (x) {} document.body.removeChild(ta); }
  });
  lang = l; sel.value = l; stat(); route();
  if (FIXED === "fr" && !seen && (navigator.language || "").slice(0, 2) === "en") { var bn = document.createElement("div"); bn.className = "lb"; bn.innerHTML = '<a href="/en/">This site is also available in English</a>'; document.body.insertBefore(bn, document.body.firstChild); }
  var ig = document.getElementById("ig"); if (S.instagramUrl) { ig.href = S.instagramUrl; ig.hidden = false; }
  if (S.contactKey) document.getElementById("ct").hidden = false;
}
get("/data/site.json").then(function (s) {
  S = s;
  return Promise.all([get("/data/tools.json")].concat(S.languages.map(function (c) { return get("/i18n/" + c + ".json"); })));
}).then(function (r) {
  T = r[0]; S.languages.forEach(function (c, i) { L[c] = r[i + 1]; });
  return get("/data/legal.json").then(function (j) { LG = j.pages || []; }, function () {}).then(boot);
}).catch(function () {
  app.innerHTML = '<p class="empty">Impossible de charger le site / Could not load the site. (GitHub Pages ou serveur local requis, pas de double-clic sur le fichier.)</p>';
});
})();
