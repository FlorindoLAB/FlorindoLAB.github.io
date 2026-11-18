/** Instant dans le média source (ms) pour un temps local de calque. */
export function tempsSource(c, tLocal, vitesse) {
    const { entreeMs, sortieMs } = c.decoupe;
    const duree = Math.max(0, sortieMs - entreeMs);
    if (duree === 0)
        return entreeMs;
    const t = Math.max(0, tLocal) * vitesse;
    // Au-delà de la sortie, on reste sur la dernière image (pas de boucle implicite).
    return entreeMs + Math.min(t, duree - 1e-3);
}
/** Durée de lecture du projet (ms). Express la règle à durée du découpage ÷ vitesse. */
export function dureeLecture(p) {
    return p.scene.dureeMs;
}
/**
 * Liste ordonnée des images du GIF.
 * Le ping-pong réutilise les images de l'aller, sans répéter les extrémités.
 */
export function imagesExport(p) {
    const pasMs = p.export.delaiCs * 10;
    const n = Math.max(1, Math.round(dureeLecture(p) / pasMs));
    const instants = Array.from({ length: n }, (_, i) => i * pasMs);
    const aller = instants.map((tMs, i) => ({ tMs, rendu: i }));
    let images;
    switch (p.lecture.sens) {
        case 'avant':
            images = aller;
            break;
        case 'arriere':
            images = [...aller].reverse();
            break;
        case 'pingpong':
            images = n <= 2 ? aller : [...aller, ...aller.slice(1, -1).reverse()];
            break;
    }
    return { images, nbRendus: n, instantsRendus: instants };
}
/** Instant projet affiché par l'aperçu à l'horloge `horlogeMs` (même règles que l'export). */
export function instantApercu(p, horlogeMs) {
    const { images } = imagesExport(p);
    const pasMs = p.export.delaiCs * 10;
    const total = images.length * pasMs;
    const h = p.lecture.boucle ? ((horlogeMs % total) + total) % total : Math.min(horlogeMs, total - 1);
    const i = Math.min(images.length - 1, Math.floor(h / pasMs));
    return images[i].tMs;
}
/**
 * Instants source (ms) dont l'export aura besoin pour un calque média :
 * mêmes images que l'export, donc mêmes instants que l'aperçu exact.
 */
export function instantsSource(p, c) {
    const { instantsRendus } = imagesExport(p);
    return instantsRendus
        .filter((t) => t >= c.debutMs && t < c.finMs)
        .map((t) => tempsSource(c, t - c.debutMs, p.lecture.vitesse));
}
//# sourceMappingURL=temps.js.map