const BAYER8 = (() => {
    const m = new Float32Array(64);
    // Construction récursive classique de la matrice de Bayer.
    const b = (x, y, n) => {
        if (n === 1)
            return 0;
        const h = n / 2;
        const q = (x >= h ? 1 : 0) + (y >= h ? 2 : 0);
        const ordre = [0, 2, 3, 1][q];
        return 4 * b(x % h, y % h, h) + ordre;
    };
    for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++)
            m[y * 8 + x] = (b(x, y, 8) + 0.5) / 64 - 0.5;
    return m;
})();
/** Amplitude du tramage ordonné en fonction de la taille de palette. */
export function amplitudeTramage(nbCouleurs) {
    return Math.min(48, 255 / Math.cbrt(nbCouleurs) * 0.55);
}
const c8 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);
/**
 * Renvoie l'indice de palette de chaque pixel.
 * Les pixels d'alpha < 128 reçoivent `indiceTransparent` (si fourni).
 */
export function indexer(rgba, largeur, hauteur, corr, mode, indiceTransparent = -1) {
    const n = largeur * hauteur;
    const sortie = new Uint8Array(n);
    const transp = indiceTransparent >= 0 ? indiceTransparent : 0;
    if (mode === 'aucun' || mode === 'ordonne') {
        const amp = mode === 'ordonne' ? amplitudeTramage(corr.palette.taille) : 0;
        for (let y = 0, p = 0; y < hauteur; y++) {
            const ligneB = (y & 7) * 8;
            for (let x = 0; x < largeur; x++, p++) {
                const i = p * 4;
                if (rgba[i + 3] < 128) {
                    sortie[p] = transp;
                    continue;
                }
                const d = amp * BAYER8[ligneB + (x & 7)];
                sortie[p] = corr.indice(c8(rgba[i] + d), c8(rgba[i + 1] + d), c8(rgba[i + 2] + d));
            }
        }
        return sortie;
    }
    // Floyd-Steinberg en serpentin, erreur atténuée à 85 % pour limiter le grouillement.
    const pal = corr.palette.rvb;
    const att = 0.85;
    let errCour = new Float32Array((largeur + 2) * 3);
    let errSuiv = new Float32Array((largeur + 2) * 3);
    for (let y = 0; y < hauteur; y++) {
        const versDroite = (y & 1) === 0;
        for (let k = 0; k < largeur; k++) {
            const x = versDroite ? k : largeur - 1 - k;
            const p = y * largeur + x;
            const i = p * 4;
            const e = (x + 1) * 3;
            if (rgba[i + 3] < 128) {
                sortie[p] = transp;
                continue;
            }
            const r = c8(rgba[i] + errCour[e]), g = c8(rgba[i + 1] + errCour[e + 1]), b = c8(rgba[i + 2] + errCour[e + 2]);
            const idx = corr.indice(r, g, b);
            sortie[p] = idx;
            const er = (r - pal[idx * 3]) * att, eg = (g - pal[idx * 3 + 1]) * att, eb = (b - pal[idx * 3 + 2]) * att;
            const s = versDroite ? 3 : -3;
            // 7/16 devant, 3/16 derrière en bas, 5/16 en bas, 1/16 devant en bas.
            errCour[e + s] += er * 7 / 16;
            errCour[e + s + 1] += eg * 7 / 16;
            errCour[e + s + 2] += eb * 7 / 16;
            errSuiv[e - s] += er * 3 / 16;
            errSuiv[e - s + 1] += eg * 3 / 16;
            errSuiv[e - s + 2] += eb * 3 / 16;
            errSuiv[e] += er * 5 / 16;
            errSuiv[e + 1] += eg * 5 / 16;
            errSuiv[e + 2] += eb * 5 / 16;
            errSuiv[e + s] += er / 16;
            errSuiv[e + s + 1] += eg / 16;
            errSuiv[e + s + 2] += eb / 16;
        }
        [errCour, errSuiv] = [errSuiv, errCour];
        errSuiv.fill(0);
    }
    return sortie;
}
//# sourceMappingURL=tramage.js.map