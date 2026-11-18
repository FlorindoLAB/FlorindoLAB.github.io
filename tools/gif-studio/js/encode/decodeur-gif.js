/**
 * Décodeur GIF minimal (maison) : sert aux tests (aller-retour) et servira
 * plus tard à importer des GIF existants. Gère palettes globale/locale,
 * transparence, dispositions 0/1/2, entrelacement.
 */
export function decoderGif(d) {
    let p = 0;
    const u8 = () => d[p++];
    const u16 = () => { const v = d[p] | (d[p + 1] << 8); p += 2; return v; };
    const sig = String.fromCharCode(...d.subarray(0, 6));
    if (sig !== 'GIF89a' && sig !== 'GIF87a')
        throw new Error('PAS_UN_GIF');
    p = 6;
    const L = u16(), H = u16();
    const drapeaux = u8();
    u8();
    u8();
    let globale = null;
    if (drapeaux & 0x80) {
        const n = 1 << ((drapeaux & 7) + 1);
        globale = d.subarray(p, p + n * 3);
        p += n * 3;
    }
    const toile = new Uint8ClampedArray(L * H * 4);
    const images = [];
    let boucles = null;
    let gce = { disposition: 0, transparent: -1, delai: 0 };
    const sousBlocs = () => {
        const morceaux = [];
        let total = 0;
        for (;;) {
            const n = u8();
            if (n === 0)
                break;
            morceaux.push(d.subarray(p, p + n));
            total += n;
            p += n;
        }
        const r = new Uint8Array(total);
        let o = 0;
        for (const m of morceaux) {
            r.set(m, o);
            o += m.length;
        }
        return r;
    };
    while (p < d.length) {
        const b = u8();
        if (b === 0x3b)
            break;
        if (b === 0x21) {
            const label = u8();
            if (label === 0xf9) {
                u8();
                const f = u8();
                const delai = u16();
                const t = u8();
                u8();
                gce = { disposition: (f >> 2) & 7, transparent: f & 1 ? t : -1, delai };
            }
            else if (label === 0xff) {
                const n = u8();
                const id = String.fromCharCode(...d.subarray(p, p + n));
                p += n;
                const data = sousBlocs();
                if (id === 'NETSCAPE2.0' && data[0] === 1)
                    boucles = data[1] | (data[2] << 8);
            }
            else
                sousBlocs();
            continue;
        }
        if (b !== 0x2c)
            throw new Error(`BLOC_INCONNU_${b}`);
        const x0 = u16(), y0 = u16(), l = u16(), h = u16();
        const fl = u8();
        let table = globale;
        if (fl & 0x80) {
            const n = 1 << ((fl & 7) + 1);
            table = d.subarray(p, p + n * 3);
            p += n * 3;
        }
        if (!table)
            throw new Error('PAS_DE_PALETTE');
        const entrelace = (fl & 0x40) !== 0;
        const tailleMin = u8();
        const indices = decompresserLzw(sousBlocs(), tailleMin, l * h);
        const sauvegarde = gce.disposition === 3 ? toile.slice() : null;
        const lignes = entrelace ? ordreEntrelace(h) : null;
        for (let yy = 0; yy < h; yy++) {
            const y = lignes ? lignes[yy] : yy;
            for (let x = 0; x < l; x++) {
                const k = indices[yy * l + x];
                if (k === gce.transparent)
                    continue;
                const cx = x0 + x, cy = y0 + y;
                if (cx >= L || cy >= H)
                    continue;
                const a = (cy * L + cx) * 4;
                toile[a] = table[k * 3];
                toile[a + 1] = table[k * 3 + 1];
                toile[a + 2] = table[k * 3 + 2];
                toile[a + 3] = 255;
            }
        }
        images.push({ rgba: toile.slice(), delaiCs: gce.delai });
        if (gce.disposition === 2) {
            for (let y = y0; y < y0 + h && y < H; y++)
                toile.fill(0, (y * L + x0) * 4, (y * L + Math.min(L, x0 + l)) * 4);
        }
        else if (sauvegarde)
            toile.set(sauvegarde);
        gce = { disposition: 0, transparent: -1, delai: 0 };
    }
    return { largeur: L, hauteur: H, boucles, images };
}
function ordreEntrelace(h) {
    const r = [];
    for (const [debut, pas] of [[0, 8], [4, 8], [2, 4], [1, 2]])
        for (let y = debut; y < h; y += pas)
            r.push(y);
    return r;
}
export function decompresserLzw(donnees, tailleMin, nbPixels) {
    const sortie = new Uint8Array(nbPixels);
    const clear = 1 << tailleMin, fin = clear + 1;
    const prefixes = new Int32Array(4096), suffixes = new Uint8Array(4096), longueurs = new Int32Array(4096);
    for (let i = 0; i < clear; i++) {
        prefixes[i] = -1;
        suffixes[i] = i;
        longueurs[i] = 1;
    }
    let taille = tailleMin + 1, suivant = fin + 1, ancien = -1;
    let acc = 0, nBits = 0, pos = 0, o = 0;
    const pile = new Uint8Array(4096);
    while (o < nbPixels) {
        while (nBits < taille && pos < donnees.length) {
            acc |= donnees[pos++] << nBits;
            nBits += 8;
        }
        if (nBits < taille)
            break;
        const code = acc & ((1 << taille) - 1);
        acc >>>= taille;
        nBits -= taille;
        if (code === clear) {
            taille = tailleMin + 1;
            suivant = fin + 1;
            ancien = -1;
            continue;
        }
        if (code === fin)
            break;
        let c = code, premier;
        if (ancien === -1) {
            sortie[o++] = code;
            ancien = code;
            continue;
        }
        let n = 0;
        if (code >= suivant) { // cas KwKwK
            c = ancien;
        }
        while (c >= clear) {
            pile[n++] = suffixes[c];
            c = prefixes[c];
        }
        pile[n++] = c;
        premier = c;
        for (let i = n - 1; i >= 0 && o < nbPixels; i--)
            sortie[o++] = pile[i];
        if (code >= suivant && o < nbPixels)
            sortie[o++] = premier;
        if (suivant < 4096) {
            prefixes[suivant] = ancien;
            suffixes[suivant] = premier;
            longueurs[suivant] = longueurs[ancien] + 1;
            suivant++;
            if (suivant === 1 << taille && taille < 12)
                taille++;
        }
        ancien = code;
    }
    return sortie;
}
//# sourceMappingURL=decodeur-gif.js.map