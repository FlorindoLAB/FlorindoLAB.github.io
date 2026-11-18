/**
 * Moteur de composition (spécification §6).
 *
 * Une seule fonction, `rendreImage(projet, t)`, produit chaque image pour
 * l'aperçu comme pour l'export : le GIF téléchargé correspond exactement à
 * l'aperçu. Rendu WebGL2, utilisable sur un canvas du DOM ou un
 * OffscreenCanvas dans un worker.
 *
 * Les poignées de sélection ne passent jamais par ici : elles vivent dans
 * une couche DOM superposée, donc ne peuvent pas apparaître dans l'export.
 */
import { evaluerCalque } from '../anim/evaluer.js';
import { tempsSource } from '../anim/temps.js';
import { TAILLE_TEXTE_MIN_REL } from '../model/projet.js';
import { cleElement, rasteriserElement } from './elements.js';
import { combiner } from './filtres.js';
import { cleTexte, rasteriserTexte } from './texte.js';
const VS = `#version 300 es
in vec2 aPos;          // coin du quad, 0..1
uniform mat3 uMat;     // quad unité → pixels de sortie
uniform vec2 uSortie;  // taille de sortie en px
uniform vec4 uUv;      // x, y, l, h dans la texture (0..1)
out vec2 vUv;
void main() {
  vec2 px = (uMat * vec3(aPos, 1.0)).xy;
  vec2 clip = px / uSortie * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vUv = uUv.xy + aPos * uUv.zw;
}`;
const FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform mat4 uCouleur;   // matrice couleur (transposée pour GLSL)
uniform vec4 uDecalage;
uniform float uOpacite;
out vec4 sortie;
void main() {
  vec4 c = texture(uTex, vUv);          // prémultiplié
  vec3 rgb = c.a > 0.0 ? c.rgb / c.a : vec3(0.0);
  vec4 f = uCouleur * vec4(rgb, c.a) + uDecalage;
  f = clamp(f, 0.0, 1.0);
  float a = f.a * uOpacite;
  sortie = vec4(f.rgb * a, a);
}`;
/**
 * Zones de flou et de pixelisation : on lit l'image déjà composée (copiée
 * dans uFond) autour de chaque pixel. Masque rectangle ou ellipse à bord doux.
 */
const FS_ZONE = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uFond;
uniform vec2 uSortie;
uniform float uRayon;    // flou : rayon en px ; pixel : taille des blocs en px
uniform int uMode;       // 0 flou, 1 pixel
uniform float uEllipse;
uniform float uOpacite;
out vec4 sortie;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float masque;
  if (uEllipse > 0.5) masque = 1.0 - smoothstep(0.9, 1.0, length(p));
  else { vec2 a = abs(p); masque = (1.0 - smoothstep(0.94, 1.0, a.x)) * (1.0 - smoothstep(0.94, 1.0, a.y)); }
  vec2 fc = gl_FragCoord.xy;
  vec3 c;
  if (uMode == 1) {
    vec2 b = (floor(fc / uRayon) + 0.5) * uRayon;
    c = texture(uFond, clamp(b / uSortie, 0.0, 1.0)).rgb;
  } else {
    vec3 somme = vec3(0.0);
    for (int i = 0; i < 64; i++) {
      float r = sqrt((float(i) + 0.5) / 64.0) * uRayon;
      float a = float(i) * 2.39996;
      somme += texture(uFond, clamp((fc + vec2(cos(a), sin(a)) * r) / uSortie, 0.0, 1.0)).rgb;
    }
    c = somme / 64.0;
  }
  float al = masque * uOpacite;
  sortie = vec4(c * al, al);
}`;
export class Moteur {
    toile;
    fournisseur;
    gl;
    prog;
    progZone;
    u = {};
    uz = {};
    texFond = null;
    tailleFond = '';
    textures = new Map(); // par calque
    horloge = 0;
    largeur = 0;
    hauteur = 0;
    geometries = new Map();
    constructor(toile, fournisseur) {
        this.toile = toile;
        this.fournisseur = fournisseur;
        const gl = toile.getContext('webgl2', {
            alpha: false,
            antialias: false, // l'image composée doit pouvoir être relue (zones de flou)
            premultipliedAlpha: true,
            preserveDrawingBuffer: true,
        });
        if (!gl)
            throw new Error('WEBGL2_INDISPONIBLE');
        this.gl = gl;
        this.progZone = this.compiler(FS_ZONE);
        for (const n of ['uMat', 'uSortie', 'uUv', 'uFond', 'uRayon', 'uMode', 'uEllipse', 'uOpacite'])
            this.uz[n] = gl.getUniformLocation(this.progZone, n);
        this.prog = this.compiler(FS);
        for (const n of ['uMat', 'uSortie', 'uUv', 'uTex', 'uCouleur', 'uDecalage', 'uOpacite'])
            this.u[n] = gl.getUniformLocation(this.prog, n);
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    }
    compiler(fs) {
        const gl = this.gl;
        const sh = (type, src) => {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
                throw new Error(`SHADER: ${gl.getShaderInfoLog(s)}`);
            return s;
        };
        const p = gl.createProgram();
        gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
        gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
        gl.bindAttribLocation(p, 0, 'aPos'); // même attribut pour les deux programmes
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS))
            throw new Error(`PROGRAMME: ${gl.getProgramInfoLog(p)}`);
        gl.useProgram(p);
        return p;
    }
    /** Charge (ou réutilise) la texture d'un calque si sa clé a changé. */
    texture(idCalque, cle, source, l, h) {
        const gl = this.gl;
        let t = this.textures.get(idCalque);
        if (!t) {
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            t = { tex, cle: '', l, h, utilise: 0 };
            this.textures.set(idCalque, t);
        }
        gl.bindTexture(gl.TEXTURE_2D, t.tex);
        if (t.cle !== cle) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
            t.cle = cle;
            t.l = l;
            t.h = h;
        }
        t.utilise = this.horloge;
        return t;
    }
    /** Libère les textures des calques qui n'existent plus. */
    nettoyer(projet) {
        const ids = new Set(projet.calques.map((c) => c.id));
        for (const [id, t] of this.textures) {
            if (!ids.has(id)) {
                this.gl.deleteTexture(t.tex);
                this.textures.delete(id);
            }
        }
    }
    /**
     * Rend l'image à l'instant projet `tMs`, à la taille de sortie largeur×hauteur
     * (la scène est mise à l'échelle par `facteur`).
     */
    rendreImage(projet, tMs, largeur, hauteur) {
        const gl = this.gl;
        this.horloge++;
        if (this.toile.width !== largeur || this.toile.height !== hauteur) {
            this.toile.width = largeur;
            this.toile.height = hauteur;
        }
        this.largeur = largeur;
        this.hauteur = hauteur;
        const facteur = largeur / projet.scene.largeur;
        gl.viewport(0, 0, largeur, hauteur);
        const f = projet.scene.fond;
        gl.clearColor(f.r / 255, f.g / 255, f.b / 255, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(this.u.uSortie, largeur, hauteur);
        gl.uniform1i(this.u.uTex, 0);
        gl.activeTexture(gl.TEXTURE0);
        this.geometries.clear();
        const tailleScene = Math.min(projet.scene.largeur, projet.scene.hauteur);
        const filtresScene = [];
        for (const calque of projet.calques) {
            const inst = evaluerCalque(calque, tMs, tailleScene);
            if (!inst.visible || inst.transform.opacite <= 0)
                continue;
            const matrice = combiner([...inst.filtres, ...filtresScene]);
            if (calque.type === 'media')
                this.dessinerMedia(projet, calque, inst, facteur, matrice);
            else if (calque.type === 'texte')
                this.dessinerTexte(projet, calque, inst, facteur, matrice);
            else
                this.dessinerElement(calque, inst, facteur, matrice);
        }
        this.nettoyer(projet);
    }
    dessinerElement(e, inst, facteur, m) {
        const tr = inst.transform;
        const l = e.largeur * facteur * tr.echelle, h = e.hauteur * facteur * tr.echelle;
        const cx = tr.x * facteur, cy = tr.y * facteur;
        this.geometries.set(e.id, { cx, cy, l, h, rotation: tr.rotation });
        if (e.genre === 'flou' || e.genre === 'pixel') {
            this.dessinerZone(e, l, h, cx, cy, tr.rotation, tr.opacite);
            return;
        }
        const prec = this.textures.get(e.id);
        const cle = cleElement(e, facteur);
        let t;
        if (prec && prec.cle === cle) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, prec.tex);
            t = prec;
        }
        else {
            const r = rasteriserElement(e, facteur);
            t = this.texture(e.id, r.cle, r.toile, r.largeur, r.hauteur);
        }
        // La texture a une marge autour de la boîte : le quad l'inclut.
        const kx = t.l / Math.max(1, e.largeur * facteur), ky = t.h / Math.max(1, e.hauteur * facteur);
        this.dessinerQuad(l * kx, h * ky, cx, cy, tr.rotation, [0, 0, 1, 1], m, tr.opacite);
    }
    /** Flou ou pixelisation de ce qui est déjà dessiné, dans la boîte de l'élément. */
    dessinerZone(e, l, h, cx, cy, rot, opacite) {
        const gl = this.gl;
        const W = this.largeur, H = this.hauteur;
        gl.activeTexture(gl.TEXTURE1);
        if (!this.texFond) {
            this.texFond = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.texFond);
            for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]])
                gl.texParameteri(gl.TEXTURE_2D, k, v);
        }
        else
            gl.bindTexture(gl.TEXTURE_2D, this.texFond);
        if (this.tailleFond !== `${W}x${H}`) {
            // Même format que l'image composée (sans alpha), sinon la copie est refusée.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, W, H, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
            this.tailleFond = `${W}x${H}`;
        }
        gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, W, H);
        gl.useProgram(this.progZone);
        const cote = Math.min(W, H);
        gl.uniform1i(this.uz.uFond, 1);
        gl.uniform2f(this.uz.uSortie, W, H);
        gl.uniform1i(this.uz.uMode, e.genre === 'pixel' ? 1 : 0);
        gl.uniform1f(this.uz.uRayon, e.genre === 'pixel' ? Math.max(2, cote * (0.01 + 0.07 * e.intensite)) : Math.max(1, cote * (0.005 + 0.06 * e.intensite)));
        gl.uniform1f(this.uz.uEllipse, e.ellipse ? 1 : 0);
        gl.uniform1f(this.uz.uOpacite, opacite);
        gl.uniform4f(this.uz.uUv, 0, 0, 1, 1);
        gl.uniformMatrix3fv(this.uz.uMat, false, this.matriceQuad(l, h, cx, cy, rot));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.useProgram(this.prog);
        gl.activeTexture(gl.TEXTURE0);
    }
    matriceQuad(l, h, cx, cy, rotDeg) {
        const a = (rotDeg * Math.PI) / 180, co = Math.cos(a), si = Math.sin(a);
        return new Float32Array([co * l, si * l, 0, -si * h, co * h, 0, cx - (co * l - si * h) / 2, cy - (si * l + co * h) / 2, 1]);
    }
    dessinerMedia(projet, c, inst, facteur, m) {
        const tS = tempsSource(c, inst.tLocal, projet.lecture.vitesse);
        const img = this.fournisseur(c.media, tS);
        if (!img)
            return;
        const t = this.texture(c.id, img.cle, img.source, img.largeur, img.hauteur);
        const r = c.recadrage;
        this.geometries.set(c.id, { cx: inst.transform.x * facteur, cy: inst.transform.y * facteur, l: r.l * inst.transform.echelle * facteur, h: r.h * inst.transform.echelle * facteur, rotation: inst.transform.rotation });
        this.dessinerQuad(r.l * inst.transform.echelle * facteur, r.h * inst.transform.echelle * facteur, inst.transform.x * facteur, inst.transform.y * facteur, inst.transform.rotation, [r.x / t.l, r.y / t.h, r.l / t.l, r.h / t.h], m, inst.transform.opacite);
    }
    dessinerTexte(projet, c, inst, facteur, m) {
        if (!c.contenu.trim())
            return;
        const tailleMin = projet.scene.hauteur * TAILLE_TEXTE_MIN_REL;
        // Cache : la rastérisation ne se refait que si contenu, style ou échelle changent.
        const prec = this.textures.get(c.id);
        const cle = cleTexte(c, facteur, inst.revele);
        let t;
        if (prec && prec.cle === cle) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, prec.tex);
            t = prec;
        }
        else {
            const r = rasteriserTexte(c, facteur, inst.revele, tailleMin);
            t = this.texture(c.id, r.cle, r.toile, r.largeur, r.hauteur);
        }
        this.geometries.set(c.id, { cx: inst.transform.x * facteur, cy: inst.transform.y * facteur, l: t.l * inst.transform.echelle, h: t.h * inst.transform.echelle, rotation: inst.transform.rotation });
        this.dessinerQuad(t.l * inst.transform.echelle, t.h * inst.transform.echelle, inst.transform.x * facteur, inst.transform.y * facteur, inst.transform.rotation, [0, 0, 1, 1], m, inst.transform.opacite);
    }
    dessinerQuad(l, h, cx, cy, rotDeg, uv, m, opacite) {
        const gl = this.gl;
        const a = (rotDeg * Math.PI) / 180, co = Math.cos(a), si = Math.sin(a);
        // Quad unité → centré, mis à l'échelle, tourné, translaté. mat3 en colonnes.
        // p = R·S·(q − ½) + c
        const mat = new Float32Array([
            co * l, si * l, 0,
            -si * h, co * h, 0,
            cx - (co * l - si * h) / 2, cy - (si * l + co * h) / 2, 1,
        ]);
        gl.uniformMatrix3fv(this.u.uMat, false, mat);
        gl.uniform4f(this.u.uUv, uv[0], uv[1], uv[2], uv[3]);
        // GLSL mat4 en colonnes : on transpose la partie 4×4 de la matrice 4×5.
        const c4 = new Float32Array(16);
        for (let i = 0; i < 4; i++)
            for (let j = 0; j < 4; j++)
                c4[j * 4 + i] = m[i * 5 + j];
        gl.uniformMatrix4fv(this.u.uCouleur, false, c4);
        gl.uniform4f(this.u.uDecalage, m[4], m[9], m[14], m[19]);
        gl.uniform1f(this.u.uOpacite, opacite);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    /** Pixels RGBA de la dernière image, lignes de haut en bas. */
    lirePixels() {
        const gl = this.gl, L = this.largeur, H = this.hauteur;
        const brut = new Uint8Array(L * H * 4);
        gl.readPixels(0, 0, L, H, gl.RGBA, gl.UNSIGNED_BYTE, brut);
        const sortie = new Uint8ClampedArray(L * H * 4);
        const ligne = L * 4;
        for (let y = 0; y < H; y++)
            sortie.set(brut.subarray((H - 1 - y) * ligne, (H - y) * ligne), y * ligne);
        return sortie;
    }
    detruire() {
        for (const t of this.textures.values())
            this.gl.deleteTexture(t.tex);
        if (this.texFond)
            this.gl.deleteTexture(this.texFond);
        this.textures.clear();
        this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
}
//# sourceMappingURL=renderer.js.map