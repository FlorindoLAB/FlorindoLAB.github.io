/**
 * Logique du mode Express (spécification §10) : préparation des images
 * vidéo et export avec budget de poids automatique.
 */
import { instantsSource } from '../anim/temps.js';
import { dimensionsSortie } from '../model/projet.js';
import { exporterGif } from './exporter.js';
const maxAnimable = (a) => ('valeur' in a ? a.valeur : Math.max(...a.cles.map((k) => k.valeur)));
/** Largeur (px) à laquelle extraire l'image vidéo entière pour rester net à la sortie. */
export function largeurExtraction(p, c) {
    const media = p.medias[c.media];
    const { largeur: sortieL } = dimensionsSortie(p);
    const echelleBase = p.scene.largeur / c.recadrage.l;
    const zoom = Math.max(1, maxAnimable(c.transform.echelle) / echelleBase);
    return Math.min(media.largeur, Math.ceil(((media.largeur * sortieL) / c.recadrage.l) * zoom));
}
/** Calques vidéo du projet avec leurs instants et largeur d'extraction. */
export function besoinsVideo(p, registre) {
    return p.calques
        .filter((c) => c.type === 'media' && registre.videos.has(c.media))
        .map((c) => ({ source: registre.videos.get(c.media), instants: instantsSource(p, c), largeur: largeurExtraction(p, c) }));
}
/** Extrait toutes les images vidéo nécessaires à l'export (déjà faites = gratuites). */
export async function preparerVideos(p, registre, prog, signal) {
    const besoins = besoinsVideo(p, registre);
    const total = besoins.reduce((n, b) => n + b.instants.length, 0) || 1;
    let base = 0;
    for (const b of besoins) {
        const ok = await b.source.assurer(b.instants, b.largeur, (f) => prog?.((base + f) / total), signal);
        if (!ok)
            throw new DOMException('Export annulé', 'AbortError');
        base += b.instants.length;
    }
}
/**
 * Exporte ; si le fichier dépasse le budget, réduit dans l'ordre :
 * cadence (jusqu'à 10 i/s), résolution (paliers de 15 %, jusqu'à 320 px),
 * puis couleurs (128). Au plus 4 essais.
 */
export async function exporterExpress(projet, registre, o) {
    const p = structuredClone(projet);
    const reductions = [];
    for (let essai = 0;; essai++) {
        await preparerVideos(p, registre, (f) => o.surEtape?.(essai ? 'reduction' : 'preparation', f), o.signal);
        const r = await exporterGif(p, registre.fournisseurExport, {
            signal: o.signal,
            worker: o.worker,
            surProgression: (f, n) => o.surEtape?.(essai ? 'reduction' : 'encodage', f / n),
        });
        if (!o.budgetOctets || r.blob.size <= o.budgetOctets || essai >= 4)
            return { ...r, reductions };
        const e = p.export;
        const rapport = r.blob.size / o.budgetOctets;
        if (e.delaiCs < 10 && rapport < 1.6) {
            e.delaiCs = 10;
            reductions.push('cadence');
            continue;
        }
        if (e.coteMax > 320) {
            // Le poids suit à peu près la surface : on vise directement le budget.
            const k = Math.max(0.6, Math.min(0.85, Math.sqrt(1 / rapport) * 0.97));
            e.coteMax = Math.max(320, Math.round(e.coteMax * k));
            reductions.push('resolution');
            continue;
        }
        if (e.delaiCs < 10) {
            e.delaiCs = 10;
            reductions.push('cadence');
            continue;
        }
        if (e.couleurs > 128) {
            e.couleurs = 128;
            reductions.push('couleurs');
            continue;
        }
        return { ...r, reductions };
    }
}
//# sourceMappingURL=express.js.map