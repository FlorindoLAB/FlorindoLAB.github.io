(function () {
"use strict";
var app = document.getElementById("app"), sel = document.getElementById("lang");
var S, T, L = {}, LG = [], lang = "fr", cat = "all", pr = null;
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
  stats_downloads: ["Téléchargements", "Downloads"], stats_other: ["Autres fichiers", "Other files"], dl_count: ["téléchargements", "downloads"]
};
Object.keys(X).forEach(function (k) { DEF[k] = { fr: X[k][0], en: X[k][1] }; });
function t(k) { return (L[lang] && L[lang][k]) || (L.en && L.en[k]) || (DEF[k] && (DEF[k][lang] || DEF[k].en)) || k; }
function get(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
function dt(s) { return new Date(s).toLocaleDateString(lang, { year: "numeric", month: "long", day: "numeric" }); }
function sz(n) { var m = n > 1048576, v = m ? n / 1048576 : n / 1024; return new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(v) + (m ? " MB" : " KB"); }
function note(s) { s = (s || "").replace(/\s*\n+\s*/g, " ").trim(); return s.length > 140 ? s.slice(0, 140) + "…" : s; }

function tags(x) {
  var c = (x.categories || []).map(function (id) { var k = T.categories.filter(function (y) { return y.id === id; })[0]; return '<span class="tag cat">' + esc(k ? loc(k) : id) + "</span>"; });
  var p = (x.platforms || []).map(function (id) { return '<span class="tag">' + esc(t("p_" + id)) + "</span>"; });
  if (x.isNew) c.unshift('<span class="tag new">' + esc(t("new")) + "</span>");
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
  app.innerHTML = '<div class="hero"><div><h1>' + esc(t("hero_title")) + "</h1><p>" + esc(t("hero_text")) + '</p><a class="btn main" href="#/tools">' + esc(t("see_tools")) + '</a><a class="btn" href="#/support">' + esc(t("support_project")) + '</a></div><figure class="frame" style="margin:0">' + HERO.replace("<svg ", '<svg aria-label="' + esc(t("hero_alt")) + '" ') + "</figure></div>" + feat() +
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
    return "<tr><td>" + esc(q.tag_name.slice(p.length)) + "</td><td>" + esc(dt(q.published_at)) + "</td><td>" + esc(note(q.body)) + "</td><td>" + q.assets.map(function (a) { return '<a data-dl href="' + esc(a.browser_download_url) + '">' + esc(a.name) + "</a>"; }).join("<br>") + "</td></tr>";
  }).join("");
  box.innerHTML = '<div class="dl-head"><div><h2>' + esc(t("latest")) + " " + esc(r.tag_name.slice(p.length)) + '</h2><p class="ver">' + esc(dt(r.published_at)) + "</p>" + cnt(rs) + "</div><div>" +
    r.assets.map(function (a) { return '<a class="btn main" data-dl href="' + esc(a.browser_download_url) + '">' + esc(a.name) + " (" + sz(a.size) + ")</a>"; }).join("") + "</div></div>" +
    (rs.length > 1 ? "<details><summary>" + esc(t("history")) + '</summary><div class="scroll"><table><thead><tr><th>' + esc(t("version")) + "</th><th>" + esc(t("date")) + "</th><th>" + esc(t("notes")) + "</th><th>" + esc(t("files")) + "</th></tr></thead><tbody>" + rows + "</tbody></table></div></details>" : "");
}
function tool(id) {
  var x = T.tools.filter(function (y) { return y.id === id; })[0];
  if (!x) { location.hash = "#/"; return; }
  app.innerHTML = '<a class="back" href="#/tools">' + esc(t("back")) + '</a><header class="th"><h1 class="tt">' + esc(loc(x.name)) + "</h1>" + tags(x) + '<p class="lead">' + esc(loc(x.summary)) + '</p></header><div class="tg"><div class="tmain">' + body(x) + '</div><aside class="tside">' +
    (x.webUrl ? '<p><a class="btn main" href="' + esc(x.webUrl) + '">' + esc(t("open_web")) + "</a></p>" : "") +
    (x.releasePrefix ? '<div class="dl" id="dl"><p>' + esc(t("loading")) + "</p></div>" : "") + notice(x) +
    '<p class="lic"><a href="#/license">' + esc(t("license_link")) + "</a></p>" +
    (S.contactKey ? '<p class="lic"><a href="#/contact?tool=' + esc(x.id) + '">' + esc(t("report_bug")) + "</a></p>" : "") + "</aside></div>";
  var box = document.getElementById("dl");
  if (box) releases().then(function (all) { if (box.isConnected) fill(box, x, all); }).catch(function () { if (box.isConnected) box.innerHTML = '<p class="empty">' + esc(t("load_error")) + "</p>"; });
}
function feat() {
  var f = T.tools.filter(function (x) { return x.featured; });
  if (!f.length) return "";
  return '<section class="sec feat"><h2>' + esc(t("featured")) + "</h2>" + f.map(function (x) {
    return '<article class="fi"><div><h3><a href="#/tool/' + esc(x.id) + '">' + esc(loc(x.name)) + "</a></h3>" + tags(x) + "<p>" + esc(loc(x.summary)) + '</p></div><a class="btn main" href="#/tool/' + esc(x.id) + '">' + esc(t(x.status === "soon" ? "soon" : "open")) + "</a></article>";
  }).join("") + "</section>";
}
function vid(u) {
  var m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/.exec(u || "");
  if (m) return "https://www.youtube-nocookie.com/embed/" + m[1];
  m = /vimeo\.com\/(\d+)/.exec(u || "");
  return m ? "https://player.vimeo.com/video/" + m[1] : "";
}
function rich(q) { return esc(q).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\b[0-9A-Fa-f]{64}\b/g, '<code class="hash">$&</code>').replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|#\/[^)\s]*)\)/g, function (m, a, u) { return '<a href="' + u + '"' + (u.charAt(0) === "#" ? "" : ' target="_blank" rel="noopener"') + ">" + a + "</a>"; }).replace(/\n/g, "<br>"); }
function blk(q) {
  q = q.trim();
  if (/^## /.test(q)) { var n = q.indexOf("\n"), r = n < 0 ? "" : q.slice(n + 1).trim(); return "<h3>" + rich((n < 0 ? q : q.slice(0, n)).slice(3)) + "</h3>" + (r ? blk(r) : ""); }
  var ls = q.split("\n");
  if (ls.every(function (l) { return /^- /.test(l.trim()); })) return "<ul>" + ls.map(function (l) { return "<li>" + rich(l.trim().slice(2)) + "</li>"; }).join("") + "</ul>";
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
    (u ? '<div class="vid"><iframe src="' + esc(u) + '" title="' + esc(loc(x.name)) + '" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>' : "");
}
function thanks() {
  var d = document.getElementById("thx");
  if (!d) { d = document.createElement("dialog"); d.id = "thx"; document.body.appendChild(d); d.addEventListener("click", function (e) { if (e.target === d) d.close(); }); }
  if (d.open) return;
  d.innerHTML = '<button type="button" class="x" id="thx-x" aria-label="' + esc(t("close")) + '">&times;</button><h2>' + esc(t("thanks_title")) + "</h2><p>" + esc(t("thanks_text")) + '</p><p class="soft">' + esc(t("thanks_free")) + '</p><div class="acts"><a class="btn main" href="' + esc(S.donateUrl) + '" target="_blank" rel="noopener">' + esc(t("coffee")) + "</a>" +
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
  app.innerHTML = '<a class="back" href="#/tools">' + esc(t("back")) + '</a><section class="sec"><h1 class="tt">' + esc(t("contact_title")) + '</h1><p class="lead">' + esc(t("contact_lead")) + '</p><form id="cf" class="cf">' +
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
  app.innerHTML = '<a class="back" href="#/tools">' + esc(t("back")) + '</a><section class="sec law"><h1 class="tt">' + esc(loc(p.title)) + "</h1>" + loc(p.body).replace(/\r/g, "").split(/\n\s*\n/).map(blk).join("") + "</section>";
}
var MINDL = 100;
function nf(n) { return new Intl.NumberFormat(lang).format(n); }
function dls(r) { return r.assets.reduce(function (n, a) { return n + (a.download_count || 0); }, 0); }
function cnt(rs) { var n = rs.reduce(function (s, r) { return s + dls(r); }, 0); return n >= MINDL ? '<p class="ver">' + esc(nf(n) + " " + t("dl_count")) + "</p>" : ""; }
function stats() {
  app.innerHTML = '<a class="back" href="#/tools">' + esc(t("back")) + '</a><section class="sec"><h1 class="tt">' + esc(t("stats_title")) + '</h1><p class="lead">' + esc(t("stats_lead")) + '</p><div id="st"><p>' + esc(t("loading")) + "</p></div></section>";
  var box = document.getElementById("st");
  releases().then(function (all) { if (box.isConnected) box.innerHTML = statsHtml(all); }).catch(function () { if (box.isConnected) box.innerHTML = '<p class="empty">' + esc(t("load_error")) + "</p>"; });
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
  return '<div class="sc"><div><b>' + nf(grand) + "</b><span>" + esc(t("stats_total")) + "</span></div><div><b>" + nf(ntools) + "</b><span>" + esc(t("stats_tools")) + "</span></div><div><b>" + nf(nver) + "</b><span>" + esc(t("stats_versions")) + "</span></div></div>" +
    bl.map(function (b) {
      return '<div class="stb"><h3><span>' + esc(b.name) + "</span><span>" + nf(b.tot) + '</span></h3><div class="scroll"><table><thead><tr><th>' + esc(t("version")) + "</th><th>" + esc(t("date")) + "</th><th>" + esc(t("stats_downloads")) + "</th></tr></thead><tbody>" +
        b.rs.map(function (r) { return "<tr><td>" + esc(b.p ? r.tag_name.slice(b.p.length) : r.tag_name) + "</td><td>" + esc(dt(r.published_at)) + "</td><td>" + nf(dls(r)) + "</td></tr>"; }).join("") + "</tbody></table></div></div>";
    }).join("") + '<p class="note">' + esc(t("stats_note")) + "</p>";
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
  var raw = location.hash.replace(/^#\/?/, ""), qi = raw.indexOf("?"), q = qi < 0 ? "" : raw.slice(qi + 1), h = (qi < 0 ? raw : raw.slice(0, qi)).split("/");
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
  document.title = "FlorindoLAB – " + t("tagline");
  var lg = document.getElementById("lg");
  if (lg) lg.innerHTML = LG.map(function (p) { return '<a href="#/legal/' + esc(p.id) + '">' + esc(loc(p.title)) + "</a>"; }).join(" ");
}
function boot() {
  var l = null; try { l = localStorage.getItem("lang"); } catch (e) {}
  if (!l) l = (navigator.language || "fr").slice(0, 2);
  if (S.languages.indexOf(l) < 0) l = S.languages.indexOf("en") > -1 ? "en" : S.languages[0];
  sel.innerHTML = S.languages.map(function (c) { return '<option value="' + esc(c) + '">' + esc(L[c].lang_name) + "</option>"; }).join("");
  sel.onchange = function () { lang = sel.value; try { localStorage.setItem("lang", lang); } catch (e) {} stat(); route(); };
  window.addEventListener("hashchange", onHash);
  app.addEventListener("click", function (e) { var a = e.target.closest && e.target.closest("a[data-dl]"); if (a) setTimeout(thanks, 400); });
  lang = l; sel.value = l; stat(); route();
  var ig = document.getElementById("ig"); if (S.instagramUrl) { ig.href = S.instagramUrl; ig.hidden = false; }
  if (S.contactKey) document.getElementById("ct").hidden = false;
}
get("data/site.json").then(function (s) {
  S = s;
  return Promise.all([get("data/tools.json")].concat(S.languages.map(function (c) { return get("i18n/" + c + ".json"); })));
}).then(function (r) {
  T = r[0]; S.languages.forEach(function (c, i) { L[c] = r[i + 1]; });
  return get("data/legal.json").then(function (j) { LG = j.pages || []; }, function () {}).then(boot);
}).catch(function () {
  app.innerHTML = '<p class="empty">Impossible de charger le site / Could not load the site. (GitHub Pages ou serveur local requis, pas de double-clic sur le fichier.)</p>';
});
})();
