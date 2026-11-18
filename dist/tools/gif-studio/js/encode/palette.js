/**
 * Quantification des couleurs — code maison, sans dépendance.
 *
 * 1. Histogramme 5 bits par canal (32 768 cases), pixels transparents ignorés.
 * 2. Median cut pondéré par la perception (le vert compte plus que le bleu).
 * 3. Deux passes de k-moyennes sur l'histogramme pour affiner les centres.
 * 4. Recherche de la couleur la plus proche avec cache 6 bits par canal.
 */
// Poids perceptifs approximatifs (somme ≈ 1), appliqués aux distances au carré.
const PR = 0.30, PG = 0.59, PB = 0.11;
// Poids utilisés pour couper les boîtes : un peu plus équilibrés, pour ne
// pas sacrifier les bleus des ciels et des écrans.
const CR = 1.0, CG = 1.2, CB = 0.8;
function histogramme(images, pasEchantillon) {
    const h = new Float64Array(32768);
    for (const img of images) {
        const pas = 4 * pasEchantillon;
        for (let i = 0; i < img.length; i += pas) {
            if (img[i + 3] < 128)
                continue;
            h[((img[i] >> 3) << 10) | ((img[i + 1] >> 3) << 5) | (img[i + 2] >> 3)] += 1;
        }
    }
    return h;
}
const cR = (c) => ((c >> 10) << 3) | 4;
const cG = (c) => (((c >> 5) & 31) << 3) | 4;
const cB = (c) => ((c & 31) << 3) | 4;
function etendue(b) {
    let r0 = 255, r1 = 0, g0 = 255, g1 = 0, b0 = 255, b1 = 0;
    for (const c of b.cases) {
        const r = cR(c), g = cG(c), bl = cB(c);
        if (r < r0)
            r0 = r;
        if (r > r1)
            r1 = r;
        if (g < g0)
            g0 = g;
        if (g > g1)
            g1 = g;
        if (bl < b0)
            b0 = bl;
        if (bl > b1)
            b1 = bl;
    }
    const er = (r1 - r0) * CR, eg = (g1 - g0) * CG, eb = (b1 - b0) * CB;
    if (er >= eg && er >= eb)
        return { canal: 0, ecart: er };
    if (eg >= eb)
        return { canal: 1, ecart: eg };
    return { canal: 2, ecart: eb };
}
/**
 * Construit une palette d'au plus `max` couleurs à partir d'images RGBA.
 * `pasEchantillon` : 1 = tous les pixels, 4 = un pixel sur quatre, etc.
 */
