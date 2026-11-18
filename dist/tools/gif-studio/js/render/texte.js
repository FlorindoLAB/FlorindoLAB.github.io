/** Coupe le texte en lignes tenant dans `largeurMax` à la taille donnée. */
export function couperLignes(texte, taille, largeurMax, mesurer) {
    const lignes = [];
    for (const paragraphe of texte.split('\n')) {
        const mots = paragraphe.split(/\s+/).filter(Boolean);
        if (mots.length === 0) {
            lignes.push('');
            continue;
        }
        let courante = '';
        for (const mot of mots) {
            const essai = courante ? `${courante} ${mot}` : mot;
            if (mesurer(essai, taille) <= largeurMax) {
                courante = essai;
                continue;
            }
            if (courante)
                lignes.push(courante);
            // Mot plus large que la boîte : coupe par caractères.
            if (mesurer(mot, taille) > largeurMax) {
                let morceau = '';
                for (const ch of Array.from(mot)) {
                    if (morceau && mesurer(morceau + ch, taille) > largeurMax) {
                        lignes.push(morceau);
                        morceau = '';
                    }
                    morceau += ch;
                }
                courante = morceau;
            }
            else
                courante = mot;
        }
        lignes.push(courante);
    }
    return lignes;
}
/**
 * Met en page : taille demandée, puis réduction par dichotomie jusqu'à tenir
 * dans `lignesMax` lignes sans coupure de mot, sans descendre sous `tailleMin`.
 */
export function mettreEnPage(texte, tailleDemandee, largeurBoite, lignesMax, ajustementAuto, tailleMin, mesurer) {
    const nbMots = (s) => s.split(/\s+/).filter(Boolean).length;
    const motsSource = texte.split('\n').reduce((n, p) => n + nbMots(p), 0);
    const tient = (t) => {
        const l = couperLignes(texte, t, largeurBoite, mesurer);
        // Aucun mot coupé en deux et pas plus de lignes que permis.
        const mots = l.reduce((n, x) => n + nbMots(x), 0);
        return { ok: l.length <= Math.max(lignesMax, texte.split('\n').length) && mots === motsSource, l };
    };
    let taille = tailleDemandee;
    let res = tient(taille);
    if (ajustementAuto && !res.ok && tailleDemandee > tailleMin) {
        let lo = tailleMin, hi = tailleDemandee;
        if (tient(lo).ok) {
            while (hi - lo > 0.5) {
                const m = (lo + hi) / 2;
                if (tient(m).ok)
                    lo = m;
                else
                    hi = m;
            }
        }
        taille = Math.floor(lo * 2) / 2;
        res = tient(taille);
    }
    return { taille, lignes: res.l, largeurs: res.l.map((x) => mesurer(x, taille)) };
}
// ---------------------------------------------------------------- polices
export const POLICE_REPLI_MEME = { famille: "'Inter', 'Arial Black', 'Helvetica Neue', Arial, sans-serif", graisse: 900 };
/** Police CSS effective : si Anton (OFL) n'est pas chargée, repli Inter Black. */
export function policeCss(style, taillePx, antonDisponible) {
    const anton = /'?Anton'?/.test(style.police);
    if (anton && !antonDisponible)
        return `${POLICE_REPLI_MEME.graisse} ${taillePx}px ${POLICE_REPLI_MEME.famille}`;
    return `${style.graisse} ${taillePx}px ${style.police}`;
}
export function nouvelleToile(l, h) {
    if (typeof OffscreenCanvas !== 'undefined')
        return new OffscreenCanvas(l, h);
    const c = document.createElement('canvas');
    c.width = l;
    c.height = h;
    return c;
}
const css = (c) => `rgba(${c.r},${c.g},${c.b},${c.a})`;
let antonCache = null;
/** Incrémenté quand une police finit de charger : les textes sont alors redessinés. */
let generationPolices = 0;
export function signalerPolicesChargees() { generationPolices++; antonCache = null; }
export function antonDisponible() {
    if (antonCache === true)
        return true;
    try {
        const fonts = globalThis.document?.fonts ?? globalThis.fonts;
        antonCache = !!fonts && [...fonts].some((f) => /Anton/.test(f.family) && f.status === 'loaded');
    }
    catch {
        antonCache = false;
    }
    return antonCache;
}
/** Clé de cache du texte rastérisé : identique ⇒ même bitmap. */
export function cleTexte(c, facteur, revele) {
    const anton = antonDisponible();
    const contenu = c.style.majuscules ? c.contenu.toLocaleUpperCase('fr') : c.contenu;
    const nbVisibles = Math.round(Array.from(contenu.replace(/\s/g, '')).length * Math.min(1, Math.max(0, revele)));
    return [contenu, JSON.stringify(c.style), c.taille, c.boite.largeur, c.boite.lignesMax, c.boite.ajustementAuto, facteur, nbVisibles, anton, generationPolices].join('|');
}
/**
 * Rastérise un calque texte à l'échelle de sortie `facteur`.
 * `revele` (0–1) limite le nombre de caractères visibles (machine à écrire).
 */
