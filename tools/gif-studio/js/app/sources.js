/**
 * Sources vidéo supplémentaires :
 * - lien direct vers un fichier vidéo (si le site d'origine l'autorise : CORS) ;
 * - enregistrement d'un onglet, d'une fenêtre ou de l'écran (getDisplayMedia).
 * Dans les deux cas on obtient un fichier local, ouvert comme un import normal.
 */
export class ErreurSource extends Error {
    code;
    constructor(code, message = code) {
        super(message);
        this.code = code;
    }
}
/** Sites de partage dont les pages ne sont pas des fichiers vidéo (et dont le téléchargement est encadré). */
const PLATEFORMES = /(^|\.)(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com|vimeo\.com|dailymotion\.com|twitch\.tv|reddit\.com|snapchat\.com|pinterest\.[a-z.]+|threads\.net|bsky\.app|kick\.com)$/i;
const OCTETS_MAX_LIEN = 1024 * 1024 * 1024;
export function analyserLien(texte) {
    let url;
    try {
        url = new URL(texte.trim());
    }
    catch {
        throw new ErreurSource('LIEN_INVALIDE');
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:')
        throw new ErreurSource('LIEN_INVALIDE');
    if (PLATEFORMES.test(url.hostname))
        throw new ErreurSource('LIEN_PLATEFORME');
    return url;
}
/** Nom de fichier tiré de l'adresse (ou « video »). */
function nomDepuisUrl(url, type) {
    const dernier = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? '');
    if (/\.[a-z0-9]{2,4}$/i.test(dernier))
        return dernier;
    const ext = type.includes('webm') ? 'webm' : type.includes('quicktime') ? 'mov' : 'mp4';
    return `${dernier || 'video'}.${ext}`;
}
/**
 * Télécharge un fichier vidéo par son adresse. Le navigateur refuse la
 * lecture si le site d'origine n'envoie pas d'autorisation (CORS) : on le
 * signale clairement plutôt que de passer par un serveur intermédiaire.
 */
