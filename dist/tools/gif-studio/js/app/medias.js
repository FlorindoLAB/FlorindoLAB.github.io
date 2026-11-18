/**
 * Importation des médias : images fixes et vidéos.
 * Tout reste dans le navigateur ; rien n'est envoyé.
 */
import { nouvelId } from '../model/projet.js';
import { ErreurVideo, SourceVideo } from './video.js';
export const TYPES_IMAGES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'];
const OCTETS_MAX_IMAGE = 50 * 1024 * 1024;
export class ErreurImport extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
/** Empreinte rapide : taille + premiers et derniers Ko (suffit à relier un média). */
async function empreinte(f) {
    const bout = 64 * 1024;
    const parts = [f.slice(0, bout), f.slice(Math.max(0, f.size - bout))];
    const buf = new Uint8Array(await new Blob(parts).arrayBuffer());
    let h = 2166136261 ^ f.size;
    for (let i = 0; i < buf.length; i++) {
        h ^= buf[i];
        h = Math.imul(h, 16777619);
    }
    return `${f.size.toString(36)}-${(h >>> 0).toString(36)}`;
}
const OCTETS_MAX_VIDEO = 2 * 1024 * 1024 * 1024;
const EXTENSIONS_VIDEO = /\.(mp4|m4v|mov|webm|mkv|ogv|avi|3gp)$/i;
export const estVideo = (f) => f.type.startsWith('video/') || EXTENSIONS_VIDEO.test(f.name);
export class RegistreMedias {
    bitmaps = new Map();
    videos = new Map();
    /** Importe une image ou une vidéo selon le type du fichier. */
    async importer(fichier) {
        return estVideo(fichier) ? this.importerVideo(fichier) : this.importerImage(fichier);
    }
    async importerVideo(fichier) {
        if (fichier.size > OCTETS_MAX_VIDEO)
            throw new ErreurImport('FICHIER_TROP_VOLUMINEUX', 'video_trop_lourde');
        try {
            const s = await SourceVideo.ouvrir(fichier, fichier.name, fichier.type || 'video/*');
            this.videos.set(s.ref.id, s);
            return s.ref;
        }
        catch (e) {
            throw new ErreurImport('VIDEO_ILLISIBLE', e instanceof ErreurVideo ? e.code : 'VIDEO_ILLISIBLE');
        }
    }
    async importerImage(fichier) {
        if (!TYPES_IMAGES.includes(fichier.type)) {
            throw new ErreurImport('FORMAT_NON_PRIS_EN_CHARGE', 'format_inconnu');
        }
        if (fichier.size > OCTETS_MAX_IMAGE) {
            throw new ErreurImport('FICHIER_TROP_VOLUMINEUX', 'image_trop_lourde');
        }
        let bmp;
        try {
            bmp = await createImageBitmap(fichier, { imageOrientation: 'from-image', premultiplyAlpha: 'none' });
        }
        catch {
            throw new ErreurImport('FICHIER_CORROMPU', 'image_illisible');
        }
        const ref = {
            id: nouvelId('med'),
            type: 'image',
            nom: fichier.name,
            mime: fichier.type,
            octets: fichier.size,
            largeur: bmp.width,
            hauteur: bmp.height,
            empreinte: await empreinte(fichier),
        };
        this.bitmaps.set(ref.id, bmp);
        return ref;
    }
    /** Enregistre une image déjà décodée (images générées, tests). */
    ajouterBitmap(ref, bmp) {
        this.bitmaps.set(ref.id, bmp);
    }
    liberer(id) {
        this.bitmaps.get(id)?.close();
        this.bitmaps.delete(id);
        this.videos.get(id)?.liberer();
        this.videos.delete(id);
    }
    toutLiberer() {
        for (const id of [...this.bitmaps.keys(), ...this.videos.keys()])
            this.liberer(id);
    }
    /** Aperçu : l'image extraite si elle existe, sinon la vidéo en direct. */
    fournisseur = (id, tS) => {
        const v = this.videos.get(id);
        if (v)
            return v.image(tS, true);
        const b = this.bitmaps.get(id);
        return b ? { cle: id, source: b, largeur: b.width, hauteur: b.height } : null;
    };
    /** Export : uniquement des images extraites aux instants exacts. */
    fournisseurExport = (id, tS) => {
        const v = this.videos.get(id);
        if (v)
            return v.image(tS, false);
        return this.fournisseur(id, tS);
    };
}
//# sourceMappingURL=medias.js.map