export function rasteriserTexte(c, facteur, revele, tailleMinScene) {
    const anton = antonDisponible();
    const s = c.style;
    const contenu = s.majuscules ? c.contenu.toLocaleUpperCase('fr') : c.contenu;
    const mesureur = nouvelleToile(1, 1).getContext('2d');
    const mesurer = (t, taille) => { mesureur.font = policeCss(s, taille, anton); return mesureur.measureText(t).width; };
    const largeurBoite = c.boite.largeur * facteur;
    const mep = mettreEnPage(contenu, c.taille * facteur, largeurBoite, c.boite.lignesMax, c.boite.ajustementAuto, tailleMinScene * facteur, mesurer);
    const T = mep.taille;
    const pasLigne = T * s.interligne;
    const contour = s.contour ? Math.max(1, s.contour.epaisseurRel * T) : 0;
    const ombre = s.ombre ? { flou: s.ombre.flouRel * T, dec: s.ombre.decalageRel * T } : null;
    const fond = s.fond ? { padX: 0.32 * T, padY: 0.14 * T, rayon: s.fond.rayonRel * T } : null;
    const marge = Math.ceil(Math.max(contour + (ombre ? ombre.flou * 2 + ombre.dec : 0), fond ? fond.padX : 0) + 2);
    const largeurTexte = Math.max(1, ...mep.largeurs);
    const L = Math.ceil(Math.max(largeurTexte, 1) + marge * 2);
    const H = Math.ceil(pasLigne * mep.lignes.length + marge * 2);
    const nbVisibles = Math.round(Array.from(contenu.replace(/\s/g, '')).length * Math.min(1, Math.max(0, revele)));
    const cle = cleTexte(c, facteur, revele);
    const toile = nouvelleToile(L, H);
    const ctx = toile.getContext('2d');
    ctx.font = policeCss(s, T, anton);
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    // Découpe des caractères visibles ligne par ligne (les espaces ne comptent pas).
    let restants = nbVisibles;
    const visibles = mep.lignes.map((ligne) => {
        let out = '';
        for (const ch of Array.from(ligne)) {
            if (/\s/.test(ch)) {
                out += ch;
                continue;
            }
            if (restants <= 0)
                break;
            out += ch;
            restants--;
        }
        return out;
    });
    const xLigne = (i) => {
        const w = mep.largeurs[i];
        if (s.alignement === 'gauche')
            return marge;
        if (s.alignement === 'droite')
            return marge + largeurTexte - w;
        return marge + (largeurTexte - w) / 2;
    };
    const yLigne = (i) => marge + pasLigne * (i + 0.5);
    const dessiner = (passe, dx = 0) => {
        visibles.forEach((txt, i) => {
            if (!txt)
                return;
            const x = xLigne(i) + dx, y = yLigne(i);
            if (passe === 'contour')
                ctx.strokeText(txt, x, y);
            else
                ctx.fillText(txt, x, y);
        });
    };
    // Bandeau derrière le texte : une forme arrondie qui épouse le bloc de lignes.
    if (fond && s.fond) {
        // Dessiné opaque à part puis posé avec la transparence voulue : les lignes
        // qui se chevauchent ne font pas de bande plus sombre.
        const calque = nouvelleToile(L, H);
        const c2 = calque.getContext('2d');
        const coul = s.fond.couleur;
        c2.fillStyle = `rgb(${coul.r},${coul.g},${coul.b})`;
        visibles.forEach((txt, i) => {
            if (!txt.trim())
                return;
            const w = mep.largeurs[i];
            const x = xLigne(i) - fond.padX, y = yLigne(i) - pasLigne / 2 - fond.padY / 2;
            const l = w + fond.padX * 2, h = pasLigne + fond.padY;
            c2.beginPath();
            const g = c2;
            if (typeof g.roundRect === 'function')
                g.roundRect(x, y, l, h, Math.min(fond.rayon, h / 2));
            else
                g.rect(x, y, l, h);
            c2.fill();
        });
        ctx.save();
        ctx.globalAlpha = coul.a;
        ctx.drawImage(calque, 0, 0);
        ctx.restore();
    }
    if (ombre && s.ombre) {
        // Le glyphe est dessiné hors toile ; seule son ombre, décalée d'autant, y tombe.
        const HORS = L + 10000;
        ctx.save();
        ctx.shadowColor = css(s.ombre.couleur);
        ctx.shadowBlur = ombre.flou;
        ctx.shadowOffsetX = ombre.dec + HORS;
        ctx.shadowOffsetY = ombre.dec;
        ctx.fillStyle = '#000';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = contour * 2;
        if (contour)
            dessiner('contour', -HORS);
        dessiner('ombre', -HORS);
        ctx.restore();
    }
    if (s.contour && contour) {
        ctx.strokeStyle = css(s.contour.couleur);
        ctx.lineWidth = contour * 2; // le trait déborde de moitié de chaque côté
        dessiner('contour');
    }
    ctx.fillStyle = css(s.couleur);
    dessiner('remplissage');
    return { toile, largeur: L, hauteur: H, cle };
}
//# sourceMappingURL=texte.js.map