export async function telechargerLien(texte, surProgression, signal) {
    const url = analyserLien(texte);
    let rep;
    try {
        rep = await fetch(url, { mode: 'cors', credentials: 'omit', signal });
    }
    catch (e) {
        if (e.name === 'AbortError')
            throw e;
        throw new ErreurSource('LIEN_REFUSE');
    }
    if (!rep.ok)
        throw new ErreurSource('LIEN_REFUSE', `HTTP ${rep.status}`);
    const type = (rep.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (type && !type.startsWith('video/') && type !== 'application/octet-stream')
        throw new ErreurSource('LIEN_PAS_VIDEO');
    const total = Number(rep.headers.get('content-length')) || null;
    if (total && total > OCTETS_MAX_LIEN)
        throw new ErreurSource('LIEN_TROP_LOURD');
    const morceaux = [];
    let recus = 0;
    if (rep.body) {
        const lecteur = rep.body.getReader();
        for (;;) {
            const { done, value } = await lecteur.read();
            if (done)
                break;
            morceaux.push(value);
            recus += value.length;
            if (recus > OCTETS_MAX_LIEN) {
                lecteur.cancel();
                throw new ErreurSource('LIEN_TROP_LOURD');
            }
            surProgression?.(recus, total);
        }
    }
    else {
        const b = new Uint8Array(await rep.arrayBuffer());
        morceaux.push(b);
        recus = b.length;
    }
    if (!recus)
        throw new ErreurSource('LIEN_PAS_VIDEO');
    const typeFinal = type.startsWith('video/') ? type : 'video/mp4';
    return new File(morceaux, nomDepuisUrl(url, typeFinal), { type: typeFinal });
}
// ---------------------------------------------------------------- capture d'écran
export const captureDisponible = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia && typeof MediaRecorder !== 'undefined';
function typeEnregistrement() {
    const candidats = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4;codecs=avc1', 'video/mp4'];
    return candidats.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}
export const DUREE_MAX_CAPTURE_MS = 60_000;
/**
 * Enregistrement d'un onglet, d'une fenêtre ou de l'écran, choisi par
 * l'utilisateur dans la fenêtre du navigateur. Sans son.
 */
export class Enregistrement {
    recorder = null;
    flux = null;
    morceaux = [];
    fin = null;
    minuteur;
    debut = 0;
    /** Demande la source puis démarre. `surFin` est appelé quand l'enregistrement s'arrête (bouton, partage arrêté ou durée max). */
    async demarrer(surFin, surface = 'browser') {
        if (!captureDisponible())
            throw new ErreurSource('CAPTURE_INDISPONIBLE');
        try {
            // Le navigateur affiche sa propre fenêtre de choix (onglets, fenêtres, écrans) ;
            // `displaySurface` ouvre directement la bonne rubrique (Chrome, Edge).
            // Firefox liste fenêtres et écrans ; Safari propose fenêtre ou écran.
            this.flux = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: { ideal: 30, max: 30 }, displaySurface: surface },
                audio: false,
                selfBrowserSurface: 'exclude',
                surfaceSwitching: 'include',
                monitorTypeSurfaces: 'include',
            });
        }
        catch (e) {
            const nom = e.name;
            throw new ErreurSource(nom === 'NotAllowedError' || nom === 'AbortError' ? 'CAPTURE_REFUSEE' : 'CAPTURE_INDISPONIBLE');
        }
        const mimeType = typeEnregistrement();
        this.recorder = new MediaRecorder(this.flux, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 8_000_000 });
        this.morceaux = [];
        this.fin = new Promise((ok, ko) => {
            this.recorder.ondataavailable = (e) => { if (e.data.size)
                this.morceaux.push(e.data); };
            this.recorder.onstop = () => {
                this.liberer();
                const type = (this.recorder?.mimeType || mimeType || 'video/webm').split(';')[0];
                if (!this.morceaux.length) {
                    ko(new ErreurSource('CAPTURE_VIDE'));
                    return;
                }
                const ext = type.includes('mp4') ? 'mp4' : 'webm';
                const d = new Date();
                const horodatage = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
                ok(new File(this.morceaux, `capture ${horodatage}.${ext}`, { type }));
            };
        });
        // L'utilisateur arrête le partage depuis la barre du navigateur.
        this.flux.getVideoTracks()[0]?.addEventListener('ended', () => this.arreter());
        this.recorder.start(250);
        this.debut = performance.now();
        this.minuteur = setTimeout(() => this.arreter(), DUREE_MAX_CAPTURE_MS);
        surFin(this.fin);
    }
    get enCours() { return this.recorder?.state === 'recording'; }
    /** Nom de la source choisie (titre de l'onglet ou de la fenêtre, quand le navigateur le donne). */
    get nomSource() {
        const piste = this.flux?.getVideoTracks()[0];
        const type = (piste?.getSettings()?.displaySurface ?? null);
        // Les navigateurs donnent parfois un identifiant technique au lieu d'un titre : on l'ignore.
        const l = piste?.label ?? '';
        const lisible = l.length > 0 && l.length < 90 && !/:\/\/|^(screen|window|tab):/i.test(l) && !/^[A-Za-z0-9+/=_-]{16,}$/.test(l);
        return { type, titre: lisible ? l : '' };
    }
    arreter() {
        clearTimeout(this.minuteur);
        if (this.recorder && this.recorder.state !== 'inactive')
            this.recorder.stop();
        else
            this.liberer();
    }
    /** Abandonne sans importer. */
    annuler() {
        if (this.recorder)
            this.recorder.ondataavailable = null;
        this.morceaux = [];
        this.arreter();
    }
    liberer() {
        clearTimeout(this.minuteur);
        this.flux?.getTracks().forEach((t) => t.stop());
        this.flux = null;
    }
}
//# sourceMappingURL=sources.js.map