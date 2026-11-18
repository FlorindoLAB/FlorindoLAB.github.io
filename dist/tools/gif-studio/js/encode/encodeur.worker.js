/// <reference lib="webworker" />
/**
 * Worker d'encodage GIF. Reçoit les images RGBA une par une (transférées,
 * jamais copiées) et les encode dès réception : l'export ne garde jamais
 * toutes les images en mémoire (spécification §11).
 */
import { EncodeurGif } from './gif.js';
import { construirePalette } from './palette.js';
let enc = null;
let index = 0;
const envoyer = (m, transfert = []) => self.postMessage(m, transfert);
self.onmessage = (e) => {
    try {
        const m = e.data;
        if (m.type === 'debut') {
            const palette = m.options.palette === 'globale' && m.echantillons.length
                ? construirePalette(m.echantillons.map((b) => new Uint8ClampedArray(b)), EncodeurGif.couleursUtiles(m.options), 2)
                : undefined;
            enc = new EncodeurGif(m.largeur, m.hauteur, m.options, palette);
            index = 0;
        }
        else if (m.type === 'image') {
            if (!enc)
                throw new Error('ENCODEUR_NON_DEMARRE');
            enc.ajouterImage(new Uint8ClampedArray(m.pixels), m.delaiCs);
            envoyer({ type: 'imageEncodee', index: index++, octets: enc.stats[enc.stats.length - 1].octets });
        }
        else if (m.type === 'fin') {
            if (!enc)
                throw new Error('ENCODEUR_NON_DEMARRE');
            const gif = enc.terminer();
            enc = null;
            envoyer({ type: 'resultat', gif: gif.buffer }, [gif.buffer]);
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        envoyer({ type: 'erreur', code: /^[A-Z_]+$/.test(message) ? message : 'ERREUR_ENCODAGE', message });
    }
};
envoyer({ type: 'pret' });
//# sourceMappingURL=encodeur.worker.js.map