export function construirePalette(images, max, pasEchantillon = 1) {
    max = Math.max(2, Math.min(256, Math.floor(max)));
    const h = histogramme(images, pasEchantillon);
    const occupees = [];
    for (let c = 0; c < 32768; c++)
        if (h[c] > 0)
            occupees.push(c);
    if (occupees.length === 0)
        return { rvb: new Uint8Array(6), taille: 2 };
    // Peu de couleurs distinctes : on les garde telles quelles.
    if (occupees.length <= max) {
        return paletteDepuisCentres(occupees.map((c) => [cR(c), cG(c), cB(c)]));
    }
    // --- median cut
    const boites = [{ cases: occupees, poids: occupees.reduce((s, c) => s + h[c], 0) }];
    const getters = [cR, cG, cB];
    while (boites.length < max) {
        // Boîte à couper : plus grand produit poids × étendue (évite d'émietter le bruit).
        let meilleure = -1, score = 0, canalChoisi = 0;
        for (let i = 0; i < boites.length; i++) {
            const b = boites[i];
            if (b.cases.length < 2)
                continue;
            const e = etendue(b);
            const s = Math.sqrt(b.poids) * e.ecart;
            if (s > score) {
                score = s;
                meilleure = i;
                canalChoisi = e.canal;
            }
        }
        if (meilleure < 0)
            break;
        const b = boites[meilleure];
        const get = getters[canalChoisi];
        b.cases.sort((x, y) => get(x) - get(y));
        // Coupe à la médiane pondérée.
        let cumul = 0, coupe = 1;
        const moitie = b.poids / 2;
        for (let i = 0; i < b.cases.length - 1; i++) {
            cumul += h[b.cases[i]];
            if (cumul >= moitie) {
                coupe = i + 1;
                break;
            }
            coupe = i + 1;
        }
        const a1 = b.cases.slice(0, coupe), a2 = b.cases.slice(coupe);
        const p1 = a1.reduce((s, c) => s + h[c], 0);
        boites.splice(meilleure, 1, { cases: a1, poids: p1 }, { cases: a2, poids: b.poids - p1 });
    }
    // Centres pondérés.
    let centres = boites.map((b) => {
        let r = 0, g = 0, bl = 0;
        for (const c of b.cases) {
            const w = h[c];
            r += cR(c) * w;
            g += cG(c) * w;
            bl += cB(c) * w;
        }
        return [r / b.poids, g / b.poids, bl / b.poids];
    });
    // --- k-moyennes sur l'histogramme (2 passes)
    for (let passe = 0; passe < 2; passe++) {
        const somme = centres.map(() => [0, 0, 0, 0]);
        for (const c of occupees) {
            const r = cR(c), g = cG(c), bl = cB(c);
            let best = 0, dBest = Infinity;
            for (let k = 0; k < centres.length; k++) {
                const q = centres[k];
                const d = PR * (r - q[0]) ** 2 + PG * (g - q[1]) ** 2 + PB * (bl - q[2]) ** 2;
                if (d < dBest) {
                    dBest = d;
                    best = k;
                }
            }
            const w = h[c], s = somme[best];
            s[0] += r * w;
            s[1] += g * w;
            s[2] += bl * w;
            s[3] += w;
        }
        centres = centres.map((q, k) => (somme[k][3] > 0 ? [somme[k][0] / somme[k][3], somme[k][1] / somme[k][3], somme[k][2] / somme[k][3]] : q));
    }
    // Préserver le noir et le blanc purs s'ils sont présents (contours de texte).
    const versExtreme = (cible) => {
        const caseCible = cible === 0 ? 0 : 32767;
        if (h[caseCible] === 0)
            return;
        let best = 0, dBest = Infinity;
        for (let k = 0; k < centres.length; k++) {
            const q = centres[k];
            const d = (q[0] - cible) ** 2 + (q[1] - cible) ** 2 + (q[2] - cible) ** 2;
            if (d < dBest) {
                dBest = d;
                best = k;
            }
        }
        if (dBest < 40 * 40)
            centres[best] = [cible, cible, cible];
    };
    versExtreme(0);
    versExtreme(255);
    return paletteDepuisCentres(centres);
}
function paletteDepuisCentres(centres) {
    const taille = Math.max(2, centres.length);
    const rvb = new Uint8Array(taille * 3);
    centres.forEach((q, k) => {
        rvb[k * 3] = Math.round(q[0]);
        rvb[k * 3 + 1] = Math.round(q[1]);
        rvb[k * 3 + 2] = Math.round(q[2]);
    });
    return { rvb, taille };
}
/** Recherche de la couleur la plus proche, avec cache 6 bits par canal. */
export class Correspondance {
    palette;
    cache = new Int16Array(1 << 18).fill(-1);
    constructor(palette) {
        this.palette = palette;
    }
    indice(r, g, b) {
        const cle = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2);
        const c = this.cache[cle];
        if (c >= 0)
            return c;
        const { rvb, taille } = this.palette;
        // Centre de la case du cache, pour un résultat stable quel que soit l'ordre d'appel.
        const rr = (r & ~3) | 2, gg = (g & ~3) | 2, bb = (b & ~3) | 2;
        let best = 0, dBest = Infinity;
        for (let k = 0; k < taille; k++) {
            const dr = rr - rvb[k * 3], dg = gg - rvb[k * 3 + 1], db = bb - rvb[k * 3 + 2];
            const d = PR * dr * dr + PG * dg * dg + PB * db * db;
            if (d < dBest) {
                dBest = d;
                best = k;
                if (d === 0)
                    break;
            }
        }
        this.cache[cle] = best;
        return best;
    }
}
//# sourceMappingURL=palette.js.map