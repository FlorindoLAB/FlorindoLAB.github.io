/**
 * Fabriques et opérations pures sur le projet.
 * Aucune dépendance au navigateur : utilisable dans un worker ou sous Node.
 */
import { VERSION_PROJET, } from './types.js';
export const fixe = (valeur) => ({ valeur });
export const rgba = (r, g, b, a = 1) => ({ r, g, b, a });
export const BLANC = rgba(255, 255, 255);
export const NOIR = rgba(0, 0, 0);
let compteur = 0;
/** Identifiant court, unique dans la session. */
export function nouvelId(prefixe) {
    compteur = (compteur + 1) % 1e6;
    const alea = Math.floor(Math.random() * 36 ** 4).toString(36).padStart(4, '0');
    return `${prefixe}_${Date.now().toString(36)}${compteur.toString(36)}${alea}`;
}
// ---------------------------------------------------------------- cadences
/**
 * Cadences proposées : délais GIF entiers en centièmes de seconde (§9).
 * 24 et 30 i/s sont volontairement absentes (délais irréguliers).
 */
export const CADENCES = [
    { delaiCs: 10, ips: 10, libelle: '10 i/s' },
    { delaiCs: 8, ips: 12.5, libelle: '12,5 i/s' },
    { delaiCs: 6, ips: 100 / 6, libelle: '16,7 i/s' },
    { delaiCs: 5, ips: 20, libelle: '20 i/s' },
    { delaiCs: 4, ips: 25, libelle: '25 i/s' },
    { delaiCs: 3, ips: 100 / 3, libelle: '33 i/s' },
];
export const DELAI_MIN_CS = 2;
/** Police meme : Anton (OFL) si chargée, sinon repli système. */
export const PILE_POLICE_MEME = "'Anton', 'Arial Black', 'Helvetica Neue', Arial, sans-serif";
export const PILE_POLICE_TEXTE = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
export const STYLES = {
    CLASSIQUE: {
        tailleRel: 0.09,
        style: {
            police: PILE_POLICE_MEME,
            graisse: 400,
            couleur: BLANC,
            contour: { couleur: NOIR, epaisseurRel: 0.125 },
            ombre: null,
            alignement: 'centre',
            majuscules: true,
            interligne: 1.08,
        },
    },
    DISCRET: {
        tailleRel: 0.06,
        style: {
            police: PILE_POLICE_TEXTE,
            graisse: 600,
            couleur: BLANC,
            contour: null,
            ombre: { couleur: rgba(0, 0, 0, 0.75), flouRel: 0.18, decalageRel: 0.06 },
            alignement: 'centre',
            majuscules: false,
            interligne: 1.2,
        },
    },
    IMPACT: {
        tailleRel: 0.13,
        style: {
            police: PILE_POLICE_MEME,
            graisse: 400,
            couleur: rgba(255, 228, 0),
            contour: { couleur: NOIR, epaisseurRel: 0.16 },
            ombre: { couleur: rgba(0, 0, 0, 0.6), flouRel: 0, decalageRel: 0.07 },
            alignement: 'centre',
            majuscules: true,
            interligne: 1.0,
        },
    },
};
/** Taille minimale lisible : 4 % de la hauteur de scène (§6). */
export const TAILLE_TEXTE_MIN_REL = 0.04;
// ---------------------------------------------------------------- export
export const EXPORT_EXPRESS = {
    objectif: 'equilibre',
    tailleCibleOctets: 5 * 1024 * 1024,
    coteMax: 480,
    delaiCs: 8,
    couleurs: 256,
    palette: 'globale',
    tramage: 'ordonne',
    toleranceDiff: 6,
    boucles: 0,
};
export const EXPORT_QUALITE_SUP = {
    ...EXPORT_EXPRESS,
    objectif: 'qualite',
    tailleCibleOctets: 10 * 1024 * 1024,
    coteMax: 640,
    delaiCs: 5,
    palette: 'parImage',
    tramage: 'floydSteinberg',
    toleranceDiff: 3,
};
// ---------------------------------------------------------------- fabriques
const transformFixe = (t) => ({
    x: fixe(t.x),
    y: fixe(t.y),
    echelle: fixe(t.echelle),
    rotation: fixe(t.rotation),
    opacite: fixe(t.opacite),
});
export function creerProjet(largeur, hauteur, dureeMs = 3000) {
    return {
        version: VERSION_PROJET,
        id: nouvelId('prj'),
        nom: 'Sans titre',
        scene: { largeur, hauteur, dureeMs, fond: NOIR },
        medias: {},
        calques: [],
        lecture: { vitesse: 1, sens: 'avant', boucle: true },
        export: { ...EXPORT_EXPRESS },
    };
}
/** Crée un calque média couvrant toute la scène, recadré pour la remplir. */
export function creerCalqueMedia(projet, media) {
    const { largeur: L, hauteur: H, dureeMs } = projet.scene;
    const recadrage = recadrageCouvrant(media.largeur, media.hauteur, L / H);
    // Vidéo : les 3 premières secondes par défaut (ou toute la vidéo si plus courte).
    const dureeSource = media.type === 'video' ? media.dureeMs : dureeMs;
    return {
        id: nouvelId('cal'),
        nom: media.nom,
        type: 'media',
        visible: true,
        debutMs: 0,
        finMs: dureeMs,
        media: media.id,
        decoupe: { entreeMs: 0, sortieMs: Math.min(dureeSource, dureeMs) },
        recadrage,
        transform: transformFixe({ x: L / 2, y: H / 2, echelle: L / recadrage.l, rotation: 0, opacite: 1 }),
        filtres: [],
        animations: [],
        graine: graineDepuis(media.id),
    };
}
export function creerCalqueTexte(projet, contenu, nomStyle = 'CLASSIQUE', position = 'bas') {
    const { largeur: L, hauteur: H, dureeMs } = projet.scene;
    const { style, tailleRel } = STYLES[nomStyle];
    const taille = Math.round(H * tailleRel);
    const marge = H * 0.06;
    const y = position === 'haut' ? marge + taille : position === 'centre' ? H / 2 : H - marge - taille;
    const id = nouvelId('txt');
    return {
        id,
        nom: contenu.slice(0, 24) || 'Texte',
        type: 'texte',
        visible: true,
        debutMs: 0,
        finMs: dureeMs,
        contenu,
        style: structuredClone(style),
        taille,
        boite: { largeur: Math.round(L * 0.9), ajustementAuto: true, lignesMax: 2 },
        transform: transformFixe({ x: L / 2, y, echelle: 1, rotation: 0, opacite: 1 }),
        filtres: [],
        animations: [],
        graine: graineDepuis(id),
    };
}
/** Plus grand rectangle de rapport `ratio` centré dans la source. */
export function recadrageCouvrant(ls, hs, ratio) {
    if (ls / hs > ratio) {
        const l = Math.round(hs * ratio);
        return { x: Math.round((ls - l) / 2), y: 0, l, h: hs };
    }
    const h = Math.round(ls / ratio);
    return { x: 0, y: Math.round((hs - h) / 2), l: ls, h };
}
/** Dimensions de sortie : la scène réduite pour que son plus grand côté = coteMax. */
export function dimensionsSortie(projet) {
    const { largeur, hauteur } = projet.scene;
    const facteur = Math.min(1, projet.export.coteMax / Math.max(largeur, hauteur));
    // GIF : dimensions entières, au moins 1 px.
    return {
        largeur: Math.max(1, Math.round(largeur * facteur)),
        hauteur: Math.max(1, Math.round(hauteur * facteur)),
        facteur,
    };
}
function graineDepuis(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
/** migrations[n] transforme un projet de version n en version n+1. */
const MIGRATIONS = {};
export function serialiser(projet) {
    return JSON.stringify(projet);
}
export function deserialiser(json) {
    let p = JSON.parse(json);
    if (typeof p?.version !== 'number')
        throw new Error('PROJET_INVALIDE');
    if (p.version > VERSION_PROJET)
        throw new Error('PROJET_TROP_RECENT');
    while (p.version < VERSION_PROJET) {
        const m = MIGRATIONS[p.version];
        if (!m)
            throw new Error(`MIGRATION_MANQUANTE_${p.version}`);
        p = m(p);
    }
    return p;
}
// ---------------------------------------------------------------- mode Express
/** Premier calque média du projet (le « fond » en mode Express). */
export function calquePrincipal(p) {
    return p.calques.find((c) => c.type === 'media');
}
/**
 * Règle la durée du projet sur le passage choisi : durée du découpage ÷ vitesse
 * pour une vidéo. Tous les calques couvrent toute la durée (mode Express).
 */
export function synchroniserDuree(p, dureeImageMs) {
    const m = calquePrincipal(p);
    const media = m ? p.medias[m.media] : undefined;
    let duree = p.scene.dureeMs;
    if (m && media?.type === 'video')
        duree = (m.decoupe.sortieMs - m.decoupe.entreeMs) / p.lecture.vitesse;
    else if (dureeImageMs)
        duree = dureeImageMs;
    duree = Math.max(100, Math.round(duree));
    const ancienne = p.scene.dureeMs;
    p.scene.dureeMs = duree;
    for (const c of p.calques) {
        if (c.type !== 'media') {
            // Textes et éléments gardent leur place relative dans le GIF quand la durée change.
            const k = ancienne > 0 ? duree / ancienne : 1;
            const finPleine = c.finMs >= ancienne - 1;
            let debut = Math.round(c.debutMs * k);
            let fin = finPleine ? duree : Math.round(c.finMs * k);
            debut = Math.max(0, Math.min(duree - DUREE_TEXTE_MIN_MS, debut));
            fin = Math.max(debut + DUREE_TEXTE_MIN_MS, Math.min(duree, fin));
            c.debutMs = debut;
            c.finMs = fin;
            continue;
        }
        c.debutMs = 0;
        c.finMs = duree;
        if (c.type === 'media' && p.medias[c.media]?.type === 'image')
            c.decoupe = { entreeMs: 0, sortieMs: duree };
    }
}
/** Durée d'affichage minimale d'un texte (ms). */
export const DUREE_TEXTE_MIN_MS = 100;
/**
 * Règle l'intervalle d'affichage d'un texte, borné à la durée du GIF.
 * Les animations d'entrée et de sortie suivent l'intervalle.
 */
export function definirTempsTexte(p, t, debutMs, finMs) {
    const D = p.scene.dureeMs;
    const debut = Math.round(Math.max(0, Math.min(D - DUREE_TEXTE_MIN_MS, debutMs)));
    const fin = Math.round(Math.max(debut + DUREE_TEXTE_MIN_MS, Math.min(D, finMs)));
    t.debutMs = debut;
    t.finMs = fin;
}
/**
 * « Enchaîner » : crée un texte au même endroit et dans le même style, qui
 * prend la suite du texte donné. Si celui-ci occupe toute la durée, il est
 * coupé en deux.
 */
export function enchainerTexte(p, t) {
    const D = p.scene.dureeMs;
    if (t.finMs > D - 300) {
        const milieu = Math.round((Math.max(t.debutMs, 0) + D) / 2);
        t.finMs = Math.max(t.debutMs + DUREE_TEXTE_MIN_MS, milieu);
    }
    const suite = {
        ...structuredClone(t),
        id: nouvelId('txt'),
        contenu: '',
        nom: 'Texte',
        debutMs: t.finMs,
        finMs: D,
    };
    suite.graine = (t.graine * 31 + 7) >>> 0;
    const i = p.calques.indexOf(t);
    p.calques.splice(i + 1, 0, suite);
    return suite;
}
export const RATIOS = { '1:1': 1, '16:9': 16 / 9, '9:16': 9 / 16, '4:3': 4 / 3 };
/** Côté le plus long de la scène, en unités de scène. */
export const COTE_SCENE = 960;
/**
 * Change le format de la scène : recadrage centré dans la source, scène
 * redimensionnée, textes repositionnés proportionnellement.
 */
export function changerFormat(p, format) {
    const m = calquePrincipal(p);
    if (!m)
        return;
    const media = p.medias[m.media];
    const ratio = format === 'origine' ? media.largeur / media.hauteur : RATIOS[format];
    appliquerRecadrage(p, recadrageCouvrant(media.largeur, media.hauteur, ratio));
}
/**
 * Applique un recadrage libre (px de la source) : la scène prend ses
 * proportions (au plus COTE_SCENE), textes et éléments gardent leur place
 * relative.
 */
export function appliquerRecadrage(p, rIn) {
    const m = calquePrincipal(p);
    if (!m)
        return;
    const media = p.medias[m.media];
    // Bornes : au moins 16 px de source, entièrement dans l'image.
    const l = Math.round(Math.max(16, Math.min(media.largeur, rIn.l)));
    const h = Math.round(Math.max(16, Math.min(media.hauteur, rIn.h)));
    const r = {
        x: Math.round(Math.max(0, Math.min(media.largeur - l, rIn.x))),
        y: Math.round(Math.max(0, Math.min(media.hauteur - h, rIn.y))),
        l, h,
    };
    const ancienL = p.scene.largeur, ancienH = p.scene.hauteur;
    const k = Math.min(1, COTE_SCENE / Math.max(r.l, r.h));
    const L = Math.max(16, Math.round(r.l * k)), H = Math.max(16, Math.round(r.h * k));
    p.scene.largeur = L;
    p.scene.hauteur = H;
    m.recadrage = r;
    m.transform = { ...m.transform, x: fixe(L / 2), y: fixe(H / 2), echelle: fixe(L / r.l) };
    for (const c of p.calques) {
        if (c.type === 'media')
            continue;
        const x = 'valeur' in c.transform.x ? c.transform.x.valeur : ancienL / 2;
        const y = 'valeur' in c.transform.y ? c.transform.y.valeur : ancienH / 2;
        c.transform.x = fixe((x / ancienL) * L);
        c.transform.y = fixe((y / ancienH) * H);
        if (c.type === 'texte') {
            c.taille = Math.round((c.taille / ancienH) * H);
            c.boite.largeur = Math.round(L * 0.9);
        }
        else {
            // Les éléments gardent leur taille relative au plus petit côté.
            const kk = Math.min(L, H) / Math.min(ancienL, ancienH);
            c.largeur = Math.round(c.largeur * kk);
            c.hauteur = Math.round(c.hauteur * kk);
        }
    }
}
/** Déplace le recadrage (px de la source), borné à l'image. */
export function deplacerRecadrage(p, x, y) {
    const m = calquePrincipal(p);
    if (!m)
        return;
    const media = p.medias[m.media];
    m.recadrage.x = Math.round(Math.min(media.largeur - m.recadrage.l, Math.max(0, x)));
    m.recadrage.y = Math.round(Math.min(media.hauteur - m.recadrage.h, Math.max(0, y)));
}
// ---------------------------------------------------------------- éléments
/** Symboles dessinés (identifiants stables : enregistrés dans les projets). */
export const SYMBOLES = ['fleche', 'cercle', 'rectangle', 'bulle', 'coeur', 'etoile', 'eclair', 'coche', 'croix', 'souligne'];
/** Emojis proposés d'emblée ; n'importe quel emoji peut aussi être saisi. */
export const EMOJIS = [
    '😂', '🤣', '😅', '😭', '😍', '🥹', '😎', '🤔', '😱', '😡', '🙄', '😴',
    '🤯', '🥳', '😬', '🫠', '💀', '👀', '👍', '👎', '👏', '🙏', '💪', '🤦',
    '🔥', '💯', '✨', '🎉', '❤️', '💔', '⭐', '⚡', '💥', '💩', '🚀', '☕',
    '✅', '❌', '⚠️', '❓', '❗', '➡️', '⬆️', '🔴', '🟢', '📌', '🎯', '🏆',
];
export function creerElement(p, genre, contenu = '') {
    const { largeur: L, hauteur: H, dureeMs } = p.scene;
    const cote = Math.round(Math.min(L, H) * (genre === 'flou' || genre === 'pixel' ? 0.35 : 0.22));
    const id = nouvelId('elt');
    return {
        id,
        nom: genre,
        type: 'element',
        visible: true,
        debutMs: 0,
        finMs: dureeMs,
        genre,
        contenu: contenu || (genre === 'emoji' ? '😂' : genre === 'symbole' ? 'fleche' : ''),
        largeur: genre === 'flou' || genre === 'pixel' ? Math.round(cote * 1.4) : cote,
        hauteur: cote,
        couleur: genre === 'symbole' ? rgba(255, 59, 48) : BLANC,
        intensite: genre === 'pixel' ? 0.5 : genre === 'flou' ? 0.6 : 0.5,
        ellipse: false,
        transform: transformFixe({ x: L / 2, y: H / 2, echelle: 1, rotation: 0, opacite: 1 }),
        filtres: [],
        animations: [],
        graine: graineDepuis(id),
    };
}
/**
 * Change l'ordre d'empilement d'un texte ou d'un élément : `rang` parmi les
 * calques posés sur l'image (0 = tout au fond, juste au-dessus de la vidéo).
 * Le média reste toujours dessous.
 */
export function deplacerCalque(p, id, rang) {
    const medias = p.calques.filter((c) => c.type === 'media');
    const autres = p.calques.filter((c) => c.type !== 'media');
    const i = autres.findIndex((c) => c.id === id);
    if (i < 0)
        return;
    const [c] = autres.splice(i, 1);
    autres.splice(Math.max(0, Math.min(autres.length, Math.round(rang))), 0, c);
    p.calques = [...medias, ...autres];
}
//# sourceMappingURL=projet.js.map