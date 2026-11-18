/**
 * Orchestration de l'export GIF (spécification §9).
 *
 * 1. Liste des images (cadence, sens, ping-pong).
 * 2. Échantillon d'images pour la palette globale.
 * 3. Rendu image par image avec le MÊME moteur que l'aperçu, envoi au worker
 *    d'encodage (transfert, sans copie), progression et annulation.
 */
import { imagesExport } from '../anim/temps.js';
import { dimensionsSortie } from '../model/projet.js';
import { EncodeurGif } from '../encode/gif.js';
import { construirePalette } from '../encode/palette.js';
import { Moteur } from '../render/renderer.js';
import { nouvelleToile } from '../render/texte.js';
const urlWorker = () => new URL('../encode/encodeur.worker.js', import.meta.url);
/** Vérifie une fois que le worker d'encodage peut démarrer ici (CSP, hébergement). */
export function workerDisponible(delaiMs = 4000) {
    return new Promise((ok) => {
        let w;
        try {
            w = new Worker(urlWorker(), { type: 'module' });
        }
        catch {
            ok(false);
            return;
        }
        const fin = (r) => { clearTimeout(minuteur); w.terminate(); ok(r); };
        const minuteur = setTimeout(() => fin(false), delaiMs);
        w.onmessage = (e) => fin(e.data?.type === 'pret');
        w.onerror = () => fin(false);
    });
}
export async function exporterGif(projet, fournisseur, o = {}) {
    const debut = performance.now();
    const { largeur, hauteur } = dimensionsSortie(projet);
    const { images, nbRendus, instantsRendus } = imagesExport(projet);
    const total = images.length;
    const moteur = new Moteur(nouvelleToile(largeur, hauteur), fournisseur);
    // Worker d'encodage ; si le navigateur ou l'hébergement le refuse, on
    // encode sur le thread principal (plus lent, même résultat).
    let worker = null;
    if (o.worker !== false) {
        try {
            worker = new Worker(urlWorker(), { type: 'module' });
        }
        catch {
            worker = null;
        }
    }
    const local = worker ? null : new EncodeurLocal();
    const envoyer = (m, t = []) => (worker ? worker.postMessage(m, t) : local.recevoir(m));
    const rendre = (tMs) => {
        moteur.rendreImage(projet, tMs, largeur, hauteur);
        return moteur.lirePixels();
    };
    try {
        return await new Promise((resoudre, rejeter) => {
            const annuler = () => rejeter(new DOMException('Export annulé', 'AbortError'));
            if (o.signal?.aborted)
                return annuler();
            o.signal?.addEventListener('abort', annuler, { once: true });
            let encodees = 0;
            const surMessage = (m) => {
                if (m.type === 'pret')
                    return;
                if (m.type === 'imageEncodee')
                    o.surProgression?.(++encodees, total);
                else if (m.type === 'erreur')
                    rejeter(new Error(m.code));
                else if (m.type === 'resultat') {
                    resoudre({ blob: new Blob([m.gif], { type: 'image/gif' }), largeur, hauteur, nbImages: total, dureeMs: performance.now() - debut });
                }
            };
            if (worker) {
                worker.onmessage = (e) => surMessage(e.data);
                worker.onerror = (e) => rejeter(new Error(`WORKER: ${e.message}`));
            }
            else
                local.surMessage = surMessage;
            // Palette globale : échantillon réparti sur toute la durée.
            const nbEch = projet.export.palette === 'globale' ? Math.min(nbRendus, o.echantillons ?? 8) : 0;
            const echantillons = [];
            for (let k = 0; k < nbEch; k++) {
                const i = Math.round((k * (nbRendus - 1)) / Math.max(1, nbEch - 1));
                echantillons.push(rendre(instantsRendus[i]).buffer);
            }
            envoyer({ type: 'debut', largeur, hauteur, options: projet.export, echantillons }, echantillons);
            // Rendu séquentiel. Le ping-pong re-rend ses images de retour : le rendu
            // étant déterministe, c'est identique et évite de tout garder en mémoire.
            (async () => {
                for (let i = 0; i < total; i++) {
                    if (o.signal?.aborted)
                        return;
                    const px = rendre(images[i].tMs);
                    envoyer({ type: 'image', pixels: px.buffer, delaiCs: projet.export.delaiCs }, [px.buffer]);
                    // Rend la main régulièrement pour garder l'interface fluide.
                    if (i % 4 === 3)
                        await new Promise((r) => setTimeout(r, 0));
                }
                envoyer({ type: 'fin' });
            })().catch(rejeter);
        });
    }
    finally {
        worker?.terminate();
        moteur.detruire();
    }
}
/** Même protocole que le worker, exécuté sur le thread principal. */
class EncodeurLocal {
    enc = null;
    index = 0;
    surMessage = () => undefined;
    recevoir(m) {
        try {
            if (m.type === 'debut') {
                const palette = m.options.palette === 'globale' && m.echantillons.length
                    ? construirePalette(m.echantillons.map((b) => new Uint8ClampedArray(b)), EncodeurGif.couleursUtiles(m.options), 2)
                    : undefined;
                this.enc = new EncodeurGif(m.largeur, m.hauteur, m.options, palette);
            }
            else if (m.type === 'image') {
                this.enc.ajouterImage(new Uint8ClampedArray(m.pixels), m.delaiCs);
                this.surMessage({ type: 'imageEncodee', index: this.index++, octets: this.enc.stats[this.enc.stats.length - 1].octets });
            }
            else {
                const gif = this.enc.terminer();
                this.surMessage({ type: 'resultat', gif: gif.buffer });
            }
        }
        catch (e) {
            this.surMessage({ type: 'erreur', code: 'ERREUR_ENCODAGE', message: String(e) });
        }
    }
}
//# sourceMappingURL=exporter.js.map