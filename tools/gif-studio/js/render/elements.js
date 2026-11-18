import { nouvelleToile } from './texte.js';
export const POLICE_EMOJI = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Twemoji Mozilla', 'Segoe UI Symbol', sans-serif";
const css = (c, a = c.a) => `rgba(${c.r},${c.g},${c.b},${a})`;
export function cleElement(e, facteur) {
    return [e.genre, e.contenu, e.largeur, e.hauteur, JSON.stringify(e.couleur), e.intensite, facteur].join('|');
}
/** Épaisseur du trait d'un symbole (px), d'après l'intensité. */
const epaisseur = (e, W, H) => Math.max(2, Math.min(W, H) * (0.04 + 0.14 * e.intensite));
export function rasteriserElement(e, facteur) {
    const W = Math.max(4, e.largeur * facteur), H = Math.max(4, e.hauteur * facteur);
    const lw = e.genre === 'symbole' ? epaisseur(e, W, H) : 0;
    const m = Math.ceil(lw * 1.2 + 2);
    const L = Math.ceil(W + 2 * m), Ht = Math.ceil(H + 2 * m);
    const toile = nouvelleToile(L, Ht);
    const ctx = toile.getContext('2d');
    ctx.translate(m, m);
    if (e.genre === 'emoji')
        dessinerEmoji(ctx, e.contenu, W, H);
    else
        dessinerSymbole(ctx, e, W, H, lw);
    return { toile, largeur: L, hauteur: Ht, cle: cleElement(e, facteur) };
}
function dessinerEmoji(ctx, texte, W, H) {
    let taille = Math.min(W, H) * 0.86;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${taille}px ${POLICE_EMOJI}`;
    // Plusieurs emojis côte à côte : on réduit pour tenir dans la boîte.
    const w = ctx.measureText(texte).width;
    if (w > W * 0.98) {
        taille *= (W * 0.98) / w;
        ctx.font = `${taille}px ${POLICE_EMOJI}`;
    }
    ctx.fillText(texte, W / 2, H / 2 + taille * 0.04);
}
function dessinerSymbole(ctx, e, W, H, lw) {
    const coul = css(e.couleur);
    const halo = 'rgba(0,0,0,0.55)';
    const X = (u) => u * W, Y = (v) => v * H;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    /** Trait avec un halo sombre dessous, pour rester lisible sur tous les fonds. */
    const trait = (chemin) => {
        ctx.beginPath();
        chemin();
        ctx.strokeStyle = halo;
        ctx.lineWidth = lw * 1.55;
        ctx.stroke();
        ctx.beginPath();
        chemin();
        ctx.strokeStyle = coul;
        ctx.lineWidth = lw;
        ctx.stroke();
    };
    /** Forme pleine avec un contour sombre. */
    const plein = (chemin) => {
        ctx.beginPath();
        chemin();
        ctx.closePath();
        ctx.fillStyle = coul;
        ctx.fill();
        ctx.strokeStyle = halo;
        ctx.lineWidth = Math.max(1.5, lw * 0.45);
        ctx.stroke();
    };
    const i = lw / 2;
    switch (e.contenu) {
        case 'fleche': {
            const tete = Math.min(W * 0.4, H * 0.9);
            trait(() => { ctx.moveTo(i, H / 2); ctx.lineTo(W - tete * 0.6, H / 2); });
            plein(() => { ctx.moveTo(W - tete, H / 2 - tete * 0.5); ctx.lineTo(W - i, H / 2); ctx.lineTo(W - tete, H / 2 + tete * 0.5); });
            break;
        }
        case 'cercle':
            trait(() => ctx.ellipse(W / 2, H / 2, Math.max(1, W / 2 - i), Math.max(1, H / 2 - i), 0, 0, Math.PI * 2));
            break;
        case 'rectangle':
            trait(() => arrondi(ctx, i, i, W - lw, H - lw, Math.min(W, H) * 0.08));
            break;
        case 'bulle':
            plein(() => {
                const r = Math.min(W, H) * 0.18, bas = Y(0.74);
                ctx.moveTo(X(0.05) + r, Y(0.04));
                ctx.lineTo(X(0.95) - r, Y(0.04));
                ctx.quadraticCurveTo(X(0.95), Y(0.04), X(0.95), Y(0.04) + r);
                ctx.lineTo(X(0.95), bas - r);
                ctx.quadraticCurveTo(X(0.95), bas, X(0.95) - r, bas);
                ctx.lineTo(X(0.42), bas);
                ctx.lineTo(X(0.2), Y(0.97));
                ctx.lineTo(X(0.27), bas);
                ctx.lineTo(X(0.05) + r, bas);
                ctx.quadraticCurveTo(X(0.05), bas, X(0.05), bas - r);
                ctx.lineTo(X(0.05), Y(0.04) + r);
                ctx.quadraticCurveTo(X(0.05), Y(0.04), X(0.05) + r, Y(0.04));
            });
            break;
        case 'coeur':
            plein(() => {
                ctx.moveTo(X(0.5), Y(0.92));
                ctx.bezierCurveTo(X(0.12), Y(0.62), X(0.0), Y(0.38), X(0.08), Y(0.22));
                ctx.bezierCurveTo(X(0.2), Y(0.0), X(0.45), Y(0.05), X(0.5), Y(0.27));
                ctx.bezierCurveTo(X(0.55), Y(0.05), X(0.8), Y(0.0), X(0.92), Y(0.22));
                ctx.bezierCurveTo(X(1.0), Y(0.38), X(0.88), Y(0.62), X(0.5), Y(0.92));
            });
            break;
        case 'etoile':
            plein(() => {
                for (let k = 0; k < 10; k++) {
                    const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 0.2 : 0.48;
                    const x = X(0.5 + Math.cos(a) * r), y = Y(0.53 + Math.sin(a) * r);
                    if (k)
                        ctx.lineTo(x, y);
                    else
                        ctx.moveTo(x, y);
                }
            });
            break;
        case 'eclair':
            plein(() => {
                const pts = [[0.58, 0.02], [0.18, 0.56], [0.46, 0.56], [0.36, 0.98], [0.84, 0.4], [0.54, 0.4], [0.66, 0.02]];
                pts.forEach(([u, v], k) => (k ? ctx.lineTo(X(u), Y(v)) : ctx.moveTo(X(u), Y(v))));
            });
            break;
        case 'coche':
            trait(() => { ctx.moveTo(X(0.1), Y(0.55)); ctx.lineTo(X(0.4), Y(0.84)); ctx.lineTo(X(0.92), Y(0.16)); });
            break;
        case 'croix':
            trait(() => { ctx.moveTo(X(0.14), Y(0.14)); ctx.lineTo(X(0.86), Y(0.86)); ctx.moveTo(X(0.86), Y(0.14)); ctx.lineTo(X(0.14), Y(0.86)); });
            break;
        case 'souligne':
            trait(() => {
                ctx.moveTo(i, H * 0.62);
                ctx.bezierCurveTo(W * 0.3, H * 0.35, W * 0.6, H * 0.85, W - i, H * 0.45);
            });
            break;
    }
}
function arrondi(ctx, x, y, l, h, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + l, y, x + l, y + h, r);
    ctx.arcTo(x + l, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + l, y, r);
    ctx.closePath();
}
//# sourceMappingURL=elements.js.map