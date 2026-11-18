const BASE = 'gif-studio-florindolab';
const MAGASIN = 'session';
const CLE = 'courante';
function ouvrir() {
    return new Promise((ok, ko) => {
        const r = indexedDB.open(BASE, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(MAGASIN);
        r.onsuccess = () => ok(r.result);
        r.onerror = () => ko(r.error);
    });
}
async function operation(mode, f) {
    const db = await ouvrir();
    try {
        return await new Promise((ok, ko) => {
            const tx = db.transaction(MAGASIN, mode);
            const r = f(tx.objectStore(MAGASIN));
            tx.oncomplete = () => ok(r.result);
            tx.onerror = () => ko(tx.error);
            tx.onabort = () => ko(tx.error);
        });
    }
    finally {
        db.close();
    }
}
export async function lireSession() {
    try {
        return (await operation('readonly', (s) => s.get(CLE))) ?? null;
    }
    catch {
        return null;
    }
}
export async function effacerSession() {
    try {
        await operation('readwrite', (s) => s.delete(CLE));
    }
    catch { /* stockage indisponible */ }
}
let minuteur;
let fichierCourant = null;
let fichierEcrit = null;
export function definirFichier(f) { fichierCourant = f; fichierEcrit = null; }
/** Enregistre le projet 1 s après la dernière modification. */
export function planifierSauvegarde(projet) {
    clearTimeout(minuteur);
    if (!fichierCourant)
        return;
    const json = JSON.stringify(projet);
    minuteur = setTimeout(async () => {
        try {
            // Le fichier (parfois lourd) n'est réécrit que s'il a changé.
            if (fichierEcrit !== fichierCourant) {
                await operation('readwrite', (s) => s.put({ projet: JSON.parse(json), fichier: fichierCourant, date: Date.now() }, CLE));
                fichierEcrit = fichierCourant;
            }
            else {
                const ancienne = await lireSession();
                if (ancienne)
                    await operation('readwrite', (s) => s.put({ ...ancienne, projet: JSON.parse(json), date: Date.now() }, CLE));
            }
        }
        catch { /* quota dépassé ou navigation privée : on continue sans sauvegarde */ }
    }, 1000);
}
/** Demande au navigateur de ne pas effacer ce stockage (meilleur effort). */
export function demanderPersistance() {
    navigator.storage?.persist?.().catch(() => undefined);
}
//# sourceMappingURL=session.js.map