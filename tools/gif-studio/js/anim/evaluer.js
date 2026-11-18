// ---------------------------------------------------------------- courbes
/** Résout une Bézier cubique CSS (P0=(0,0), P3=(1,1)) : renvoie y pour x. */
export function bezier(x1, y1, x2, y2, x) {
    if (x <= 0)
        return 0;
    if (x >= 1)
        return 1;
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const fx = (t) => ((ax * t + bx) * t + cx) * t;
    const dfx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    // Newton, puis dichotomie si la dérivée est trop faible.
    let t = x;
    for (let i = 0; i < 8; i++) {
        const err = fx(t) - x;
        if (Math.abs(err) < 1e-6)
            break;
        const d = dfx(t);
        if (Math.abs(d) < 1e-6)
            break;
        t -= err / d;
    }
    if (Math.abs(fx(t) - x) > 1e-5) {
        let lo = 0, hi = 1;
        t = x;
        for (let i = 0; i < 40; i++) {
            const v = fx(t);
            if (Math.abs(v - x) < 1e-6)
                break;
            if (v < x)
                lo = t;
            else
                hi = t;
            t = (lo + hi) / 2;
        }
    }
    return ((ay * t + by) * t + cy) * t;
}
export function appliquerCourbe(c, u) {
    if (typeof c === 'object')
        return bezier(c.bezier[0], c.bezier[1], c.bezier[2], c.bezier[3], u);
    switch (c) {
        case 'lineaire': return u;
        case 'palier': return u < 1 ? 0 : 1;
        case 'entree': return bezier(0.42, 0, 1, 1, u);
        case 'sortie': return bezier(0, 0, 0.58, 1, u);
        case 'entreeSortie': return bezier(0.42, 0, 0.58, 1, u);
    }
}
// ---------------------------------------------------------------- pistes
const estPiste = (a) => 'cles' in a;
/**
 * Valeur d'une propriété animable à tMs (temps local du calque).
 * Les nombres sont interpolés ; les autres types changent par palier.
 * La courbe d'une clé régit le segment qui la suit.
 */
export function evaluer(a, tMs) {
    if (!estPiste(a))
        return a.valeur;
    const cles = a.cles;
    if (cles.length === 0)
        throw new Error('PISTE_VIDE');
    if (tMs <= cles[0].tMs)
        return cles[0].valeur;
    const derniere = cles[cles.length - 1];
    if (tMs >= derniere.tMs)
        return derniere.valeur;
    // Recherche dichotomique du segment.
    let lo = 0, hi = cles.length - 1;
    while (hi - lo > 1) {
        const m = (lo + hi) >> 1;
        if (cles[m].tMs <= tMs)
            lo = m;
        else
            hi = m;
    }
    const k0 = cles[lo], k1 = cles[hi];
    const u = appliquerCourbe(k0.courbe, (tMs - k0.tMs) / (k1.tMs - k0.tMs));
    if (typeof k0.valeur === 'number' && typeof k1.valeur === 'number') {
        return (k0.valeur + (k1.valeur - k0.valeur) * u);
    }
    return u < 1 ? k0.valeur : k1.valeur;
}
// ---------------------------------------------------------------- hasard déterministe
/** Bruit uniforme [0,1) déterministe à partir d'une graine et d'un entier. */
export function hasard(graine, n) {
    let h = (graine ^ Math.imul(n | 0, 0x9e3779b1)) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}
const neutre = () => ({ dx: 0, dy: 0, echelle: 1, rotation: 0, opacite: 1, revele: 1 });
const borne = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
function appliquerPreset(m, p, tLocal, dureeCalque, graine, tailleScene) {
    const debut = p.type === 'disparition' ? dureeCalque - p.dureeMs - p.debutMs : p.debutMs;
    const u = p.dureeMs > 0 ? (tLocal - debut) / p.dureeMs : 1;
    const k = p.intensite;
    switch (p.type) {
        case 'apparition':
            m.opacite *= appliquerCourbe('sortie', borne(u));
            break;
        case 'disparition':
            m.opacite *= 1 - appliquerCourbe('entree', borne(u));
            break;
        case 'zoomEntree': {
            const v = appliquerCourbe('sortie', borne(u));
            m.echelle *= 1 + (1 - v) * (0.2 + 1.8 * k) * (u < 1 ? 1 : 0);
            m.opacite *= borne(u * 3);
            break;
        }
        case 'rebond': {
            // Ressort amorti qui se pose sur l'échelle 1.
            if (u <= 0) {
                m.echelle *= 0;
                break;
            }
            if (u >= 1)
                break;
            const amort = Math.exp(-6 * u) * Math.cos(u * Math.PI * 4.5);
            m.echelle *= 1 - amort * (0.4 + 0.6 * k);
            break;
        }
        case 'secousse': {
            if (u < 0 || u > 1)
                break;
            const pas = Math.floor(tLocal / 40); // nouvelle position toutes les 40 ms
            const amp = tailleScene * (0.008 + 0.04 * k) * (1 - u * 0.5);
            m.dx += (hasard(graine, pas * 2) * 2 - 1) * amp;
            m.dy += (hasard(graine, pas * 2 + 1) * 2 - 1) * amp;
            break;
        }
        case 'pulsation': {
            if (u < 0)
                break;
            const periode = Math.max(1, p.dureeMs);
            m.echelle *= 1 + 0.05 * (1 + 3 * k) * (0.5 - 0.5 * Math.cos(((tLocal - debut) / periode) * 2 * Math.PI));
            break;
        }
        case 'clignotement': {
            if (u < 0)
                break;
            const periode = Math.max(1, p.dureeMs);
            const phase = ((tLocal - debut) % periode) / periode;
            if (phase >= 0.5)
                m.opacite *= 1 - k;
            break;
        }
        case 'machineAEcrire':
            m.revele = Math.min(m.revele, borne(u));
            break;
    }
}
/**
 * Évalue un calque à l'instant projet tProjet.
 * `tailleScene` (plus petit côté de la scène) dimensionne les effets
 * exprimés en distance, comme la secousse.
 */
export function evaluerCalque(c, tProjet, tailleScene = 480) {
    const tLocal = tProjet - c.debutMs;
    const duree = c.finMs - c.debutMs;
    const visible = c.visible && tProjet >= c.debutMs && tProjet < c.finMs;
    const base = {
        x: evaluer(c.transform.x, tLocal),
        y: evaluer(c.transform.y, tLocal),
        echelle: evaluer(c.transform.echelle, tLocal),
        rotation: evaluer(c.transform.rotation, tLocal),
        opacite: evaluer(c.transform.opacite, tLocal),
    };
    const m = neutre();
    for (const p of c.animations)
        appliquerPreset(m, p, tLocal, duree, c.graine, tailleScene);
    return {
        visible,
        tLocal,
        transform: {
            x: base.x + m.dx,
            y: base.y + m.dy,
            echelle: base.echelle * m.echelle,
            rotation: base.rotation + m.rotation,
            opacite: borne(base.opacite * m.opacite),
        },
        filtres: c.filtres.filter((f) => f.actif).map((f) => ({ type: f.type, valeur: evaluer(f.valeur, tLocal) })),
        revele: m.revele,
    };
}
//# sourceMappingURL=evaluer.js.map