/**
 * Pipeline vidéo (spécification §5), version universelle :
 * élément <video> du navigateur + positionnement précis (seek).
 *
 * - Un élément sert à l'aperçu en direct (lecture native en boucle).
 * - Un second extrait les images aux instants EXACTS que l'export demandera
 *   (même calcul : imagesExport + tempsSource). L'aperçu montre ensuite ces
 *   images : ce qu'on voit est ce qu'on exporte, et l'export n'a plus rien
 *   à décoder.
 * - Un troisième produit les miniatures de la barre de découpage.
 *
 * Le chemin WebCodecs (décodage image par image plus rapide) pourra
 * remplacer l'extracteur sans toucher au reste.
 */
import { nouvelId } from '../model/projet.js';
export class ErreurVideo extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
const attendre = (el, evt, delaiMs = 10000) => new Promise((ok, ko) => {
    const fin = () => { el.removeEventListener(evt, okFn); el.removeEventListener('error', koFn); clearTimeout(minuteur); };
    const okFn = () => { fin(); ok(); };
    const koFn = () => { fin(); ko(new ErreurVideo('VIDEO_ILLISIBLE', 'lecture impossible')); };
    const minuteur = setTimeout(() => { fin(); ko(new ErreurVideo('DELAI_DEPASSE', `délai dépassé (${evt})`)); }, delaiMs);
    el.addEventListener(evt, okFn, { once: true });
    el.addEventListener('error', koFn, { once: true });
});
function creerVideo(url) {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.crossOrigin = 'anonymous';
    v.src = url;
    return v;
}
/** Place la vidéo exactement à `secondes` et attend que l'image soit prête. */
async function positionner(v, secondes) {
    const cible = Math.min(Math.max(0, secondes), Math.max(0, v.duration - 0.001));
    if (Math.abs(v.currentTime - cible) < 0.0005 && v.readyState >= 2 && !v.seeking)
        return;
    const p = attendre(v, 'seeked');
    v.currentTime = cible;
    await p;
}
export class SourceVideo {
    url;
    ref;
    apercu;
    extracteur;
    cache = new Map();
    largeurCache = 0;
    generation = 0;
    file = Promise.resolve();
    miniaturesEl = null;
    /**
     * Vrai pendant une capture par lecture : l'aperçu montre alors la vidéo
     * de l'extracteur (un seul décodage au lieu de deux).
     */
    captureEnCours = false;
    get lecteurDirect() { return this.captureEnCours ? this.extracteur : this.apercu; }
    constructor(url, ref) {
        this.url = url;
        this.ref = ref;
        this.apercu = creerVideo(url);
        this.apercu.loop = false;
        this.extracteur = creerVideo(url);
    }
    static async ouvrir(fichier, nom, mime) {
        const url = URL.createObjectURL(fichier);
        const sonde = creerVideo(url);
        try {
            await attendre(sonde, 'loadedmetadata', 15000);
            let duree = sonde.duration;
            // WebM enregistrés par le navigateur : durée inconnue jusqu'à la fin
            // (enregistrements MediaRecorder) : on va à la fin pour la faire calculer.
            if (!Number.isFinite(duree) || duree <= 0) {
                // La durée n'est définitive qu'une fois le positionnement terminé (« seeked »).
                const fin = attendre(sonde, 'seeked', 20000).catch(() => undefined);
                sonde.currentTime = 1e7;
                await fin;
                const limite = performance.now() + 5000;
                while ((!Number.isFinite(sonde.duration) || sonde.duration <= 0) && performance.now() < limite) {
                    await attendre(sonde, 'durationchange', 1000).catch(() => undefined);
                }
                duree = sonde.duration;
                if (!Number.isFinite(duree) || duree <= 0)
                    throw new ErreurVideo('VIDEO_ILLISIBLE', 'durée inconnue');
                await positionner(sonde, 0).catch(() => undefined);
            }
            if (!sonde.videoWidth || !sonde.videoHeight)
                throw new ErreurVideo('VIDEO_SANS_IMAGE', 'aucune image');
            await positionner(sonde, 0);
            const ref = {
                id: nouvelId('med'),
                type: 'video',
                nom,
                mime,
                octets: fichier.size,
                largeur: sonde.videoWidth,
                hauteur: sonde.videoHeight,
                dureeMs: Math.round(duree * 1000),
                fps: 30,
                empreinte: `${fichier.size.toString(36)}-${Math.round(duree * 1000).toString(36)}`,
            };
            sonde.removeAttribute('src');
            sonde.load();
            const s = new SourceVideo(url, ref);
            await attendre(s.apercu, 'loadeddata', 15000).catch(() => undefined);
            return s;
        }
        catch (e) {
            URL.revokeObjectURL(url);
            throw e instanceof ErreurVideo ? e : new ErreurVideo('VIDEO_ILLISIBLE', String(e));
        }
    }
    /** Exécute les opérations de l'extracteur l'une après l'autre. */
    enFile(f) {
        const p = this.file.then(f, f);
        this.file = p.catch(() => undefined);
        return p;
    }
    /** Nombre d'images déjà prêtes parmi `instantsMs`. */
    pretes(instantsMs) {
        return instantsMs.reduce((n, t) => n + (this.cache.has(Math.round(t)) ? 1 : 0), 0);
    }
    /**
     * Extrait les images aux instants source donnés (ms), à `largeur` px pour
     * l'image entière. Les images déjà en cache ne sont pas refaites.
     * Une nouvelle demande interrompt la précédente.
     */
    assurer(instantsMs, largeur, surProgression, signal) {
        const gen = ++this.generation;
        largeur = Math.max(16, Math.min(this.ref.largeur, Math.round(largeur)));
        return this.enFile(async () => {
            if (gen !== this.generation)
                return false;
            // Un cache nettement plus petit que nécessaire est refait ; plus grand, il sert tel quel.
            if (this.largeurCache && this.largeurCache < largeur * 0.95)
                this.viderCache();
            if (!this.largeurCache)
                this.largeurCache = largeur;
            const L = this.largeurCache;
            const H = Math.max(1, Math.round((L * this.ref.hauteur) / this.ref.largeur));
            const voulues = [...new Set(instantsMs.map((t) => Math.round(t)))].sort((a, b) => a - b);
            this.limiterCache(new Set(voulues));
            const aFaire = voulues.filter((t) => !this.cache.has(t));
            let faites = voulues.length - aFaire.length;
            surProgression?.(faites, voulues.length);
            const stop = () => gen !== this.generation || !!signal?.aborted;
            // 1. Lecture continue : bien plus rapide que des positionnements successifs.
            //    Si la machine saute des images, un second passage à ½× les reprend.
            let ralenti = 1;
            for (let passage = 0; passage < 2 && 'requestVideoFrameCallback' in HTMLVideoElement.prototype; passage++) {
                const restantes = aFaire.filter((t) => !this.cache.has(t));
                if (restantes.length < 4)
                    break;
                this.captureEnCours = true;
                try {
                    const obtenues = await this.capturerParLecture(restantes, L, H, stop, () => surProgression?.(++faites, voulues.length), ralenti);
                    if (stop())
                        return false;
                    for (const [t, b] of obtenues)
                        this.cache.set(t, b);
                    if (obtenues.size < restantes.length * 0.25)
                        break; // lecture trop saccadée : positionnements
                    ralenti = 0.5;
                }
                finally {
                    this.captureEnCours = false;
                }
            }
            // 2. Positionnement précis pour les images restantes (ou partout sans rVFC).
            for (const t of aFaire) {
                if (this.cache.has(t))
                    continue;
                if (stop())
                    return false;
                await positionner(this.extracteur, t / 1000);
                const bmp = await createImageBitmap(this.extracteur, { resizeWidth: L, resizeHeight: H, resizeQuality: 'high' });
                this.cache.set(t, bmp);
                surProgression?.(++faites, voulues.length);
            }
            return true;
        });
    }
    /**
     * Lit le passage et capture chaque image présentée (requestVideoFrameCallback).
     * L'instant T reçoit l'image dont l'intervalle [m, m suivant) contient T,
     * exactement comme un positionnement. Une image sautée par le lecteur
     * (machine lente) laisse l'instant de côté : il sera repris par positionnement.
     */
    async capturerParLecture(instants, L, H, stop, surImage, ralenti = 1) {
        const v = this.extracteur;
        const obtenues = new Map();
        // rVFC n'est appelé que pour une vidéo affichée : élément invisible mais attaché.
        if (!v.isConnected) {
            Object.assign(v.style, { position: 'fixed', left: '0', top: '0', width: '2px', height: '2px', opacity: '0', pointerEvents: 'none', zIndex: '-1' });
            document.body.append(v);
        }
        const ecartImage = 1000 / Math.max(1, this.ref.fps);
        const pas = instants.length > 1 ? (instants[instants.length - 1] - instants[0]) / (instants.length - 1) : ecartImage;
        await positionner(v, Math.max(0, instants[0] - 1) / 1000);
        if (stop())
            return obtenues;
        v.playbackRate = (pas >= ecartImage * 2.9 && ralenti === 1 ? 2 : 1) * ralenti;
        const promesses = new Map();
        await new Promise((fin) => {
            let i = 0;
            // La capture est lancée dans le rappel (image figée à cet instant) ; la promesse suit.
            let prec = null;
            let garde;
            let fini = false;
            const liberer = (x) => { if (x && !x.utilise)
                x.b.then((bmp) => bmp.close(), () => undefined); };
            const terminer = () => {
                if (fini)
                    return;
                fini = true;
                clearTimeout(garde);
                v.pause();
                liberer(prec);
                fin();
            };
            const reArmer = () => { clearTimeout(garde); garde = setTimeout(terminer, 2500); };
            // Attribue l'image précédente aux instants qu'elle couvre (jusqu'à `jusqua`, exclu).
            const attribuer = (jusqua) => {
                while (i < instants.length && instants[i] < jusqua - 0.5) {
                    const T = instants[i];
                    if (prec && T >= prec.m - 0.5 && T - prec.m <= ecartImage * 2.5) {
                        promesses.set(T, prec.b);
                        prec.utilise = true;
                        surImage();
                    }
                    i++;
                }
            };
            const surFrame = (_, meta) => {
                if (fini)
                    return;
                if (stop()) {
                    terminer();
                    return;
                }
                reArmer();
                const m = meta.mediaTime * 1000;
                attribuer(m);
                liberer(prec);
                prec = null;
                if (i >= instants.length) {
                    terminer();
                    return;
                }
                prec = { m, b: createImageBitmap(v, { resizeWidth: L, resizeHeight: H, resizeQuality: 'medium' }), utilise: false };
                v.requestVideoFrameCallback(surFrame);
            };
            v.addEventListener('ended', () => { if (!fini) {
                attribuer(Infinity);
                terminer();
            } }, { once: true });
            v.requestVideoFrameCallback(surFrame);
            reArmer();
            v.play().catch(terminer);
        });
        // Une même image peut servir à plusieurs instants (ralenti) : chaque entrée du
        // cache reçoit sa propre copie, pour pouvoir être libérée indépendamment.
        const vues = new Set();
        for (const [t, p] of promesses) {
            try {
                const b = await p;
                obtenues.set(t, vues.has(b) ? await createImageBitmap(b) : b);
                vues.add(b);
            }
            catch { /* image manquée : reprise par positionnement */ }
        }
        return obtenues;
    }
    /** Arrête l'extraction en cours (la prochaine demande repart de là). */
    interrompre() { this.generation++; }
    limiterCache(garder, max = 600) {
        if (this.cache.size + garder.size <= max)
            return;
        for (const [t, b] of this.cache)
            if (!garder.has(t)) {
                b.close();
                this.cache.delete(t);
            }
    }
    viderCache() {
        for (const b of this.cache.values())
            b.close();
        this.cache.clear();
        this.largeurCache = 0;
    }
    /**
     * Image pour l'instant source tMs : l'image extraite la plus proche
     * (à 25 ms près), sinon l'image courante de la vidéo d'aperçu.
     */
    image(tMs, directAutorise = true) {
        const cle = Math.round(tMs);
        let bmp = this.cache.get(cle);
        if (!bmp && this.cache.size) {
            let meilleure = Infinity;
            for (const [t, b] of this.cache) {
                const d = Math.abs(t - cle);
                if (d < meilleure) {
                    meilleure = d;
                    bmp = b;
                }
            }
            if (meilleure > 25)
                bmp = undefined;
        }
        const { largeur, hauteur } = this.ref;
        if (bmp)
            return { cle: `${this.ref.id}@${cle}:${bmp.width}`, source: bmp, largeur, hauteur };
        const v = this.lecteurDirect;
        if (!directAutorise || v.readyState < 2)
            return null;
        return { cle: `${this.ref.id}@direct${v.currentTime}`, source: v, largeur, hauteur };
    }
    /** Miniatures réparties sur toute la vidéo, pour la barre de découpage. */
    async miniatures(n, hauteur, surMiniature) {
        this.miniaturesEl ??= creerVideo(this.url);
        const v = this.miniaturesEl;
        if (v.readyState < 1)
            await attendre(v, 'loadedmetadata');
        const largeur = Math.max(8, Math.round((hauteur * this.ref.largeur) / this.ref.hauteur));
        const sortie = [];
        const D = this.ref.dureeMs / 1000;
        for (let i = 0; i < n; i++) {
            await positionner(v, ((i + 0.5) / n) * D);
            const b = await createImageBitmap(v, { resizeWidth: largeur, resizeHeight: hauteur, resizeQuality: 'medium' });
            sortie.push(b);
            surMiniature?.(i, b);
        }
        return sortie;
    }
    /** Affiche dans l'aperçu direct l'image à `tMs` (pendant qu'on déplace une poignée). */
    async montrer(tMs) {
        this.apercu.pause();
        await positionner(this.apercu, tMs / 1000).catch(() => undefined);
    }
    liberer() {
        this.interrompre();
        this.viderCache();
        for (const v of [this.apercu, this.extracteur, this.miniaturesEl]) {
            if (!v)
                continue;
            v.pause();
            v.removeAttribute('src');
            v.load();
        }
        URL.revokeObjectURL(this.url);
    }
}
//# sourceMappingURL=video.js.map