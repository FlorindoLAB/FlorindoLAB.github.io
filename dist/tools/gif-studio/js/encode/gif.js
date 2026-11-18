import { compresserLzw, Octets } from './lzw.js';
import { construirePalette, Correspondance } from './palette.js';
import { indexer } from './tramage.js';
const profondeurPour = (n) => Math.max(1, Math.ceil(Math.log2(Math.max(2, n))));
export class EncodeurGif {
    largeur;
    hauteur;
    options;
    out = new Octets(1 << 16);
    /** Couleur RVB actuellement affichée par le décodeur, pour la différence. */
    affiche;
    premiere = true;
    globale = null;
    stats = [];
    /**
     * @param paletteGlobale palette pré-calculée (mode « globale »). Si absente
     * en mode global, elle est calculée sur la première image.
     */
    constructor(largeur, hauteur, options, paletteGlobale) {
        this.largeur = largeur;
        this.hauteur = hauteur;
        this.options = options;
        this.affiche = new Uint8Array(largeur * hauteur * 3);
        if (options.palette === 'globale' && paletteGlobale)
            this.definirGlobale(paletteGlobale);
    }
    /** Nombre de couleurs utiles : on réserve un indice pour la transparence. */
    static couleursUtiles(o) {
        return Math.max(2, Math.min(255, o.couleurs - 1));
    }
    definirGlobale(p) {
        const taille = Math.min(255, p.taille);
        const pal = { rvb: p.rvb.slice(0, taille * 3), taille };
        this.globale = { palette: pal, corr: new Correspondance(pal), transparent: taille };
    }
    entete(palette, transparent) {
        const o = this.out;
        o.texte('GIF89a');
        o.mot(this.largeur);
        o.mot(this.hauteur);
        if (palette) {
            const prof = profondeurPour(transparent + 1);
            o.octet(0x80 | ((prof - 1) << 4) | (prof - 1)); // table globale présente
            o.octet(transparent); // couleur de fond = transparent
            o.octet(0);
            this.ecrireTable(palette, prof);
        }
        else {
            o.octet(0x70); // pas de table globale, résolution 8 bits
            o.octet(0);
            o.octet(0);
        }
        // Extension NETSCAPE2.0 : nombre de boucles.
        o.octet(0x21);
        o.octet(0xff);
        o.octet(11);
        o.texte('NETSCAPE2.0');
        o.octet(3);
        o.octet(1);
        o.mot(this.options.boucles);
        o.octet(0);
    }
    ecrireTable(p, prof) {
        const n = 1 << prof;
        const t = new Uint8Array(n * 3);
        t.set(p.rvb.subarray(0, Math.min(p.taille, n) * 3));
        this.out.tableau(t);
    }
    /** Ajoute une image RGBA (largeur × hauteur × 4) affichée `delaiCs` centièmes. */
    ajouterImage(rgba, delaiCs) {
        const { largeur: L, hauteur: H, options } = this;
        if (rgba.length !== L * H * 4)
            throw new Error('TAILLE_IMAGE_INCORRECTE');
        // --- palette
        let palette, corr, transparent, locale;
        if (options.palette === 'globale') {
            if (!this.globale)
                this.definirGlobale(construirePalette([rgba], EncodeurGif.couleursUtiles(options), 2));
            ({ palette, corr, transparent } = this.globale);
            locale = false;
        }
        else {
            const p = construirePalette([rgba], EncodeurGif.couleursUtiles(options), 2);
            palette = p;
            corr = new Correspondance(p);
            transparent = p.taille;
            locale = true;
        }
        if (this.premiere)
            this.entete(locale ? null : palette, transparent);
        // --- indices
        const indices = indexer(rgba, L, H, corr, options.tramage, transparent);
        const pal = palette.rvb;
        // --- différence avec l'image affichée
        let x0 = 0, y0 = 0, x1 = L - 1, y1 = H - 1;
        let utiliseTransparence = false;
        if (!this.premiere) {
            const tol = options.toleranceDiff;
            x0 = L;
            y0 = H;
            x1 = -1;
            y1 = -1;
            for (let y = 0, p = 0; y < H; y++) {
                for (let x = 0; x < L; x++, p++) {
                    const k = indices[p];
                    const a = p * 3;
                    if (k !== transparent) {
                        const dr = pal[k * 3] - this.affiche[a], dg = pal[k * 3 + 1] - this.affiche[a + 1], db = pal[k * 3 + 2] - this.affiche[a + 2];
                        if (Math.abs(dr) <= tol && Math.abs(dg) <= tol && Math.abs(db) <= tol) {
                            indices[p] = transparent;
                            utiliseTransparence = true;
                            continue;
                        }
                    }
                    if (x < x0)
                        x0 = x;
                    if (x > x1)
                        x1 = x;
                    if (y < y0)
                        y0 = y;
                    if (y > y1)
                        y1 = y;
                }
            }
            if (x1 < 0) {
                x0 = 0;
                y0 = 0;
                x1 = 0;
                y1 = 0;
            } // image identique : 1 pixel transparent
        }
        const l = x1 - x0 + 1, h = y1 - y0 + 1;
        // --- mise à jour de l'image affichée (seuls les pixels opaques écrits)
        let sousIndices = indices;
        if (l !== L || h !== H) {
            sousIndices = new Uint8Array(l * h);
            for (let y = 0; y < h; y++)
                sousIndices.set(indices.subarray((y0 + y) * L + x0, (y0 + y) * L + x0 + l), y * l);
        }
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < l; x++) {
                const k = sousIndices[y * l + x];
                if (k === transparent)
                    continue;
                const a = ((y0 + y) * L + x0 + x) * 3;
                this.affiche[a] = pal[k * 3];
                this.affiche[a + 1] = pal[k * 3 + 1];
                this.affiche[a + 2] = pal[k * 3 + 2];
            }
        }
        // --- écriture
        const o = this.out;
        const debut = o.longueur;
        const avecTransparence = utiliseTransparence || contientIndice(sousIndices, transparent);
        o.octet(0x21);
        o.octet(0xf9);
        o.octet(4);
        // Disposition 1 (laisser en place) + drapeau de transparence.
        o.octet((1 << 2) | (avecTransparence ? 1 : 0));
        o.mot(Math.max(2, Math.round(delaiCs)));
        o.octet(avecTransparence ? transparent : 0);
        o.octet(0);
        o.octet(0x2c);
        o.mot(x0);
        o.mot(y0);
        o.mot(l);
        o.mot(h);
        const prof = profondeurPour(transparent + 1);
        if (locale) {
            o.octet(0x80 | (prof - 1));
            this.ecrireTable(palette, prof);
        }
        else {
            o.octet(0);
        }
        compresserLzw(sousIndices, prof, o);
        this.stats.push({ x: x0, y: y0, l, h, octets: o.longueur - debut });
        this.premiere = false;
    }
    /** Termine le fichier et renvoie ses octets. */
    terminer() {
        if (this.premiere)
            throw new Error('AUCUNE_IMAGE');
        this.out.octet(0x3b);
        return this.out.resultat();
    }
}
function contientIndice(a, t) {
    for (let i = 0; i < a.length; i++)
        if (a[i] === t)
            return true;
    return false;
}
//# sourceMappingURL=gif.js.map