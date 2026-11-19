/**
 * GIF Studio by FlorindoLAB — interface du mode Express.
 *
 * Importer → choisir le passage → écrire → exporter. L'interface ne fait
 * que modifier le projet (src/model) ; l'aperçu et l'export passent par le
 * même moteur de rendu.
 */
import { instantApercu, tempsSource } from '../anim/temps.js';
import { CADENCES, EXPORT_EXPRESS, EXPORT_QUALITE_SUP, STYLES, calquePrincipal, changerFormat, creerCalqueMedia, creerCalqueTexte, creerProjet, deplacerRecadrage, definirTempsTexte, dimensionsSortie, enchainerTexte, fixe, synchroniserDuree, COTE_SCENE, appliquerRecadrage, creerElement, deplacerCalque, recadrageCouvrant, rgba, EMOJIS, RATIOS, SYMBOLES, } from '../model/projet.js';
import { rasteriserElement } from '../render/elements.js';
import { signalerPolicesChargees } from '../render/texte.js';
import { DEFINITIONS } from '../render/filtres.js';
import { Moteur } from '../render/renderer.js';
import { besoinsVideo, exporterExpress } from './express.js';
import { workerDisponible } from './exporter.js';
import { definirLangue, langueCourante, langueInitiale, nombre, poids, t, traduire } from './i18n.js';
import { ErreurImport, RegistreMedias } from './medias.js';
import { definirFichier, demanderPersistance, effacerSession, lireSession, planifierSauvegarde } from './session.js';
import { captureDisponible, Enregistrement, ErreurSource, telechargerLien } from './sources.js';
export const VERSION = '1.0.1-beta';
const DUREE_MIN_MS = 200;
const DUREE_MAX_MS = 15000;
const DUREE_ALERTE_MS = 6000;
const $ = (id) => document.getElementById(id);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
// ================================================================ état
const registre = new RegistreMedias();
let projet = null;
let moteur = null;
let selection = null;
let enLecture = true;
let horlogeDepart = performance.now();
/** Instant du GIF affiché à l'arrêt (ms) : posé par la pause, la frise ou la sélection d'un texte. */
let tArret = 0;
/** Dernier instant affiché, pour reprendre la lecture là où on s'est arrêté. */
let tAffiche = 0;
let modifieDepuisExport = false;
let workerOk = Promise.resolve(true);
/** Pendant qu'on déplace une poignée de découpage : instant source montré (ms). */
let apercuDecoupe = null;
const textes = () => (projet?.calques.filter((c) => c.type === 'texte') ?? []);
const principal = () => (projet ? calquePrincipal(projet) : undefined);
const mediaPrincipal = () => { const c = principal(); return c && projet ? projet.medias[c.media] : undefined; };
const sourceVideo = () => { const c = principal(); return c ? registre.videos.get(c.media) : undefined; };
const choisi = () => textes().find((c) => c.id === selection);
/** Tout ce qui se pose sur l'image : textes et éléments. */
const superposes = () => (projet?.calques.filter((c) => c.type !== 'media') ?? []);
const choisiElement = () => superposes().find((c) => c.type === 'element' && c.id === selection);
const choisiCalque = () => superposes().find((c) => c.id === selection);
function toast(cle, ...v) {
    const el = $('toast');
    el.textContent = t(cle, ...v);
    el.hidden = false;
    clearTimeout(toast.m);
    toast.m = setTimeout(() => (el.hidden = true), 7000);
}
// ================================================================ historique
const passe = [];
const futur = [];
let gesteEnCours = false;
/** À appeler AVANT une modification. `continu` regroupe un geste (glisser, curseur, frappe). */
function memoriser(continu = false) {
    if (!projet)
        return;
    if (continu && gesteEnCours)
        return;
    passe.push(JSON.stringify(projet));
    if (passe.length > 100)
        passe.shift();
    futur.length = 0;
    gesteEnCours = continu;
    majHistorique();
}
const finGeste = () => (gesteEnCours = false);
function majHistorique() {
    $('btn-annuler').disabled = !passe.length;
    $('btn-retablir').disabled = !futur.length;
}
function restaurer(json) {
    projet = JSON.parse(json);
    if (!superposes().some((c) => c.id === selection))
        selection = textes()[0]?.id ?? null;
    changement();
}
function annuler() { if (projet && passe.length) {
    futur.push(JSON.stringify(projet));
    restaurer(passe.pop());
    majHistorique();
} }
function retablir() { if (projet && futur.length) {
    passe.push(JSON.stringify(projet));
    restaurer(futur.pop());
    majHistorique();
} }
// ================================================================ ouverture
async function ouvrirFichier(f, depuisCapture = false) {
    $('texte-chargement').textContent = t('chargement');
    $('chargement').hidden = false;
    try {
        const ancien = projet;
        const ref = await registre.importer(f);
        if (ancien)
            for (const id of Object.keys(ancien.medias))
                registre.liberer(id);
        definirFichier(f);
        nouveauProjet(ref, undefined, depuisCapture);
    }
    catch (e) {
        toast(e instanceof ErreurImport ? e.message : 'format_inconnu');
    }
    finally {
        $('chargement').hidden = true;
        $('fichier').value = '';
    }
}
// ================================================================ lien direct et enregistrement
let lienEnCours = null;
async function importerLien(adresse) {
    if (!adresse.trim() || lienEnCours)
        return;
    lienEnCours = new AbortController();
    const texte = $('texte-chargement');
    texte.textContent = t('lien_telechargement', '');
    $('chargement').hidden = false;
    try {
        const f = await telechargerLien(adresse, (recus, total) => {
            texte.textContent = t('lien_telechargement', total ? `${Math.round((recus / total) * 100)} %` : poids(recus));
        }, lienEnCours.signal);
        $('champ-lien').value = '';
        await ouvrirFichier(f);
    }
    catch (e) {
        $('chargement').hidden = true;
        if (e.name !== 'AbortError')
            toast(e instanceof ErreurSource ? e.code : 'LIEN_REFUSE');
    }
    finally {
        lienEnCours = null;
    }
}
let enregistrement = null;
let chronoCapture;
async function lancerCapture(surface = 'browser') {
    if (enregistrement?.enCours)
        return;
    const e = new Enregistrement();
    enregistrement = e;
    let annule = false;
    const apercuCapture = $('apercu-capture');
    try {
        await e.demarrer(async (fin) => {
            try {
                const f = await fin;
                if (!annule)
                    await ouvrirFichier(f, true);
            }
            catch (err) {
                if (!annule)
                    toast(err instanceof ErreurSource ? err.code : 'CAPTURE_VIDE');
            }
            finally {
                // Après « Changer », un nouvel enregistrement a déjà pris la place : on n'y touche pas.
                if (enregistrement === e) {
                    clearInterval(chronoCapture);
                    apercuCapture.srcObject = null;
                    $('modal-capture').hidden = true;
                    enregistrement = null;
                }
            }
        }, surface);
    }
    catch (err) {
        enregistrement = null;
        toast(err instanceof ErreurSource ? err.code : 'CAPTURE_INDISPONIBLE');
        return;
    }
    $('modal-capture').hidden = false;
    // Retour visuel : ce qui est enregistré, et son nom.
    apercuCapture.srcObject = e.flux;
    apercuCapture.play().catch(() => undefined);
    const { type, titre } = e.nomSource;
    const genre = type ?? surface;
    const libelle = t(`surface_${genre === 'browser' ? 'onglet' : genre === 'window' ? 'fenetre' : 'ecran'}`);
    $('nom-source-capture').textContent = titre ? `${libelle} « ${titre} »` : libelle;
    const chrono = $('chrono-capture');
    const maj = () => {
        const s = Math.floor((performance.now() - e.debut) / 1000);
        chrono.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    };
    maj();
    clearInterval(chronoCapture);
    chronoCapture = setInterval(maj, 250);
    $('btn-arreter-capture').onclick = () => e.arreter();
    $('btn-annuler-capture').onclick = () => { annule = true; e.annuler(); };
    // Changer de source : on abandonne cet enregistrement et on rouvre la fenêtre de choix.
    $('btn-changer-source').onclick = () => {
        annule = true;
        e.annuler();
        enregistrement = null;
        lancerCapture(surface);
    };
}
function nouveauProjet(ref, sauve, depuisCapture = false) {
    if (sauve) {
        // Session reprise : le média a un nouvel identifiant.
        const ancienId = Object.keys(sauve.medias)[0];
        sauve.medias = { [ref.id]: ref };
        for (const c of sauve.calques)
            if (c.type === 'media' && c.media === ancienId)
                c.media = ref.id;
        projet = sauve;
    }
    else {
        const k = Math.min(1, COTE_SCENE / Math.max(ref.largeur, ref.hauteur));
        projet = creerProjet(Math.round(ref.largeur * k), Math.round(ref.hauteur * k), 3000);
        projet.medias[ref.id] = ref;
        projet.express = { format: 'origine', filtre: 'aucun' };
        const m = creerCalqueMedia(projet, ref);
        if (ref.type === 'video') {
            // Après un enregistrement, le moment voulu est en général juste avant l'arrêt :
            // on présélectionne les 3 dernières secondes (moins le temps de cliquer sur Arrêter).
            const fin = depuisCapture ? Math.max(Math.min(ref.dureeMs, 3000), ref.dureeMs - 400) : Math.min(ref.dureeMs, 3000);
            m.decoupe = { entreeMs: Math.max(0, fin - 3000), sortieMs: fin };
        }
        projet.calques.push(m);
        synchroniserDuree(projet, 3000);
        projet.calques.push(creerCalqueTexte(projet, '', 'CLASSIQUE', 'bas'));
    }
    selection = textes()[0]?.id ?? null;
    passe.length = 0;
    futur.length = 0;
    majHistorique();
    modifieDepuisExport = !!sauve;
    enLecture = true;
    horlogeDepart = performance.now();
    $('accueil').hidden = true;
    $('editeur').hidden = false;
    for (const id of ['btn-nouveau', 'btn-annuler', 'btn-retablir'])
        $(id).hidden = false;
    try {
        moteur?.detruire();
        // Un canvas dont le contexte WebGL a été libéré ne peut pas resservir : on le remplace.
        const ancienCanvas = $('apercu');
        const canvas = ancienCanvas.cloneNode(false);
        ancienCanvas.replaceWith(canvas);
        moteur = new Moteur(canvas, registre.fournisseur);
    }
    catch {
        toast('webgl');
        return;
    }
    const video = ref.type === 'video';
    $('decoupe').hidden = !video;
    $('duree-image').hidden = video;
    $('ligne-mouvement').hidden = video;
    $('vitesses').hidden = !video;
    // Miniatures : après l'aperçu exact (ou 3 s au plus), pour ne pas lui disputer le décodeur.
    if (video) {
        const depart = performance.now();
        const attendre = () => (exactPret || performance.now() - depart > 3000 ? dessinerMiniatures(true) : setTimeout(attendre, 150));
        setTimeout(attendre, 400);
    }
    dimensionnerApercu();
    changement(false);
    if (!sauve)
        $('contenu').focus();
}
function revenirAccueil() {
    if (modifieDepuisExport && !confirmerAbandon())
        return;
    $('toast').hidden = true;
    for (const id of Object.keys(projet?.medias ?? {}))
        registre.liberer(id);
    projet = null;
    moteur?.detruire();
    moteur = null;
    definirFichier(null);
    effacerSession();
    $('editeur').hidden = true;
    $('accueil').hidden = false;
    $('reprise').hidden = true;
    for (const id of ['btn-nouveau', 'btn-annuler', 'btn-retablir'])
        $(id).hidden = true;
}
/** Pas de boîte de dialogue bloquante : un second clic dans les 4 s confirme. */
let abandonArme = 0;
function confirmerAbandon() {
    if (performance.now() - abandonArme < 4000)
        return true;
    abandonArme = performance.now();
    toast('quitter');
    return false;
}
// ================================================================ modifications
let minuteurApercu;
/** À appeler APRÈS toute modification du projet. */
function changement(modifie = true) {
    if (!projet)
        return;
    if (modifie)
        modifieDepuisExport = true;
    majPanneau();
    majDecoupe();
    planifierSauvegarde(projet);
    // L'aperçu exact n'est déclaré prêt qu'après vérification (voir preparerApercuExact).
    if (sourceVideo())
        exactPret = false;
    clearTimeout(minuteurApercu);
    minuteurApercu = setTimeout(() => preparerApercuExact().catch(() => { }), 250);
}
/** Recalcule durée et animations après un changement de passage, de vitesse ou de durée. */
function recalculerDuree(dureeImageMs) {
    if (!projet)
        return;
    synchroniserDuree(projet, dureeImageMs);
    for (const tx of textes())
        recalerAnimations(tx);
    const m = principal();
    if (m && mediaPrincipal()?.type === 'image')
        appliquerMouvement(m.mouvementExpress ?? '');
}
/** Les animations d'un texte suivent sa durée d'affichage. */
function recalerAnimations(tx) {
    tx.animations = tx.animations.map((a) => presetTexte(a.type, tx.finMs - tx.debutMs)).filter(Boolean);
}
function presetTexte(type, D) {
    if (!type)
        return null;
    const d = {
        apparition: 500, disparition: 500, zoomEntree: 450, rebond: 700, secousse: D,
        pulsation: 800, clignotement: 500, machineAEcrire: Math.min(1500, D * 0.6),
    };
    return { type, debutMs: 0, dureeMs: d[type], intensite: type === 'secousse' ? 0.4 : 0.6 };
}
function appliquerMouvement(type) {
    const m = principal();
    if (!m || !projet)
        return;
    const D = projet.scene.dureeMs, L = projet.scene.largeur, H = projet.scene.hauteur;
    const base = L / m.recadrage.l;
    const cle = (tMs, valeur) => ({ tMs, valeur, courbe: 'entreeSortie' });
    const piste = (a, b) => ({ cles: [cle(0, a), cle(D, b)] });
    m.mouvementExpress = type;
    m.transform.echelle = fixe(base);
    m.transform.x = fixe(L / 2);
    m.transform.y = fixe(H / 2);
    m.animations = [];
    if (type === 'zoomAvant')
        m.transform.echelle = piste(base, base * 1.25);
    if (type === 'zoomArriere')
        m.transform.echelle = piste(base * 1.25, base);
    if (type === 'travelling') {
        m.transform.echelle = fixe(base * 1.15);
        m.transform.x = piste(L / 2 + L * 0.06, L / 2 - L * 0.06);
    }
    if (type === 'pulsation')
        m.animations = [{ type: 'pulsation', debutMs: 0, dureeMs: D / 2, intensite: 0.5 }];
}
const PRESETS_FILTRES = {
    aucun: {},
    nb: { noirBlanc: 1, contraste: 0.1 },
    sepia: { sepia: 0.85, contraste: 0.05 },
    vif: { saturation: 0.35, contraste: 0.12 },
    doux: { contraste: -0.18, luminosite: 0.06, saturation: -0.15 },
    contraste: { contraste: 0.35, saturation: 0.1 },
};
function appliquerPresetFiltre(nom) {
    const m = principal();
    if (!m || !projet)
        return;
    m.filtres = Object.entries(PRESETS_FILTRES[nom] ?? {}).map(([type, v]) => ({ type: type, valeur: fixe(v), actif: true }));
    projet.express = { ...(projet.express ?? { format: 'origine', filtre: 'aucun' }), filtre: nom };
}
const valeurFiltre = (m, type) => {
    const f = m.filtres.find((x) => x.type === type);
    return f && 'valeur' in f.valeur ? f.valeur.valeur : DEFINITIONS[type].neutre;
};
// ================================================================ panneau
function majPanneau() {
    if (!projet)
        return;
    // Onglets des textes (seulement s'il y en a plusieurs).
    const onglets = $('onglets-textes');
    onglets.innerHTML = '';
    if (textes().length > 1) {
        textes().forEach((tx, i) => {
            const b = document.createElement('button');
            b.textContent = tx.contenu.trim() || t('texte_n', i + 1);
            b.setAttribute('aria-pressed', String(tx.id === selection));
            b.onclick = () => { choisirTexte(tx.id); $('contenu').focus(); };
            onglets.append(b);
        });
    }
    const tx = choisi();
    const champ = $('contenu');
    if (document.activeElement !== champ)
        champ.value = tx?.contenu ?? '';
    champ.disabled = !tx;
    $('btn-supprimer-texte').disabled = !tx;
    $('btn-enchainer').disabled = !tx;
    majTempsTexte();
    majFrise();
    majStyleTexte();
    majElement();
    const nomStyle = tx ? Object.keys(STYLES).find((n) => JSON.stringify(STYLES[n].style) === JSON.stringify(tx.style)) : undefined;
    $$('[data-style]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.style === nomStyle)));
    $$('[data-style]').forEach((b) => (b.disabled = !tx));
    $('perso-texte').hidden = !tx;
    $('taille-texte').value = String(tx ? tx.taille / projet.scene.hauteur : 0.09);
    $('anim-texte').value = tx?.animations[0]?.type ?? '';
    const fmt = projet.express?.format ?? 'origine';
    $$('[data-format]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.format === fmt)));
    const m = principal();
    const media = mediaPrincipal();
    const cadrable = !!(m && media && (m.recadrage.l < media.largeur - 1 || m.recadrage.h < media.hauteur - 1));
    $('astuce-cadrage').hidden = !cadrable;
    $('cadre').classList.toggle('cadrable', cadrable);
    $$('[data-preset]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preset === (projet.express?.filtre ?? 'aucun'))));
    if (m)
        $$('[data-filtre]').forEach((inp) => (inp.value = String(valeurFiltre(m, inp.dataset.filtre))));
    $('mouvement-image').value = m?.mouvementExpress ?? '';
    $$('[data-vitesse]').forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.vitesse) === projet.lecture.vitesse)));
    $$('[data-sens]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.sens === projet.lecture.sens)));
    $('curseur-duree').value = String(projet.scene.dureeMs / 1000);
    $('val-duree-image').textContent = `${nombre(projet.scene.dureeMs / 1000)} s`;
    $('cadence').value = String(projet.export.delaiCs);
    $('taille-sortie').value = String(projet.export.coteMax);
    $('qualite-sup').checked = projet.export.objectif === 'qualite';
    const { largeur, hauteur } = dimensionsSortie(projet);
    const nb = Math.max(1, Math.round(projet.scene.dureeMs / (projet.export.delaiCs * 10))) * (projet.lecture.sens === 'pingpong' ? 2 : 1);
    $('resume-export').textContent = t('resume_export', largeur, hauteur, nb, `${nombre(projet.scene.dureeMs / 1000)} s`);
    dimensionnerApercu();
}
function construireCurseursFiltres() {
    const zone = $('curseurs-filtres');
    zone.innerHTML = '';
    for (const [type, d] of Object.entries(DEFINITIONS)) {
        const l = document.createElement('label');
        l.className = 'ligne';
        l.innerHTML = `<span data-i18n="f_${type}"></span><input type="range" min="${d.min}" max="${d.max}" step="${d.pas}" data-filtre="${type}">`;
        zone.append(l);
    }
    zone.addEventListener('pointerdown', () => memoriser(true));
    zone.addEventListener('input', (e) => {
        const inp = e.target;
        const m = principal();
        if (!m || !projet || !inp.dataset.filtre)
            return;
        memoriser(true);
        const type = inp.dataset.filtre;
        const v = Number(inp.value);
        const f = m.filtres.find((x) => x.type === type);
        if (f)
            f.valeur = fixe(v);
        else
            m.filtres.push({ type, valeur: fixe(v), actif: true });
        projet.express = { ...(projet.express ?? { format: 'origine', filtre: 'aucun' }), filtre: 'perso' };
        changement();
    });
    zone.addEventListener('change', finGeste);
}
function remplirCadences() {
    const sel = $('cadence');
    const v = sel.value;
    sel.innerHTML = CADENCES.map((c) => `<option value="${c.delaiCs}">${nombre(c.ips, c.ips % 1 ? 1 : 0)} ${langueCourante() === 'fr' ? 'i/s' : 'fps'}</option>`).join('');
    if (v)
        sel.value = v;
}
// ================================================================ aperçu
function dimensionnerApercu() {
    if (!projet)
        return;
    const scene = $('scene');
    const vue = recadrage?.vue ?? projet;
    const r = vue.scene.largeur / vue.scene.hauteur;
    // Sur mobile la colonne n'a pas de hauteur propre : on vise ~55 % de l'écran.
    const empile = matchMedia('(max-width: 900px)').matches;
    const cs = getComputedStyle(scene);
    const marges = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const dispoL = scene.clientWidth - 24, dispoH = empile ? window.innerHeight * 0.55 : scene.clientHeight - marges - 8;
    const L = Math.max(120, Math.min(dispoL, dispoH * r, 900));
    $('cadre').style.setProperty('--larg-apercu', `${Math.floor(L)}px`);
}
let exactPret = true;
let cleExacte = '';
/** Extrait en arrière-plan les images vidéo exactes de l'export, pour l'aperçu. */
async function preparerApercuExact() {
    if (!projet)
        return;
    const besoins = besoinsVideo(projet, registre);
    if (!besoins.length) {
        exactPret = true;
        $('pastille-apercu').hidden = true;
        return;
    }
    const cle = JSON.stringify(besoins.map((b) => [b.instants.map(Math.round), b.largeur]));
    if (cle === cleExacte && exactPret)
        return;
    cleExacte = cle;
    exactPret = besoins.every((b) => b.source.pretes(b.instants) === b.instants.length);
    if (exactPret)
        return;
    const pastille = $('pastille-apercu');
    for (const b of besoins) {
        const ok = await b.source.assurer(b.instants, b.largeur, (f, n) => {
            if (cle !== cleExacte)
                return;
            pastille.hidden = f >= n;
            pastille.innerHTML = `<span class="rond"></span>${t('apercu_exact', Math.round((f / n) * 100))}`;
        });
        if (!ok || cle !== cleExacte)
            return;
    }
    pastille.hidden = true;
    exactPret = true;
    horlogeDepart = performance.now();
}
/** Instant projet à afficher maintenant. */
function instantCourant() {
    const p = projet;
    const D = p.scene.dureeMs;
    const src = sourceVideo();
    const m = principal();
    if (apercuDecoupe !== null && m)
        return Math.max(0, Math.min(D - 1, (apercuDecoupe - m.decoupe.entreeMs) / p.lecture.vitesse));
    if (src && m && !exactPret && src.captureEnCours) {
        // L'extracteur lit le passage : on montre ce qu'il lit, sans second décodage.
        if (!src.apercu.paused)
            src.apercu.pause();
        return Math.max(0, Math.min(D - 1, (src.lecteurDirect.currentTime * 1000 - m.decoupe.entreeMs) / p.lecture.vitesse));
    }
    if (src && m && !exactPret) {
        // Aperçu direct : la vidéo joue le passage en boucle pendant l'extraction.
        const v = src.apercu;
        const { entreeMs, sortieMs } = m.decoupe;
        if (enLecture) {
            const vitesse = Math.min(4, Math.max(0.25, p.lecture.vitesse));
            if (v.playbackRate !== vitesse)
                v.playbackRate = vitesse;
            const ms = v.currentTime * 1000;
            if (ms < entreeMs - 60 || ms >= sortieMs - 5)
                v.currentTime = entreeMs / 1000;
            if (v.paused && !v.seeking)
                v.play().catch(() => undefined);
            return Math.max(0, Math.min(D - 1, (v.currentTime * 1000 - entreeMs) / p.lecture.vitesse));
        }
        // À l'arrêt : la vidéo directe se place sur l'instant demandé.
        if (!v.paused)
            v.pause();
        const voulu = tempsSource(m, tArret, p.lecture.vitesse);
        if (!v.seeking && Math.abs(v.currentTime * 1000 - voulu) > 30)
            v.currentTime = voulu / 1000;
        return tArret;
    }
    if (src && !src.apercu.paused)
        src.apercu.pause();
    if (!enLecture)
        return Math.min(tArret, D - 1);
    return instantApercu(p, performance.now() - horlogeDepart);
}
function boucle() {
    if (projet && moteur) {
        const tMs = instantCourant();
        tAffiche = tMs;
        const vue = recadrage?.vue ?? projet;
        const { largeur, hauteur } = dimensionsSortie(vue);
        try {
            moteur.rendreImage(vue, tMs, largeur, hauteur);
        }
        catch (e) {
            console.error(e);
        }
        if (recadrage)
            majZoneRecadrage();
        majPoignees();
        majTete(tMs);
        majTeteFrise(tMs);
    }
    requestAnimationFrame(boucle);
}
function basculerLecture(force) {
    if (!projet)
        return;
    const avant = enLecture;
    enLecture = force ?? !enLecture;
    if (avant && !enLecture)
        tArret = tAffiche;
    if (!avant && enLecture)
        horlogeDepart = performance.now() - (p_sens() === 'avant' ? tArret : 0);
    $('btn-lecture').classList.toggle('en-pause', !enLecture);
}
function p_sens() { return projet?.lecture.sens ?? 'avant'; }
/** Arrête la lecture et affiche l'instant `t` du GIF. */
function allerA(t) {
    if (!projet)
        return;
    if (enLecture)
        basculerLecture(false);
    tArret = Math.max(0, Math.min(projet.scene.dureeMs - 1, t));
}
/** Sélectionne un texte ; s'il n'est pas visible à l'instant affiché, on s'y place. */
function choisirTexte(id, recaler = true) {
    selection = id;
    fermerSelecteurs();
    const tx = choisiCalque();
    if (tx && recaler && (tAffiche < tx.debutMs || tAffiche >= tx.finMs))
        allerA(tx.debutMs + Math.min(400, (tx.finMs - tx.debutMs) / 2));
    majPanneau();
}
// ================================================================ frise des textes
const tempsCourt = (ms) => `${nombre(ms / 1000)} s`;
function majFrise() {
    if (!projet)
        return;
    const D = projet.scene.dureeMs;
    const voies = $('frise-voies');
    // Le calque le plus haut sur la frise est celui qui est devant (comme dans un logiciel de montage).
    const liste = superposes().slice().reverse();
    const numeros = new Map(textes().map((x, k) => [x.id, k + 1]));
    // Reconstruction légère : quelques barres au plus.
    voies.innerHTML = '';
    liste.forEach((tx, i) => {
        const voie = document.createElement('div');
        voie.className = 'voie';
        const b = document.createElement('div');
        b.className = 'barre-texte' + (tx.id === selection ? ' choisie' : '');
        b.dataset.id = tx.id;
        b.style.left = `${(tx.debutMs / D) * 100}%`;
        b.style.width = `${((tx.finMs - tx.debutMs) / D) * 100}%`;
        void i;
        b.textContent = tx.type === 'texte' ? tx.contenu.trim() || t('texte_n', numeros.get(tx.id) ?? 1) : nomElement(tx);
        if (tx.id === enOrdre)
            b.classList.add('deplacee');
        if (tx.type === 'element')
            b.classList.add('element');
        b.title = `${b.textContent} · ${tempsCourt(tx.debutMs)} → ${tempsCourt(tx.finMs)}`;
        const g = document.createElement('span');
        g.className = 'bord g';
        g.dataset.bord = 'g';
        const d = document.createElement('span');
        d.className = 'bord d';
        d.dataset.bord = 'd';
        b.append(g, d);
        voie.append(b);
        voies.append(voie);
    });
    $('frise').hidden = liste.length === 0;
    const rang = liste.findIndex((x) => x.id === selection);
    $('btn-avancer').disabled = rang <= 0;
    $('btn-reculer').disabled = rang < 0 || rang >= liste.length - 1;
}
/** Calque en cours de déplacement vertical sur la frise (mis en évidence). */
let enOrdre = null;
/** Passe le calque choisi devant (+1) ou derrière (-1) d'un cran. */
function changerPlan(sens) {
    if (!projet || !selection)
        return;
    const liste = superposes();
    const i = liste.findIndex((c) => c.id === selection);
    if (i < 0)
        return;
    const cible = i + sens;
    if (cible < 0 || cible >= liste.length)
        return;
    memoriser();
    deplacerCalque(projet, selection, cible);
    changement();
}
function majTeteFrise(tMs) {
    if (!projet)
        return;
    $('frise-tete').style.left = `${(tMs / projet.scene.dureeMs) * 100}%`;
    $('frise-temps').textContent = `${tempsCourt(tMs)} / ${tempsCourt(projet.scene.dureeMs)}`;
}
function brancherFrise() {
    const corps = $('frise-corps');
    let geste = null;
    const versMs = (dx, largeur) => (projet ? (dx / largeur) * projet.scene.dureeMs : 0);
    /** Aimantation sur 0, la fin, la tête de lecture et les bords des autres textes (8 px). */
    const aimanter = (t, sauf, largeur) => {
        if (!projet)
            return t;
        const seuil = (8 / largeur) * projet.scene.dureeMs;
        const cibles = [0, projet.scene.dureeMs, tArret, ...superposes().filter((x) => x.id !== sauf).flatMap((x) => [x.debutMs, x.finMs])];
        let meilleur = t, ecart = seuil;
        for (const c of cibles) {
            const e = Math.abs(c - t);
            if (e < ecart) {
                ecart = e;
                meilleur = c;
            }
        }
        return meilleur;
    };
    corps.addEventListener('pointerdown', (e) => {
        if (!projet)
            return;
        const rect = $('frise-voies').getBoundingClientRect();
        const cible = e.target;
        const barre = cible.closest('.barre-texte');
        corps.setPointerCapture(e.pointerId);
        if (barre) {
            const tx = superposes().find((x) => x.id === barre.dataset.id);
            if (!tx)
                return;
            memoriser();
            selection = tx.id;
            fermerSelecteurs();
            const mode = cible.dataset.bord ?? 'tout';
            geste = { mode, id: tx.id, x0: e.clientX, y0: e.clientY, d0: tx.debutMs, f0: tx.finMs, largeur: rect.width, decide: mode !== 'tout' };
            allerA(mode === 'd' ? tx.finMs - 1 : tx.debutMs);
            majPanneau();
        }
        else {
            // Clic hors des barres : on déplace la tête de lecture.
            geste = { mode: 'tete', x0: e.clientX, y0: e.clientY, d0: 0, f0: 0, largeur: rect.width, decide: true };
            allerA(versMs(e.clientX - rect.left, rect.width));
        }
    });
    corps.addEventListener('pointermove', (e) => {
        if (!geste || !projet)
            return;
        if (geste.mode === 'tete') {
            const rect = $('frise-voies').getBoundingClientRect();
            allerA(versMs(e.clientX - rect.left, rect.width));
            return;
        }
        const tx = superposes().find((x) => x.id === geste.id);
        if (!tx)
            return;
        // Une barre tirée surtout verticalement change l'ordre des calques au lieu du temps.
        if (!geste.decide) {
            const dx = Math.abs(e.clientX - geste.x0), dy = Math.abs(e.clientY - geste.y0);
            if (dy > 10 && dy > dx * 1.2) {
                geste.mode = 'ordre';
                geste.decide = true;
                enOrdre = tx.id;
                corps.classList.add('ordre');
            }
            else if (dx > 6)
                geste.decide = true;
            else
                return;
        }
        if (geste.mode === 'ordre') {
            const voies = Array.from($('frise-voies').children);
            let ligne = voies.findIndex((v) => { const r = v.getBoundingClientRect(); return e.clientY < r.bottom; });
            if (ligne < 0)
                ligne = voies.length - 1;
            const rang = voies.length - 1 - ligne; // la frise est inversée : en haut = devant
            if (superposes().findIndex((c) => c.id === tx.id) !== rang) {
                deplacerCalque(projet, tx.id, rang);
                majFrise();
            }
            return;
        }
        const dt = versMs(e.clientX - geste.x0, geste.largeur);
        if (geste.mode === 'g') {
            definirTempsTexte(projet, tx, aimanter(geste.d0 + dt, tx.id, geste.largeur), geste.f0);
            allerA(tx.debutMs);
        }
        else if (geste.mode === 'd') {
            definirTempsTexte(projet, tx, geste.d0, aimanter(geste.f0 + dt, tx.id, geste.largeur));
            allerA(tx.finMs - 1);
        }
        else {
            const duree = geste.f0 - geste.d0;
            let debut = Math.max(0, Math.min(projet.scene.dureeMs - duree, geste.d0 + dt));
            // Aimantation par le début ou par la fin, la plus proche.
            const parDebut = aimanter(debut, tx.id, geste.largeur);
            const parFin = aimanter(debut + duree, tx.id, geste.largeur) - duree;
            debut = Math.abs(parDebut - debut) <= Math.abs(parFin - debut) ? parDebut : parFin;
            definirTempsTexte(projet, tx, debut, debut + duree);
            allerA(tx.debutMs);
        }
        recalerAnimations(tx);
        majFrise();
        majTempsTexte();
        majElement();
    });
    const fin = () => {
        if (!geste)
            return;
        const modif = geste.mode !== 'tete';
        geste = null;
        enOrdre = null;
        corps.classList.remove('ordre');
        if (modif)
            changement();
    };
    corps.addEventListener('pointerup', fin);
    corps.addEventListener('pointercancel', fin);
    $('btn-avancer').onclick = () => changerPlan(1);
    $('btn-reculer').onclick = () => changerPlan(-1);
}
function majTempsTexte() {
    const tx = choisi();
    $('bloc-temps-texte').hidden = !tx;
    if (!tx || !projet)
        return;
    $('temps-texte').textContent = t('temps_texte', tempsCourt(tx.debutMs), tempsCourt(tx.finMs));
    $('btn-tout-gif').hidden = tx.debutMs === 0 && tx.finMs === projet.scene.dureeMs;
}
// ================================================================ poignées des textes (DOM, jamais exportées)
function majPoignees() {
    const couche = $('poignees');
    const canvas = $('apercu');
    if (!moteur || !projet || !canvas.width)
        return;
    couche.hidden = !!recadrage;
    const k = canvas.clientWidth / canvas.width;
    const liste = superposes();
    const ids = new Set(liste.map((c) => c.id));
    for (const el of Array.from(couche.children))
        if (!ids.has(el.dataset.id))
            el.remove();
    for (const c of liste) {
        let el = couche.querySelector(`[data-id="${c.id}"]`);
        if (!el) {
            el = document.createElement('div');
            el.className = 'poignee';
            el.dataset.id = c.id;
            const coin = document.createElement('span');
            coin.className = 'coin';
            el.append(coin);
            brancherGlisserTexte(el);
            couche.append(el);
        }
        const g = moteur.geometries.get(c.id);
        el.hidden = !g;
        el.classList.toggle('choisie', c.id === selection);
        if (!g)
            continue;
        el.classList.toggle('zone', c.type === 'element' && (c.genre === 'flou' || c.genre === 'pixel'));
        el.style.left = `${(g.cx - g.l / 2) * k}px`;
        el.style.top = `${(g.cy - g.h / 2) * k}px`;
        el.style.width = `${g.l * k}px`;
        el.style.height = `${g.h * k}px`;
        el.style.transform = `rotate(${g.rotation}deg)`;
    }
}
/** Éléments qu'on peut étirer librement (les autres gardent leurs proportions). */
const etirable = (c) => c.type === 'element' && (c.genre === 'flou' || c.genre === 'pixel' || ['rectangle', 'cercle', 'fleche', 'souligne', 'bulle'].includes(c.contenu));
function brancherGlisserTexte(el) {
    let depart = null;
    el.addEventListener('pointerdown', (e) => {
        const c = superposes().find((x) => x.id === el.dataset.id);
        if (!c || !projet)
            return;
        e.stopPropagation();
        choisirTexte(c.id, false);
        memoriser();
        el.setPointerCapture(e.pointerId);
        const x = 'valeur' in c.transform.x ? c.transform.x.valeur : projet.scene.largeur / 2;
        const y = 'valeur' in c.transform.y ? c.transform.y.valeur : projet.scene.hauteur / 2;
        const r = el.getBoundingClientRect();
        depart = {
            x: e.clientX, y: e.clientY, tx: x, ty: y,
            coin: e.target.classList.contains('coin'),
            cx: r.left + r.width / 2, cy: r.top + r.height / 2,
            taille: c.type === 'texte' ? c.taille : 0,
            l: c.type === 'element' ? c.largeur : 0, h: c.type === 'element' ? c.hauteur : 0,
        };
    });
    el.addEventListener('pointermove', (e) => {
        const c = superposes().find((x) => x.id === el.dataset.id);
        if (!depart || !c || !projet)
            return;
        if (depart.coin) {
            // Redimensionnement depuis le coin : rapport des distances au centre.
            const sx = Math.max(0.05, Math.abs(e.clientX - depart.cx) / Math.max(4, Math.abs(depart.x - depart.cx)));
            const sy = Math.max(0.05, Math.abs(e.clientY - depart.cy) / Math.max(4, Math.abs(depart.y - depart.cy)));
            const s = Math.hypot(e.clientX - depart.cx, e.clientY - depart.cy) / Math.max(4, Math.hypot(depart.x - depart.cx, depart.y - depart.cy));
            const mini = Math.min(projet.scene.largeur, projet.scene.hauteur);
            if (c.type === 'texte')
                c.taille = Math.round(Math.max(mini * 0.02, Math.min(mini * 0.6, depart.taille * s)));
            else if (etirable(c) && !e.shiftKey) {
                c.largeur = Math.round(Math.max(8, depart.l * sx));
                c.hauteur = Math.round(Math.max(8, depart.h * sy));
            }
            else {
                c.largeur = Math.round(Math.max(8, depart.l * s));
                c.hauteur = Math.round(Math.max(8, depart.h * s));
            }
            return;
        }
        const versScene = projet.scene.largeur / $('apercu').clientWidth;
        let x = depart.tx + (e.clientX - depart.x) * versScene;
        let y = depart.ty + (e.clientY - depart.y) * versScene;
        // Aimantation sur l'axe vertical central.
        if (Math.abs(x - projet.scene.largeur / 2) < projet.scene.largeur * 0.02)
            x = projet.scene.largeur / 2;
        x = Math.min(projet.scene.largeur, Math.max(0, x));
        y = Math.min(projet.scene.hauteur, Math.max(0, y));
        c.transform.x = fixe(x);
        c.transform.y = fixe(y);
    });
    const fin = () => {
        if (!depart)
            return;
        depart = null;
        changement();
    };
    el.addEventListener('pointerup', fin);
    el.addEventListener('pointercancel', fin);
    el.addEventListener('dblclick', () => { if (choisi())
        $('contenu').select(); });
}
/** Glisser l'image (hors texte) déplace le cadrage quand le format coupe la source. */
function brancherCadrage() {
    const cadre = $('cadre');
    let depart = null;
    cadre.addEventListener('pointerdown', (e) => {
        const m = principal();
        if (!m || !projet || recadrage || !cadre.classList.contains('cadrable'))
            return;
        memoriser();
        cadre.setPointerCapture(e.pointerId);
        depart = { x: e.clientX, y: e.clientY, rx: m.recadrage.x, ry: m.recadrage.y };
    });
    cadre.addEventListener('pointermove', (e) => {
        const m = principal();
        if (!depart || !m || !projet)
            return;
        const k = m.recadrage.l / $('apercu').clientWidth; // px source par px écran
        deplacerRecadrage(projet, depart.rx - (e.clientX - depart.x) * k, depart.ry - (e.clientY - depart.y) * k);
    });
    const fin = () => { if (depart) {
        depart = null;
        changement();
    } };
    cadre.addEventListener('pointerup', fin);
    cadre.addEventListener('pointercancel', fin);
}
// ================================================================ personnalisation du texte
const POLICES = [
    { id: 'anton', nom: 'Anton', css: "'Anton', 'Inter', sans-serif", graisse: 400, majuscules: true },
    { id: 'inter', nom: 'Inter', css: "'Inter', system-ui, sans-serif", graisse: 800, majuscules: false },
    { id: 'bangers', nom: 'Bangers', css: "'Bangers', 'Inter', sans-serif", graisse: 400, majuscules: true },
    { id: 'marker', nom: 'Permanent Marker', css: "'Permanent Marker', 'Inter', sans-serif", graisse: 400, majuscules: false },
    { id: 'bebas', nom: 'Bebas Neue', css: "'Bebas Neue', 'Inter', sans-serif", graisse: 400, majuscules: true },
    { id: 'lobster', nom: 'Lobster', css: "'Lobster', 'Inter', serif", graisse: 400, majuscules: false },
    { id: 'mono', nom: 'Roboto Mono', css: "'Roboto Mono', ui-monospace, monospace", graisse: 700, majuscules: false },
];
const familleDe = (css) => css.match(/'([^']+)'/)?.[1] ?? '';
const NUANCES_TEXTE = ['#ffffff', '#000000', '#ffe400', '#ff3b30', '#2e7dff', '#34c759', '#ff2d92', '#d9a441'];
const NUANCES_CONTOUR = ['#000000', '#ffffff', '#1d3557', '#ff3b30'];
const NUANCES_BANDEAU = ['#000000', '#ffffff', '#ffe400', '#ff3b30', '#2e7dff'];
const NUANCES_ELEMENT = ['#ff3b30', '#ffe400', '#ffffff', '#000000', '#2e7dff', '#34c759', '#ff2d92', '#d9a441'];
const versHex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const depuisHex = (h, a = 1) => rgba(parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), a);
/** Nuancier : pastilles + sélecteur libre (+ « aucun » si demandé). */
function construireNuancier(el, couleurs, surChoix, avecAucun = false) {
    el.innerHTML = '';
    if (avecAucun) {
        const b = document.createElement('button');
        b.className = 'aucun';
        b.dataset.hex = '';
        b.title = t('sans_contour');
        b.onclick = () => surChoix(null);
        el.append(b);
    }
    for (const hex of couleurs) {
        const b = document.createElement('button');
        b.style.background = hex;
        b.dataset.hex = hex;
        b.title = hex;
        b.onclick = () => surChoix(hex);
        el.append(b);
    }
    const libre = document.createElement('input');
    libre.type = 'color';
    libre.title = t('couleur_perso');
    libre.addEventListener('input', () => surChoix(libre.value));
    libre.addEventListener('change', finGeste);
    el.append(libre);
}
function marquerNuancier(el, hex) {
    el.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.hex || null) === hex)));
    const libre = el.querySelector('input[type=color]');
    if (libre && hex && document.activeElement !== libre)
        libre.value = hex;
}
function majStyleTexte() {
    const tx = choisi();
    if (!tx || !projet)
        return;
    const s = tx.style;
    const police = POLICES.find((p) => familleDe(p.css) === familleDe(s.police));
    $('police-texte').value = police?.id ?? 'anton';
    $('taille-texte').value = String(tx.taille / projet.scene.hauteur);
    marquerNuancier($('couleur-texte'), versHex(s.couleur));
    marquerNuancier($('couleur-contour'), s.contour ? versHex(s.contour.couleur) : null);
    $('epaisseur-contour').value = String(s.contour?.epaisseurRel ?? 0);
    $('ombre-texte').checked = !!s.ombre;
    $('bandeau-texte').checked = !!s.fond;
    $('ligne-bandeau').hidden = !s.fond;
    marquerNuancier($('couleur-bandeau'), s.fond ? versHex(s.fond.couleur) : null);
    $$('[data-align]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.align === s.alignement)));
    $('majuscules-texte').checked = s.majuscules;
    $('anim-texte').value = tx.animations[0]?.type ?? '';
}
/** Modifie le style du texte choisi ; `continu` pour les curseurs et pipettes. */
function modifierStyle(f, continu = false) {
    const tx = choisi();
    if (!tx)
        return;
    memoriser(continu);
    f(tx);
    changement();
}
function brancherStyleTexte() {
    const selPolice = $('police-texte');
    selPolice.innerHTML = POLICES.map((p) => `<option value="${p.id}" style="font-family:${p.css.replace(/"/g, '')};font-weight:${p.graisse}">${p.nom}</option>`).join('');
    selPolice.onchange = () => {
        const p = POLICES.find((x) => x.id === selPolice.value);
        document.fonts?.load(`40px '${familleDe(p.css)}'`).then(() => signalerPolicesChargees()).catch(() => undefined);
        modifierStyle((tx) => { tx.style.police = p.css; tx.style.graisse = p.graisse; tx.style.majuscules = p.majuscules; });
    };
    construireNuancier($('couleur-texte'), NUANCES_TEXTE, (hex) => modifierStyle((tx) => { if (hex)
        tx.style.couleur = depuisHex(hex); }, true));
    construireNuancier($('couleur-contour'), NUANCES_CONTOUR, (hex) => modifierStyle((tx) => {
        if (!hex)
            tx.style.contour = null;
        else
            tx.style.contour = { couleur: depuisHex(hex), epaisseurRel: tx.style.contour?.epaisseurRel || 0.12 };
    }, true), true);
    construireNuancier($('couleur-bandeau'), NUANCES_BANDEAU, (hex) => modifierStyle((tx) => {
        if (hex)
            tx.style.fond = { couleur: depuisHex(hex, 0.8), rayonRel: tx.style.fond?.rayonRel ?? 0.22 };
    }, true));
    const ep = $('epaisseur-contour');
    ep.addEventListener('input', () => modifierStyle((tx) => {
        const v = Number(ep.value);
        tx.style.contour = v <= 0.001 ? null : { couleur: tx.style.contour?.couleur ?? rgba(0, 0, 0), epaisseurRel: v };
    }, true));
    ep.addEventListener('change', finGeste);
    $('ombre-texte').onchange = (e) => modifierStyle((tx) => {
        tx.style.ombre = e.target.checked ? { couleur: rgba(0, 0, 0, 0.75), flouRel: 0.18, decalageRel: 0.06 } : null;
    });
    $('bandeau-texte').onchange = (e) => modifierStyle((tx) => {
        tx.style.fond = e.target.checked ? { couleur: rgba(0, 0, 0, 0.8), rayonRel: 0.22 } : null;
    });
    $$('[data-align]').forEach((b) => (b.onclick = () => modifierStyle((tx) => { tx.style.alignement = b.dataset.align; })));
    $('majuscules-texte').onchange = (e) => modifierStyle((tx) => { tx.style.majuscules = e.target.checked; });
}
// ================================================================ éléments : emojis, symboles, flou
function nomElement(e) {
    if (e.genre === 'emoji')
        return e.contenu;
    if (e.genre === 'symbole')
        return t(`sym_${e.contenu}`);
    return t(`titre_${e.genre}`);
}
function fermerSelecteurs() {
    $('selecteur-emoji').hidden = true;
    $('selecteur-symbole').hidden = true;
    $$('[data-ajout]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
}
function ajouterElement(genre, contenu = '') {
    if (!projet)
        return;
    memoriser();
    const e = creerElement(projet, genre, contenu);
    if (genre === 'symbole' && contenu === 'bulle')
        e.couleur = rgba(255, 255, 255);
    if (genre === 'symbole' && ['fleche', 'souligne', 'rectangle'].includes(contenu)) {
        e.largeur = Math.round(e.largeur * (contenu === 'rectangle' ? 1.4 : 1.6));
        if (contenu !== 'rectangle')
            e.hauteur = Math.round(e.hauteur * 0.6);
    }
    if (contenu === 'bulle') {
        e.largeur = Math.round(e.largeur * 1.5);
    }
    // Décalé du centre si un élément y est déjà.
    const n = superposes().filter((c) => c.type === 'element').length;
    e.transform.x = fixe(projet.scene.largeur / 2 + ((n % 3) - 1) * projet.scene.largeur * 0.12);
    e.transform.y = fixe(projet.scene.hauteur * 0.42);
    projet.calques.push(e);
    selection = e.id;
    fermerSelecteurs();
    if (tAffiche < e.debutMs || tAffiche >= e.finMs)
        allerA(e.debutMs);
    changement();
}
function majElement() {
    const e = choisiElement();
    $('proprietes-element').hidden = !e;
    if (!e || !projet)
        return;
    $('titre-element').textContent = nomElement(e);
    $('ligne-emoji').hidden = e.genre !== 'emoji';
    $('ligne-symbole').hidden = e.genre !== 'symbole';
    $('ligne-couleur-element').hidden = e.genre !== 'symbole';
    $('ligne-ellipse').hidden = e.genre !== 'flou' && e.genre !== 'pixel';
    $('ligne-intensite').hidden = e.genre === 'emoji' || (e.genre === 'symbole' && ['bulle', 'coeur', 'etoile', 'eclair'].includes(e.contenu));
    $('libelle-intensite').textContent = t(e.genre === 'flou' ? 'intensite_flou' : e.genre === 'pixel' ? 'intensite_pixel' : 'intensite_trait');
    const champ = $('contenu-emoji');
    if (document.activeElement !== champ)
        champ.value = e.contenu;
    $('forme-symbole').value = e.contenu;
    marquerNuancier($('couleur-element'), versHex(e.couleur));
    $('intensite-element').value = String(e.intensite);
    $('ellipse-element').checked = e.ellipse;
    $('rotation-element').value = String('valeur' in e.transform.rotation ? e.transform.rotation.valeur : 0);
    $('opacite-element').value = String('valeur' in e.transform.opacite ? e.transform.opacite.valeur : 1);
    $('anim-element').value = e.animations[0]?.type ?? '';
    $('temps-element').textContent = t('temps_texte', tempsCourt(e.debutMs), tempsCourt(e.finMs));
    $('btn-tout-gif-element').hidden = e.debutMs === 0 && e.finMs === projet.scene.dureeMs;
}
function modifierElement(f, continu = false) {
    const e = choisiElement();
    if (!e)
        return;
    memoriser(continu);
    f(e);
    changement();
}
function brancherElements(supprimer) {
    // Grille d'emojis et de symboles.
    const grille = $('grille-emojis');
    grille.innerHTML = '';
    for (const em of EMOJIS) {
        const b = document.createElement('button');
        b.textContent = em;
        b.onclick = () => ajouterElement('emoji', em);
        grille.append(b);
    }
    const autre = $('autre-emoji');
    const valider = () => { const v = autre.value.trim(); if (v) {
        ajouterElement('emoji', v);
        autre.value = '';
    } };
    autre.addEventListener('keydown', (e) => { if (e.key === 'Enter') {
        e.preventDefault();
        valider();
    } });
    autre.addEventListener('change', valider);
    const gs = $('grille-symboles');
    gs.innerHTML = '';
    const formes = $('forme-symbole');
    formes.innerHTML = '';
    for (const sy of SYMBOLES) {
        const b = document.createElement('button');
        b.dataset.i18nTitle = `sym_${sy}`;
        const apercu = document.createElement('canvas');
        apercu.width = 64;
        apercu.height = 64;
        try {
            const factice = { genre: 'symbole', contenu: sy, largeur: 52, hauteur: sy === 'fleche' || sy === 'souligne' ? 30 : 52, couleur: rgba(217, 164, 65), intensite: 0.5 };
            const r = rasteriserElement(factice, 1);
            apercu.getContext('2d').drawImage(r.toile, (64 - r.largeur) / 2, (64 - r.hauteur) / 2);
        }
        catch { /* aperçu facultatif */ }
        b.append(apercu);
        b.onclick = () => ajouterElement('symbole', sy);
        gs.append(b);
        const o = document.createElement('option');
        o.value = sy;
        o.dataset.i18n = `sym_${sy}`;
        formes.append(o);
    }
    $$('[data-ajout]').forEach((b) => (b.onclick = () => {
        const genre = b.dataset.ajout;
        if (genre === 'flou' || genre === 'pixel') {
            ajouterElement(genre);
            return;
        }
        const cible = $(genre === 'emoji' ? 'selecteur-emoji' : 'selecteur-symbole');
        const ouvrir = cible.hidden;
        fermerSelecteurs();
        cible.hidden = !ouvrir;
        b.setAttribute('aria-expanded', String(ouvrir));
    }));
    // Propriétés de l'élément choisi.
    const champEmoji = $('contenu-emoji');
    champEmoji.addEventListener('input', () => { const v = champEmoji.value.trim(); if (v)
        modifierElement((e) => { e.contenu = v; }, true); });
    champEmoji.addEventListener('blur', finGeste);
    formes.onchange = () => modifierElement((e) => { e.contenu = formes.value; });
    construireNuancier($('couleur-element'), NUANCES_ELEMENT, (hex) => modifierElement((e) => { if (hex)
        e.couleur = depuisHex(hex); }, true));
    const curseur = (id, f) => {
        const el = $(id);
        el.addEventListener('input', () => modifierElement((e) => f(e, Number(el.value)), true));
        el.addEventListener('change', finGeste);
    };
    curseur('intensite-element', (e, v) => (e.intensite = v));
    curseur('rotation-element', (e, v) => (e.transform.rotation = fixe(Math.abs(v) < 3 ? 0 : v)));
    curseur('opacite-element', (e, v) => (e.transform.opacite = fixe(v)));
    $('ellipse-element').onchange = (ev) => modifierElement((e) => { e.ellipse = ev.target.checked; });
    const anim = $('anim-element');
    anim.innerHTML = $('anim-texte').innerHTML.replace(/<option value="machineAEcrire"[^>]*><\/option>/, '');
    anim.onchange = () => modifierElement((e) => {
        const p = presetTexte(anim.value, e.finMs - e.debutMs);
        e.animations = p ? [p] : [];
        horlogeDepart = performance.now();
    });
    $('btn-tout-gif-element').onclick = () => modifierElement((e) => { definirTempsTexte(projet, e, 0, projet.scene.dureeMs); recalerAnimations(e); });
    $('btn-supprimer-element').onclick = supprimer;
}
let recadrage = null;
const ratioDe = (nom, media) => nom === 'libre' ? null : nom === 'origine' ? media.largeur / media.hauteur : RATIOS[nom];
function entrerRecadrage() {
    const m = principal();
    const media = mediaPrincipal();
    if (!projet || !m || !media)
        return;
    // Vue de travail : l'image source entière, sans textes ni éléments.
    const vue = structuredClone(projet);
    const k = Math.min(1, COTE_SCENE / Math.max(media.largeur, media.hauteur));
    vue.scene.largeur = Math.round(media.largeur * k);
    vue.scene.hauteur = Math.round(media.hauteur * k);
    const mv = vue.calques.find((c) => c.type === 'media');
    mv.recadrage = { x: 0, y: 0, l: media.largeur, h: media.hauteur };
    mv.transform = { ...mv.transform, x: fixe(vue.scene.largeur / 2), y: fixe(vue.scene.hauteur / 2), echelle: fixe(vue.scene.largeur / media.largeur) };
    mv.animations = [];
    vue.calques = [mv];
    const fmt = projet.express?.format ?? 'origine';
    recadrage = { r: { ...m.recadrage }, ratio: fmt in RATIOS || fmt === 'origine' ? fmt : 'libre', vue };
    $('recadreur').hidden = false;
    $('barre-recadrage').hidden = false;
    $('scene').classList.add('en-recadrage');
    majBarreRecadrage();
    dimensionnerApercu();
}
function quitterRecadrage() {
    recadrage = null;
    $('recadreur').hidden = true;
    $('barre-recadrage').hidden = true;
    $('scene').classList.remove('en-recadrage');
    dimensionnerApercu();
}
function majBarreRecadrage() {
    if (!recadrage)
        return;
    $$('[data-ratio]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ratio === recadrage.ratio)));
    $('dims-recadrage').textContent = `${Math.round(recadrage.r.l)} × ${Math.round(recadrage.r.h)} px`;
}
function majZoneRecadrage() {
    const media = mediaPrincipal();
    if (!recadrage || !media)
        return;
    const c = $('apercu');
    const kx = c.clientWidth / media.largeur, ky = c.clientHeight / media.hauteur;
    const z = $('zone-recadrage');
    z.style.left = `${recadrage.r.x * kx}px`;
    z.style.top = `${recadrage.r.y * ky}px`;
    z.style.width = `${recadrage.r.l * kx}px`;
    z.style.height = `${recadrage.r.h * ky}px`;
}
/** Plus grand rectangle au ratio donné, centré dans `r` (borné à l'image). */
function ajusterRatio(r, ratio, media) {
    if (!ratio)
        return r;
    const cx = r.x + r.l / 2, cy = r.y + r.h / 2;
    let l = r.l, h = l / ratio;
    if (h > r.h) {
        h = r.h;
        l = h * ratio;
    }
    return borner({ x: cx - l / 2, y: cy - h / 2, l, h }, media);
}
function borner(r, media) {
    const l = Math.min(media.largeur, Math.max(32, r.l)), h = Math.min(media.hauteur, Math.max(32, r.h));
    return { x: Math.max(0, Math.min(media.largeur - l, r.x)), y: Math.max(0, Math.min(media.hauteur - h, r.y)), l, h };
}
function brancherRecadrageLibre() {
    const recadreur = $('recadreur');
    let geste = null;
    recadreur.addEventListener('pointerdown', (e) => {
        const media = mediaPrincipal();
        if (!recadrage || !media)
            return;
        const cible = e.target;
        const poignee = cible.dataset.p ?? (cible.closest('#zone-recadrage') ? 'deplacer' : '');
        if (!poignee)
            return;
        e.preventDefault();
        recadreur.setPointerCapture(e.pointerId);
        geste = { poignee, x0: e.clientX, y0: e.clientY, r0: { ...recadrage.r }, k: media.largeur / $('apercu').clientWidth };
    });
    recadreur.addEventListener('pointermove', (e) => {
        const media = mediaPrincipal();
        if (!geste || !recadrage || !media)
            return;
        const dx = (e.clientX - geste.x0) * geste.k, dy = (e.clientY - geste.y0) * geste.k;
        const r0 = geste.r0;
        if (geste.poignee === 'deplacer') {
            recadrage.r = borner({ ...r0, x: r0.x + dx, y: r0.y + dy }, media);
        }
        else {
            const p = geste.poignee;
            let x1 = r0.x, y1 = r0.y, x2 = r0.x + r0.l, y2 = r0.y + r0.h;
            if (p.includes('w'))
                x1 = Math.min(x2 - 32, Math.max(0, x1 + dx));
            if (p.includes('e'))
                x2 = Math.max(x1 + 32, Math.min(media.largeur, x2 + dx));
            if (p.includes('n'))
                y1 = Math.min(y2 - 32, Math.max(0, y1 + dy));
            if (p.includes('s'))
                y2 = Math.max(y1 + 32, Math.min(media.hauteur, y2 + dy));
            let r = { x: x1, y: y1, l: x2 - x1, h: y2 - y1 };
            const ratio = ratioDe(recadrage.ratio, media);
            if (ratio) {
                // Proportions imposées : la poignée tirée décide, le côté opposé reste en place.
                if (p === 'n' || p === 's') {
                    const l = r.h * ratio;
                    r.x = r0.x + r0.l / 2 - l / 2;
                    r.l = l;
                }
                else {
                    const h = r.l / ratio;
                    if (p.includes('n'))
                        r.y = y2 - h;
                    else if (!p.includes('s'))
                        r.y = r0.y + r0.h / 2 - h / 2;
                    r.h = h;
                }
                // Si ça déborde de l'image, on réduit en gardant les proportions.
                const kx = Math.min(1, (r.x < 0 ? (r.l + r.x) / r.l : 1), (r.x + r.l > media.largeur ? (media.largeur - r.x) / r.l : 1));
                const ky = Math.min(1, (r.y < 0 ? (r.h + r.y) / r.h : 1), (r.y + r.h > media.hauteur ? (media.hauteur - r.y) / r.h : 1));
                const kk = Math.max(0.05, Math.min(kx, ky));
                if (kk < 1) {
                    const ax = p.includes('w') ? r.x + r.l : r.x, ay = p.includes('n') ? r.y + r.h : r.y;
                    r.l *= kk;
                    r.h *= kk;
                    if (p.includes('w'))
                        r.x = ax - r.l;
                    if (p.includes('n'))
                        r.y = ay - r.h;
                }
            }
            recadrage.r = borner(r, media);
        }
        majBarreRecadrage();
    });
    const fin = () => { geste = null; };
    recadreur.addEventListener('pointerup', fin);
    recadreur.addEventListener('pointercancel', fin);
    $('btn-recadrer').onclick = entrerRecadrage;
    $$('[data-ratio]').forEach((b) => (b.onclick = () => {
        const media = mediaPrincipal();
        if (!recadrage || !media)
            return;
        recadrage.ratio = b.dataset.ratio;
        const ratio = ratioDe(recadrage.ratio, media);
        // Nouvelles proportions : le plus grand cadre possible, centré sur le cadre actuel.
        if (ratio) {
            const plein = recadrageCouvrant(media.largeur, media.hauteur, ratio);
            const cx = recadrage.r.x + recadrage.r.l / 2, cy = recadrage.r.y + recadrage.r.h / 2;
            recadrage.r = borner({ ...plein, x: cx - plein.l / 2, y: cy - plein.h / 2 }, media);
        }
        majBarreRecadrage();
    }));
    $('btn-recadrage-reinit').onclick = () => {
        const media = mediaPrincipal();
        if (!recadrage || !media)
            return;
        recadrage.r = { x: 0, y: 0, l: media.largeur, h: media.hauteur };
        recadrage.ratio = 'origine';
        majBarreRecadrage();
    };
    $('btn-recadrage-annuler').onclick = quitterRecadrage;
    $('btn-recadrage-valider').onclick = () => {
        if (!recadrage || !projet)
            return;
        memoriser();
        appliquerRecadrage(projet, recadrage.r);
        projet.express = { ...(projet.express ?? { format: 'origine', filtre: 'aucun' }), format: recadrage.ratio === 'libre' ? 'libre' : recadrage.ratio };
        const m = principal();
        if (m?.mouvementExpress)
            appliquerMouvement(m.mouvementExpress);
        quitterRecadrage();
        changement();
    };
}
// ================================================================ barre de découpage
let miniatures = [];
let generationMiniatures = 0;
async function dessinerMiniatures(regenerer = false) {
    const src = sourceVideo();
    const canvas = $('miniatures');
    const piste = $('piste');
    if (!src || !piste.clientWidth)
        return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(piste.clientWidth * dpr);
    canvas.height = Math.round(piste.clientHeight * dpr);
    const ctx = canvas.getContext('2d');
    const dessiner = () => {
        ctx.fillStyle = '#16232c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (!miniatures.length)
            return;
        const n = miniatures.length, w = canvas.width / n;
        miniatures.forEach((b, i) => {
            // Recadrage « couvrant » de chaque miniature dans sa case.
            const r = Math.max(w / b.width, canvas.height / b.height);
            const sw = w / r, sh = canvas.height / r;
            ctx.drawImage(b, (b.width - sw) / 2, (b.height - sh) / 2, sw, sh, Math.floor(i * w), 0, Math.ceil(w), canvas.height);
        });
    };
    if (!regenerer) {
        dessiner();
        return;
    }
    const gen = ++generationMiniatures;
    miniatures.forEach((b) => b.close());
    miniatures = [];
    const ref = src.ref;
    const hauteurMini = Math.round(54 * dpr);
    const n = Math.max(6, Math.min(16, Math.ceil(canvas.width / (hauteurMini * (ref.largeur / ref.hauteur)))));
    const tmp = [];
    try {
        await src.miniatures(n, hauteurMini, (i, b) => {
            if (gen !== generationMiniatures)
                return;
            tmp[i] = b;
            miniatures = tmp.filter(Boolean);
            dessiner();
        });
    }
    catch { /* miniatures facultatives */ }
}
function majDecoupe() {
    const m = principal();
    const media = mediaPrincipal();
    if (!m || media?.type !== 'video')
        return;
    const D = media.dureeMs;
    const g = (m.decoupe.entreeMs / D) * 100, d = (m.decoupe.sortieMs / D) * 100;
    $('selection').style.left = `${g}%`;
    $('selection').style.width = `${d - g}%`;
    $('voile-g').style.width = `${g}%`;
    $('voile-d').style.width = `${100 - d}%`;
    const duree = m.decoupe.sortieMs - m.decoupe.entreeMs;
    $('val-debut').textContent = `${nombre(m.decoupe.entreeMs / 1000)} s`;
    $('val-duree').textContent = `${nombre(duree / 1000)} s` + (projet.lecture.vitesse !== 1 ? ` → ${nombre(projet.scene.dureeMs / 1000)} s` : '');
    $('alerte-duree').hidden = projet.scene.dureeMs <= DUREE_ALERTE_MS;
}
function majTete(tProjet) {
    const m = principal();
    const media = mediaPrincipal();
    if (!m || media?.type !== 'video' || !projet)
        return;
    const tS = apercuDecoupe ?? tempsSource(m, tProjet, projet.lecture.vitesse);
    $('tete').style.left = `${(tS / media.dureeMs) * 100}%`;
}
function brancherDecoupe() {
    const piste = $('piste');
    let geste = null;
    const mediaVideo = () => { const m = mediaPrincipal(); return m?.type === 'video' ? m : undefined; };
    const versMs = (dx) => {
        const media = mediaVideo();
        return media ? (dx / piste.clientWidth) * media.dureeMs : 0;
    };
    piste.addEventListener('pointerdown', (e) => {
        const m = principal();
        const media = mediaVideo();
        if (!m || !media || !projet)
            return;
        const cible = e.target;
        let mode = cible.id === 'poignee-g' ? 'g' : cible.id === 'poignee-d' ? 'd' : 'tout';
        memoriser();
        if (cible.id === 'piste' || cible.id === 'miniatures' || cible.classList.contains('voile')) {
            // Clic hors de la sélection : la sélection vient se centrer là, même durée.
            const rect = piste.getBoundingClientRect();
            const centre = versMs(e.clientX - rect.left);
            const duree = m.decoupe.sortieMs - m.decoupe.entreeMs;
            const e0 = Math.max(0, Math.min(media.dureeMs - duree, centre - duree / 2));
            m.decoupe = { entreeMs: Math.round(e0), sortieMs: Math.round(e0 + duree) };
            mode = 'tout';
        }
        piste.setPointerCapture(e.pointerId);
        geste = { mode, x0: e.clientX, e0: m.decoupe.entreeMs, s0: m.decoupe.sortieMs };
        appliquer(e.clientX);
    });
    const appliquer = (x) => {
        const m = principal();
        const media = mediaVideo();
        if (!geste || !m || !media || !projet)
            return;
        const dt = versMs(x - geste.x0);
        const D = media.dureeMs;
        let { e0: e, s0: s } = geste;
        if (geste.mode === 'g')
            e = Math.min(s - DUREE_MIN_MS, Math.max(0, s - DUREE_MAX_MS, e + dt));
        else if (geste.mode === 'd')
            s = Math.max(e + DUREE_MIN_MS, Math.min(D, e + DUREE_MAX_MS, s + dt));
        else {
            const d = s - e;
            e = Math.max(0, Math.min(D - d, e + dt));
            s = e + d;
        }
        m.decoupe = { entreeMs: Math.round(e), sortieMs: Math.round(s) };
        recalculerDuree();
        apercuDecoupe = geste.mode === 'd' ? s - 1 : e;
        sourceVideo()?.montrer(apercuDecoupe);
        exactPret = false;
        majDecoupe();
    };
    piste.addEventListener('pointermove', (e) => appliquer(e.clientX));
    const fin = () => {
        if (!geste)
            return;
        geste = null;
        apercuDecoupe = null;
        horlogeDepart = performance.now();
        changement();
    };
    piste.addEventListener('pointerup', fin);
    piste.addEventListener('pointercancel', fin);
}
// ================================================================ export
let exportEnCours = null;
async function exporter() {
    if (!projet || exportEnCours)
        return;
    const modal = $('modal-export');
    modal.hidden = false;
    $('export-cours').hidden = false;
    $('export-fini').hidden = true;
    const titre = $('titre-export');
    const barre = $('barre-export');
    const etapes = { preparation: [0, 0.35], encodage: [0.35, 1], reduction: [0, 1] };
    const surEtape = (e, f) => {
        titre.textContent = t(`etape_${e}`);
        const [a, b] = etapes[e];
        barre.style.width = `${Math.round((a + (b - a) * f) * 100)}%`;
    };
    surEtape('preparation', 0);
    exportEnCours = new AbortController();
    const etaitEnLecture = enLecture;
    basculerLecture(false);
    try {
        const r = await exporterExpress(projet, registre, {
            budgetOctets: projet.export.tailleCibleOctets,
            worker: await workerOk,
            signal: exportEnCours.signal,
            surEtape,
        });
        const url = URL.createObjectURL(r.blob);
        const ancienne = $('resultat-img').src;
        if (ancienne.startsWith('blob:'))
            URL.revokeObjectURL(ancienne);
        $('resultat-img').src = url;
        const lien = $('btn-telecharger');
        lien.href = url;
        const nom = (mediaPrincipal()?.nom ?? 'gif').replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 60) || 'gif';
        lien.download = `${nom}.gif`;
        $('resultat-infos').textContent = t('infos_resultat', r.largeur, r.hauteur, r.nbImages, poids(r.blob.size), nombre(r.dureeMs / 1000));
        const red = $('resultat-reduction');
        red.hidden = !r.reductions.length;
        if (r.reductions.length)
            red.textContent = t('reduit', poids(projet.export.tailleCibleOctets ?? 0), [...new Set(r.reductions)].map((x) => t(`red_${x}`)).join(', '));
        const fichier = new File([r.blob], `${nom}.gif`, { type: 'image/gif' });
        // Dans l'aperçu claude.ai, les liens de téléchargement sont bloqués :
        // on passe par la capacité « downloads » de la page quand elle existe.
        lien.onclick = (ev) => {
            const claude = window.claude;
            if (!claude?.use)
                return;
            ev.preventDefault();
            claude.use('downloads').then((d) => d?.save({ filename: `${nom}.gif`, data: r.blob })).catch(() => undefined);
        };
        const partager = $('btn-partager');
        partager.hidden = !(navigator.canShare?.({ files: [fichier] }));
        partager.onclick = () => navigator.share({ files: [fichier] }).catch(() => undefined);
        $('export-cours').hidden = true;
        $('export-fini').hidden = false;
        modifieDepuisExport = false;
    }
    catch (e) {
        modal.hidden = true;
        if (e.name !== 'AbortError')
            toast('export_echec', e.message);
    }
    finally {
        exportEnCours = null;
        if (etaitEnLecture && $('modal-export').hidden)
            basculerLecture(true);
    }
}
// ================================================================ à propos
async function infosTechniques() {
    const c = document.createElement('canvas').getContext('webgl2');
    const ext = c?.getExtension('WEBGL_debug_renderer_info');
    const gpu = c && ext ? c.getParameter(ext.UNMASKED_RENDERER_WEBGL) : c ? 'WebGL2' : 'WebGL2 indisponible';
    const p = projet;
    return [
        `GIF Studio by FlorindoLAB ${VERSION}`,
        `Navigateur : ${navigator.userAgent}`,
        `GPU : ${gpu}`,
        `Worker d'encodage : ${(await workerOk) ? 'oui' : 'non'} · WebCodecs : ${'VideoDecoder' in window ? 'oui' : 'non'}`,
        p ? `Projet : ${p.scene.largeur}×${p.scene.hauteur}, ${p.scene.dureeMs} ms, ${p.calques.length} calques, export ${JSON.stringify(p.export)}` : 'Aucun projet ouvert',
        p ? `Média : ${Object.values(p.medias).map((m) => `${m.type} ${m.mime} ${m.largeur}×${m.hauteur}`).join(', ')}` : '',
    ].filter(Boolean).join('\n');
}
// ================================================================ branchements
function brancher() {
    // Langue
    const majLangue = () => $$('[data-langue]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.langue === langueCourante())));
    $$('[data-langue]').forEach((b) => (b.onclick = () => { definirLangue(b.dataset.langue); majLangue(); remplirCadences(); majPanneau(); majDecoupe(); }));
    definirLangue(langueInitiale());
    majLangue();
    // Import
    const depot = $('depot');
    $('fichier').onchange = (e) => { const f = e.target.files?.[0]; if (f)
        ouvrirFichier(f); };
    depot.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        $('fichier').click();
    } });
    for (const zone of [document.body]) {
        zone.addEventListener('dragover', (e) => { e.preventDefault(); depot.classList.add('survol'); });
        zone.addEventListener('dragleave', (e) => { if (!e.relatedTarget)
            depot.classList.remove('survol'); });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            depot.classList.remove('survol');
            const f = e.dataTransfer?.files?.[0];
            if (!f)
                return;
            if (projet && modifieDepuisExport && !confirmerAbandon())
                return;
            ouvrirFichier(f);
        });
    }
    window.addEventListener('paste', (e) => {
        if (e.target.closest?.('textarea, input'))
            return;
        const f = Array.from(e.clipboardData?.files ?? []).find((x) => x.type.startsWith('image/') || x.type.startsWith('video/'));
        if (f) {
            e.preventDefault();
            ouvrirFichier(f);
            return;
        }
        // Un lien collé sur l'accueil : on l'importe directement.
        const texte = e.clipboardData?.getData('text/plain')?.trim() ?? '';
        if (!projet && /^https?:\/\//i.test(texte)) {
            e.preventDefault();
            $('champ-lien').value = texte;
            importerLien(texte);
        }
    });
    $('form-lien').addEventListener('submit', (e) => { e.preventDefault(); importerLien($('champ-lien').value); });
    $('capture-choix').hidden = !captureDisponible();
    $$('[data-surface]').forEach((b) => (b.onclick = () => lancerCapture(b.dataset.surface)));
    // En-tête
    $('btn-nouveau').onclick = revenirAccueil;
    $('btn-annuler').onclick = annuler;
    $('btn-retablir').onclick = retablir;
    $('btn-apropos').onclick = () => { $('apropos-version').textContent = t('ap_version', VERSION); $('modal-apropos').hidden = false; };
    $$('.fermer-modal').forEach((b) => (b.onclick = () => (b.closest('.voile-modal').hidden = true)));
    $('modal-apropos').addEventListener('click', (e) => { if (e.target === e.currentTarget)
        $('modal-apropos').hidden = true; });
    $('btn-copier-infos').onclick = async () => {
        try {
            await navigator.clipboard.writeText(await infosTechniques());
            $('btn-copier-infos').textContent = t('ap_copie');
        }
        catch { /* refusé */ }
        setTimeout(() => ($('btn-copier-infos').textContent = t('ap_copier')), 2000);
    };
    // Texte
    const champ = $('contenu');
    champ.addEventListener('input', () => {
        const tx = choisi();
        if (!tx)
            return;
        memoriser(true);
        tx.contenu = champ.value;
        tx.nom = champ.value.slice(0, 24);
        changement();
    });
    champ.addEventListener('blur', finGeste);
    $$('[data-style]').forEach((b) => (b.onclick = () => {
        const tx = choisi();
        if (!tx || !projet)
            return;
        memoriser();
        const s = STYLES[b.dataset.style];
        tx.style = structuredClone(s.style);
        tx.taille = Math.round(projet.scene.hauteur * s.tailleRel);
        changement();
    }));
    $('btn-ajouter-texte').onclick = () => {
        if (!projet)
            return;
        memoriser();
        const pris = new Set(textes().map((c) => { const y = 'valeur' in c.transform.y ? c.transform.y.valeur : 0; return y < projet.scene.hauteur / 3 ? 'haut' : y > (2 * projet.scene.hauteur) / 3 ? 'bas' : 'centre'; }));
        const pos = !pris.has('haut') ? 'haut' : !pris.has('bas') ? 'bas' : 'centre';
        const tx = creerCalqueTexte(projet, '', 'CLASSIQUE', pos);
        projet.calques.push(tx);
        selection = tx.id;
        changement();
        champ.focus();
    };
    $('btn-enchainer').onclick = () => {
        const tx = choisi();
        if (!tx || !projet)
            return;
        memoriser();
        const suite = enchainerTexte(projet, tx);
        recalerAnimations(tx);
        recalerAnimations(suite);
        selection = suite.id;
        allerA(suite.debutMs + Math.min(300, (suite.finMs - suite.debutMs) / 2));
        changement();
        champ.focus();
    };
    $('btn-tout-gif').onclick = () => {
        const tx = choisi();
        if (!tx || !projet)
            return;
        memoriser();
        definirTempsTexte(projet, tx, 0, projet.scene.dureeMs);
        recalerAnimations(tx);
        changement();
    };
    const supprimerTexte = () => {
        fermerSelecteurs();
        if (!projet || !selection)
            return;
        memoriser();
        projet.calques = projet.calques.filter((c) => c.id !== selection);
        selection = textes().at(-1)?.id ?? null;
        changement();
    };
    $('btn-supprimer-texte').onclick = supprimerTexte;
    brancherStyleTexte();
    brancherElements(supprimerTexte);
    brancherRecadrageLibre();
    document.fonts?.addEventListener?.('loadingdone', () => signalerPolicesChargees());
    const taille = $('taille-texte');
    taille.addEventListener('input', () => { const tx = choisi(); if (tx && projet) {
        memoriser(true);
        tx.taille = Math.round(Number(taille.value) * projet.scene.hauteur);
        changement();
    } });
    taille.addEventListener('change', finGeste);
    $('anim-texte').onchange = (e) => {
        const tx = choisi();
        if (!tx || !projet)
            return;
        memoriser();
        const p = presetTexte(e.target.value, tx.finMs - tx.debutMs);
        tx.animations = p ? [p] : [];
        horlogeDepart = performance.now();
        changement();
    };
    // Format, filtres, mouvement
    $$('[data-format]').forEach((b) => (b.onclick = () => {
        if (!projet)
            return;
        // « Libre » ouvre le recadrage, proportions libres.
        if (b.dataset.format === 'libre') {
            entrerRecadrage();
            if (recadrage) {
                recadrage.ratio = 'libre';
                majBarreRecadrage();
            }
            return;
        }
        memoriser();
        changerFormat(projet, b.dataset.format);
        projet.express = { ...(projet.express ?? { format: 'origine', filtre: 'aucun' }), format: b.dataset.format };
        const m = principal();
        if (m?.mouvementExpress)
            appliquerMouvement(m.mouvementExpress);
        changement();
    }));
    $$('[data-preset]').forEach((b) => (b.onclick = () => { memoriser(); appliquerPresetFiltre(b.dataset.preset); changement(); }));
    $('mouvement-image').onchange = (e) => { memoriser(); appliquerMouvement(e.target.value); horlogeDepart = performance.now(); changement(); };
    construireCurseursFiltres();
    // Lecture
    $('btn-lecture').onclick = () => basculerLecture();
    $$('[data-vitesse]').forEach((b) => (b.onclick = () => {
        if (!projet)
            return;
        memoriser();
        projet.lecture.vitesse = Number(b.dataset.vitesse);
        // Garder la durée dans les limites : on raccourcit le passage si besoin.
        const m = principal();
        if (m && mediaPrincipal()?.type === 'video') {
            const maxSource = DUREE_MAX_MS * projet.lecture.vitesse;
            if (m.decoupe.sortieMs - m.decoupe.entreeMs > maxSource)
                m.decoupe.sortieMs = Math.round(m.decoupe.entreeMs + maxSource);
        }
        recalculerDuree();
        horlogeDepart = performance.now();
        changement();
    }));
    $$('[data-sens]').forEach((b) => (b.onclick = () => { if (projet) {
        memoriser();
        projet.lecture.sens = b.dataset.sens;
        horlogeDepart = performance.now();
        changement();
    } }));
    const curseurDuree = $('curseur-duree');
    curseurDuree.addEventListener('input', () => { memoriser(true); recalculerDuree(Number(curseurDuree.value) * 1000); changement(); });
    curseurDuree.addEventListener('change', finGeste);
    const cadence = $('cadence');
    remplirCadences();
    cadence.onchange = () => { if (projet) {
        memoriser();
        projet.export.delaiCs = Number(cadence.value);
        changement();
    } };
    $('taille-sortie').onchange = (e) => { if (projet) {
        memoriser();
        projet.export.coteMax = Number(e.target.value);
        changement();
    } };
    $('qualite-sup').onchange = (e) => {
        if (!projet)
            return;
        memoriser();
        projet.export = structuredClone(e.target.checked ? EXPORT_QUALITE_SUP : EXPORT_EXPRESS);
        changement();
    };
    // Export
    $('btn-exporter').onclick = exporter;
    $('btn-annuler-export').onclick = () => { exportEnCours?.abort(); $('modal-export').hidden = true; };
    $('btn-continuer').onclick = () => { $('modal-export').hidden = true; basculerLecture(true); };
    // Clavier
    window.addEventListener('keydown', (e) => {
        const saisie = e.target.closest?.('textarea, input, select');
        if (e.key === 'Escape') {
            if (enregistrement)
                return; // on arrête un enregistrement avec ses propres boutons
            if (recadrage) {
                quitterRecadrage();
                return;
            }
            $$('.voile-modal').forEach((m) => { if (!exportEnCours)
                m.hidden = true; });
            return;
        }
        if (!projet || saisie)
            return;
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (e.shiftKey)
                retablir();
            else
                annuler();
        }
        else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            retablir();
        }
        else if (e.key === ' ') {
            e.preventDefault();
            basculerLecture();
        }
        else if (e.key === 'PageUp' && selection) {
            e.preventDefault();
            changerPlan(1);
        }
        else if (e.key === 'PageDown' && selection) {
            e.preventDefault();
            changerPlan(-1);
        }
        else if ((e.key === 'Delete' || e.key === 'Backspace') && selection && !recadrage) {
            e.preventDefault();
            supprimerTexte();
        }
        else if (e.key === 'Enter' && recadrage) {
            e.preventDefault();
            $('btn-recadrage-valider').click();
        }
    });
    window.addEventListener('beforeunload', (e) => { if (projet && modifieDepuisExport) {
        e.preventDefault();
        e.returnValue = '';
    } });
    new ResizeObserver(() => { dimensionnerApercu(); dessinerMiniatures(false); }).observe($('scene'));
    new ResizeObserver(() => dessinerMiniatures(false)).observe($('piste'));
    brancherDecoupe();
    brancherCadrage();
    brancherFrise();
    traduire();
}
async function proposerReprise() {
    const s = await lireSession();
    if (!s?.fichier || projet)
        return;
    const date = new Date(s.date).toLocaleString(langueCourante() === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });
    $('reprise-info').textContent = `${s.fichier.name} · ${date}`;
    $('reprise').hidden = false;
    $('btn-reprendre').onclick = async () => {
        $('reprise').hidden = true;
        $('chargement').hidden = false;
        try {
            const ref = await registre.importer(s.fichier);
            definirFichier(s.fichier);
            nouveauProjet(ref, s.projet);
        }
        catch {
            toast('VIDEO_ILLISIBLE');
            effacerSession();
        }
        finally {
            $('chargement').hidden = true;
        }
    };
    $('btn-ignorer').onclick = () => { $('reprise').hidden = true; effacerSession(); };
}
brancher();
workerOk = workerDisponible();
demanderPersistance();
proposerReprise();
// La police meme doit être chargée avant la première rastérisation du texte.
document.fonts?.load("40px 'Anton'").catch(() => undefined);
requestAnimationFrame(boucle);
// Point d'entrée pour les tests automatisés (sans effet pour l'utilisateur).
window.__gifStudio = {
    get projet() { return projet; },
    get exactPret() { return exactPret; },
    ouvrirFichier,
    moteur: () => moteur,
    registre,
};
//# sourceMappingURL=main.js.map