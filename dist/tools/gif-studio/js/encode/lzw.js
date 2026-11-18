/**
 * Compression LZW au format GIF (codes de longueur variable, 12 bits max).
 * Implémentation maison, table de hachage à adressage ouvert.
 */
const TAILLE_HASH = 5003; // premier, comme dans l'implémentation de référence historique
const BITS_MAX = 12;
const CODE_MAX = 1 << BITS_MAX;
/** Petit tampon d'octets extensible. */
export class Octets {
    buf;
    longueur = 0;
    constructor(capacite = 4096) { this.buf = new Uint8Array(capacite); }
    garantir(n) {
        if (this.longueur + n <= this.buf.length)
            return;
        let cap = this.buf.length * 2;
        while (cap < this.longueur + n)
            cap *= 2;
        const nb = new Uint8Array(cap);
        nb.set(this.buf.subarray(0, this.longueur));
        this.buf = nb;
    }
    octet(v) { this.garantir(1); this.buf[this.longueur++] = v & 255; }
    mot(v) { this.octet(v); this.octet(v >> 8); }
    tableau(a) { this.garantir(a.length); this.buf.set(a, this.longueur); this.longueur += a.length; }
    texte(s) { for (let i = 0; i < s.length; i++)
        this.octet(s.charCodeAt(i)); }
    resultat() { return this.buf.slice(0, this.longueur); }
}
/**
 * Compresse des indices et écrit dans `sortie` : taille de code minimale,
 * puis les sous-blocs de données (≤ 255 octets) et le bloc terminal.
 */
export function compresserLzw(indices, profondeur, sortie) {
    const tailleMin = Math.max(2, profondeur);
    sortie.octet(tailleMin);
    const codeClear = 1 << tailleMin;
    const codeFin = codeClear + 1;
    let prochainCode = codeFin + 1;
    let tailleCode = tailleMin + 1;
    const hashCles = new Int32Array(TAILLE_HASH).fill(-1);
    const hashCodes = new Int32Array(TAILLE_HASH);
    // Accumulateur de bits → sous-blocs.
    const bloc = new Uint8Array(255);
    let nBloc = 0;
    let acc = 0, nBits = 0;
    const viderBloc = () => { if (nBloc > 0) {
        sortie.octet(nBloc);
        sortie.tableau(bloc.subarray(0, nBloc));
        nBloc = 0;
    } };
    const emettre = (code) => {
        acc |= code << nBits;
        nBits += tailleCode;
        while (nBits >= 8) {
            bloc[nBloc++] = acc & 255;
            if (nBloc === 255)
                viderBloc();
            acc >>>= 8;
            nBits -= 8;
        }
    };
    emettre(codeClear);
    if (indices.length === 0) {
        emettre(codeFin);
    }
    else {
        let prefixe = indices[0];
        for (let i = 1; i < indices.length; i++) {
            const c = indices[i];
            const cle = (c << BITS_MAX) | prefixe;
            let h = ((c << 4) ^ prefixe) % TAILLE_HASH;
            // Sondage : pas secondaire classique.
            const pas = h === 0 ? 1 : TAILLE_HASH - h;
            let trouve = -1;
            while (hashCles[h] >= 0) {
                if (hashCles[h] === cle) {
                    trouve = hashCodes[h];
                    break;
                }
                h -= pas;
                if (h < 0)
                    h += TAILLE_HASH;
            }
            if (trouve >= 0) {
                prefixe = trouve;
                continue;
            }
            emettre(prefixe);
            if (prochainCode < CODE_MAX) {
                hashCles[h] = cle;
                hashCodes[h] = prochainCode++;
                // Le décodeur agrandit ses codes dès que le prochain code dépasse la taille.
                if (prochainCode > (1 << tailleCode) && tailleCode < BITS_MAX)
                    tailleCode++;
            }
            else {
                // Table pleine : remise à zéro.
                emettre(codeClear);
                hashCles.fill(-1);
                prochainCode = codeFin + 1;
                tailleCode = tailleMin + 1;
            }
            prefixe = c;
        }
        emettre(prefixe);
        emettre(codeFin);
    }
    if (nBits > 0) {
        bloc[nBloc++] = acc & 255;
        if (nBloc === 255)
            viderBloc();
    }
    viderBloc();
    sortie.octet(0); // fin des sous-blocs
}
//# sourceMappingURL=lzw.js.map