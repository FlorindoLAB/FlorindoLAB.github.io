export const DEFINITIONS = {
    luminosite: { libelle: 'Luminosité', min: -1, max: 1, neutre: 0, pas: 0.01 },
    contraste: { libelle: 'Contraste', min: -1, max: 1, neutre: 0, pas: 0.01 },
    saturation: { libelle: 'Saturation', min: -1, max: 1, neutre: 0, pas: 0.01 },
    teinte: { libelle: 'Teinte', min: -180, max: 180, neutre: 0, pas: 1 },
    noirBlanc: { libelle: 'Noir et blanc', min: 0, max: 1, neutre: 0, pas: 0.01 },
    sepia: { libelle: 'Sépia', min: 0, max: 1, neutre: 0, pas: 0.01 },
};
export const identite = () => new Float32Array([1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]);
// Luminance Rec. 709.
const LR = 0.2126, LG = 0.7152, LB = 0.0722;
function matrice3(m, decalage = [0, 0, 0]) {
    return new Float32Array([
        m[0], m[1], m[2], 0, decalage[0],
        m[3], m[4], m[5], 0, decalage[1],
        m[6], m[7], m[8], 0, decalage[2],
        0, 0, 0, 1, 0,
    ]);
}
const melange = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const ID3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
export function matriceFiltre(type, v) {
    switch (type) {
        case 'luminosite':
            return matrice3(ID3, [v * 0.5, v * 0.5, v * 0.5]);
        case 'contraste': {
            // v ∈ [-1,1] → pente ∈ [0, 3], pivot à 0,5.
            const c = v >= 0 ? 1 + 2 * v : 1 + v;
            const o = 0.5 * (1 - c);
            return matrice3([c, 0, 0, 0, c, 0, 0, 0, c], [o, o, o]);
        }
        case 'saturation': {
            const s = 1 + v;
            const r = (1 - s) * LR, g = (1 - s) * LG, b = (1 - s) * LB;
            return matrice3([r + s, g, b, r, g + s, b, r, g, b + s]);
        }
        case 'teinte': {
            // Rotation de teinte autour de l'axe des gris (formule SVG feColorMatrix).
            const a = (v * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
            return matrice3([
                LR + c * (1 - LR) + s * -LR, LG + c * -LG + s * -LG, LB + c * -LB + s * (1 - LB),
                LR + c * -LR + s * 0.143, LG + c * (1 - LG) + s * 0.14, LB + c * -LB + s * -0.283,
                LR + c * -LR + s * -(1 - LR), LG + c * -LG + s * LG, LB + c * (1 - LB) + s * LB,
            ]);
        }
        case 'noirBlanc':
            return matrice3(melange(ID3, [LR, LG, LB, LR, LG, LB, LR, LG, LB], v));
        case 'sepia':
            return matrice3(melange(ID3, [0.393, 0.769, 0.189, 0.349, 0.686, 0.168, 0.272, 0.534, 0.131], v));
    }
}
/** Produit a·b : appliquer b puis a. */
export function multiplier(a, b) {
    const r = new Float32Array(20);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            let s = 0;
            for (let k = 0; k < 4; k++)
                s += a[i * 5 + k] * b[k * 5 + j];
            r[i * 5 + j] = s;
        }
        let o = a[i * 5 + 4];
        for (let k = 0; k < 4; k++)
            o += a[i * 5 + k] * b[k * 5 + 4];
        r[i * 5 + 4] = o;
    }
    return r;
}
/** Combine une liste de filtres, appliqués dans l'ordre donné. */
export function combiner(filtres) {
    let m = identite();
    for (const f of filtres) {
        if (!(f.type in DEFINITIONS))
            continue;
        const def = DEFINITIONS[f.type];
        if (f.valeur === def.neutre)
            continue;
        m = multiplier(matriceFiltre(f.type, f.valeur), m);
    }
    return m;
}
export function estIdentite(m) {
    const id = identite();
    for (let i = 0; i < 20; i++)
        if (Math.abs(m[i] - id[i]) > 1e-6)
            return false;
    return true;
}
/** Applique une matrice à une couleur RVB [0,1] (référence CPU, sert aux tests). */
export function appliquer(m, r, g, b) {
    const c = (i) => Math.min(1, Math.max(0, m[i * 5] * r + m[i * 5 + 1] * g + m[i * 5 + 2] * b + m[i * 5 + 4]));
    return [c(0), c(1), c(2)];
}
//# sourceMappingURL=filtres.js.map