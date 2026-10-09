(function () {
"use strict";
var app = document.getElementById("app"), sel = document.getElementById("lang");
var S, T, L = {}, lang = "fr", cat = "all", pr = null;
var HERO = "<svg viewBox=\"0 0 640 360\" role=\"img\"><rect x=\"1\" y=\"1\" width=\"638\" height=\"358\" fill=\"none\" stroke=\"currentColor\" stroke-opacity=\".35\"/><rect class=\"safe\" x=\"32\" y=\"18\" width=\"576\" height=\"324\"/><rect class=\"safe\" x=\"64\" y=\"36\" width=\"512\" height=\"288\"/><line class=\"guide\" x1=\"213.3\" y1=\"0\" x2=\"213.3\" y2=\"360\"/><line class=\"guide\" x1=\"426.6\" y1=\"0\" x2=\"426.6\" y2=\"360\"/><line class=\"guide\" x1=\"0\" y1=\"120\" x2=\"640\" y2=\"120\"/><line class=\"guide\" x1=\"0\" y1=\"240\" x2=\"640\" y2=\"240\"/><line class=\"guide\" x1=\"0\" y1=\"360\" x2=\"640\" y2=\"0\" stroke-opacity=\".35\"/><circle class=\"guide\" cx=\"426.6\" cy=\"120\" r=\"14\"/><circle cx=\"426.6\" cy=\"120\" r=\"3\" fill=\"var(--accent)\"/></svg>";
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function loc(o) { return (o && (o[lang] || o.en || o.fr)) || ""; }
function t(k) { return (L[lang] && L[lang][k]) || (L.en && L.en[k]) || k; }
function get(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
function dt(s) { return new Date(s).toLocaleDateString(lang, { year: "numeric", month: "long", day: "numeric" }); }
function sz(n) { var m = n > 1048576, v = m ? n / 1048576 : n / 1024; return new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(v) + (m ? " MB" : " KB"); }
function note(s) { s = (s || "").replace(/\s*\n+\s*/g, " ").trim(); return s.length > 140 ? s.slice(0, 140) + "…" : s; }

function tags(x) {
  var c = (x.categories || []).map(function (id) { var k = T.categories.filter(function (y) { return y.id === id; })[0]; return '<span class="tag cat">' + esc(k ? loc(k) : id) + "</span>"; });
  var p = (x.platforms || []).map(function (id) { return '<span class="tag">' + esc(t("p_" + id)) + "</span>"; });
  if (x.status === "soon") p.push('<span class="tag soon">' + esc(t("soon")) + "</span>");
  return '<div class="tags">' + c.concat(p).join("") + "</div>";
}
function chip(id, label) { return '<button type="button" class="chip" data-f="' + esc(id) + '" aria-pressed="' + (cat === id) + '">' + esc(label) + "</button>"; }
function row(x) {
  var soon = x.status === "soon";
  return '<article class="tool"><div><h3><a href="#/tool/' + esc(x.id) + '">' + esc(loc(x.name)) + "</a></h3>" + tags(x) + "</div><p>" + esc(loc(x.summary)) + '</p><a class="btn' + (soon ? "" : " main") + '" href="#/tool/' + esc(x.id) + '">' + esc(t(soon ? "soon" : "open")) + "</a></article>";
}
function home() {
  var list = T.tools.filter(function (x) { return cat === "all" || (x.categories || []).indexOf(cat) > -1; });
  app.innerHTML = '<div class="hero"><div><h1>' + esc(t("hero_title")) + "</h1><p>" + esc(t("hero_text")) + '</p><a class="btn main" href="#/tools">' + esc(t("see_tools")) + '</a><a class="btn" href="#/support">' + esc(t("support_project")) + '</a></div><figure class="frame" style="margin:0">' + HERO.replace("<svg ", '<svg aria-label="' + esc(t("hero_alt")) + '" ') + "</figure></div>" +
    '<section class="sec" id="tools-sec"><h2>' + esc(t("tools")) + '</h2><p class="lead">' + esc(t("tools_lead")) + '</p><div class="chips" role="group">' + chip("all", t("all")) + T.categories.map(function (c) { return chip(c.id, loc(c)); }).join("") + "</div>" +
    (list.length ? list.map(row).join("") : '<p class="empty">' + esc(t("empty")) + "</p>") + "</section>";
  app.querySelectorAll(".chip").forEach(function (b) { b.onclick = function () { cat = b.getAttribute("data-f"); home(); }; });
}
function releases() {
  if (!pr) pr = get("https://api.github.com/repos/" + S.repo + "/releases?per_page=100").catch(function (e) { pr = null; throw e; });
  return pr;
}
function fill(box, x, all) {
  var p = x.releasePrefix + "-v", rs = all.filter(function (r) { return !r.draft && r.tag_name.indexOf(p) === 0; });
  if (!rs.length) { box.innerHTML = '<p class="empty">' + esc(t("no_release")) + "</p>"; return; }
  var r = rs[0];
  var rows = rs.map(function (q) {
    return "<tr><td>" + esc(q.tag_name.slice(p.length)) + "</td><td>" + esc(dt(q.published_at)) + "</td><td>" + esc(note(q.body)) + "</td><td>" + q.assets.map(function (a) { return '<a href="' + esc(a.browser_download_url) + '">' + esc(a.name) + "</a>"; }).join("<br>") + "</td></tr>";
  }).join("");
  box.innerHTML = '<div class="dl-head"><div><h2>' + esc(t("latest")) + " " + esc(r.tag_name.slice(p.length)) + '</h2><p class="ver">' + esc(dt(r.published_at)) + "</p></div><div>" +
    r.assets.map(function (a) { return '<a class="btn main" href="' + esc(a.browser_download_url) + '">' + esc(a.name) + " (" + sz(a.size) + ")</a>"; }).join("") + "</div></div>" +
    (rs.length > 1 ? "<details><summary>" + esc(t("history")) + '</summary><div class="scroll"><table><thead><tr><th>' + esc(t("version")) + "</th><th>" + esc(t("date")) + "</th><th>" + esc(t("notes")) + "</th><th>" + esc(t("files")) + "</th></tr></thead><tbody>" + rows + "</tbody></table></div></details>" : "");
}
function tool(id) {
  var x = T.tools.filter(function (y) { return y.id === id; })[0];
  if (!x) { location.hash = "#/"; return; }
  app.innerHTML = '<a class="back" href="#/tools">' + esc(t("back")) + '</a><h1 class="tt">' + esc(loc(x.name)) + "</h1>" + tags(x) + '<p class="lead">' + esc(loc(x.summary)) + "</p>" +
    (x.webUrl ? '<p><a class="btn main" href="' + esc(x.webUrl) + '">' + esc(t("open_web")) + "</a></p>" : "") +
    (x.releasePrefix ? '<div class="dl" id="dl"><p>' + esc(t("loading")) + "</p></div>" : "") +
    '<p class="lic"><a href="#/license">' + esc(t("license_link")) + "</a></p>";
  var box = document.getElementById("dl");
  if (box) releases().then(function (all) { if (box.isConnected) fill(box, x, all); }).catch(function () { if (box.isConnected) box.innerHTML = '<p class="empty">' + esc(t("load_error")) + "</p>"; });
}
function license() {
  get("data/license.json").then(function (d) {
    if (location.hash.replace(/^#\/?/, "").split("/")[0] !== "license") return;
    var c = d[lang] || d.en || d.fr;
    app.innerHTML = '<a class="back" href="#/tools">' + esc(t("back")) + '</a><section class="sec law"><h1 class="tt">' + esc(t("license_title")) + '</h1><p class="lead">' + esc(t("license_lead")) + "</p>" +
      c.map(function (s) {
        return "<h3>" + esc(s.n + ". " + s.h) + "</h3>" + s.p.map(function (q) { return '<p class="' + (/^[a-d]\) /.test(q) ? "it" : "lp") + '">' + esc(q) + "</p>"; }).join("");
      }).join("") + "</section>";
  }).catch(function () { app.innerHTML = '<p class="empty">' + esc(t("load_error")) + "</p>"; });
}
function support() {
  app.innerHTML = '<section class="sec support"><div><h1 class="tt">' + esc(t("support_title")) + "</h1><p>" + esc(t("support_text")) + '</p></div><a class="btn main coffee" href="' + esc(S.donateUrl) + '" rel="noopener">' + esc(t("coffee")) + "</a></section>";
}
function route() {
  var h = location.hash.replace(/^#\/?/, "").split("/");
  if (h[0] === "tool" && h[1]) tool(decodeURIComponent(h[1])); else if (h[0] === "support") support(); else if (h[0] === "license") license(); else home();
  return h[0];
}
function onHash() { var s = route() === "tools" && document.getElementById("tools-sec"); if (s) s.scrollIntoView(); else window.scrollTo(0, 0); }
function stat() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(function (e) { e.textContent = t(e.getAttribute("data-i18n")); });
  document.title = "FlorindoLAB – " + t("tagline");
}
function boot() {
  var l = null; try { l = localStorage.getItem("lang"); } catch (e) {}
  if (!l) l = (navigator.language || "fr").slice(0, 2);
  if (S.languages.indexOf(l) < 0) l = S.languages.indexOf("en") > -1 ? "en" : S.languages[0];
  sel.innerHTML = S.languages.map(function (c) { return '<option value="' + esc(c) + '">' + esc(L[c].lang_name) + "</option>"; }).join("");
  sel.onchange = function () { lang = sel.value; try { localStorage.setItem("lang", lang); } catch (e) {} stat(); route(); };
  window.addEventListener("hashchange", onHash);
  lang = l; sel.value = l; stat(); route();
}
get("data/site.json").then(function (s) {
  S = s;
  return Promise.all([get("data/tools.json")].concat(S.languages.map(function (c) { return get("i18n/" + c + ".json"); })));
}).then(function (r) {
  T = r[0]; S.languages.forEach(function (c, i) { L[c] = r[i + 1]; }); boot();
}).catch(function () {
  app.innerHTML = '<p class="empty">Impossible de charger le site / Could not load the site. (GitHub Pages ou serveur local requis, pas de double-clic sur le fichier.)</p>';
});
})();
