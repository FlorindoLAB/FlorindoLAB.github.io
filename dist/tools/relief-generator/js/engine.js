var Engine = (function () {
  'use strict';

  // ---------- Aléatoire reproductible ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(ix, iy, s) {
    var h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(s, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  // ---------- Bruit simplex 2D (algorithme de S. Gustavson, domaine public), avec graine ----------
  var GX = [1,1, -1,1, 1,-1, -1,-1, 1,0, -1,0, 1,0, -1,0, 0,1, 0,-1, 0,1, 0,-1];
  var F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
  function simplex(seed) {
    var rnd = mulberry32((seed >>> 0) ^ 0x9E3779B9);
    var p = new Uint8Array(256), i;
    for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = p[i]; p[i] = p[j]; p[j] = t; }
    var perm = new Uint8Array(512), pm = new Uint8Array(512);
    for (i = 0; i < 512; i++) { perm[i] = p[i & 255]; pm[i] = (perm[i] % 12) * 2; }
    return function (xin, yin) {
      var n0 = 0, n1 = 0, n2 = 0;
      var s = (xin + yin) * F2;
      var i = Math.floor(xin + s), j = Math.floor(yin + s);
      var t = (i + j) * G2;
      var x0 = xin - (i - t), y0 = yin - (j - t);
      var i1, j1;
      if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
      var x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
      var x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
      var ii = i & 255, jj = j & 255, g;
      var t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 > 0) { g = pm[ii + perm[jj]]; t0 *= t0; n0 = t0 * t0 * (GX[g] * x0 + GX[g + 1] * y0); }
      var t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 > 0) { g = pm[ii + i1 + perm[jj + j1]]; t1 *= t1; n1 = t1 * t1 * (GX[g] * x1 + GX[g + 1] * y1); }
      var t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 > 0) { g = pm[ii + 1 + perm[jj + 1]]; t2 *= t2; n2 = t2 * t2 * (GX[g] * x2 + GX[g + 1] * y2); }
      return 70 * (n0 + n1 + n2);
    };
  }
  // Bruit de gradient classique (Perlin « improved », algorithme publié par K. Perlin), avec graine
  function perlin(seed) {
    var rnd = mulberry32((seed >>> 0) ^ 0x51ED270B), p = new Uint8Array(256), i;
    for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = p[i]; p[i] = p[j]; p[j] = t; }
    var perm = new Uint8Array(512);
    for (i = 0; i < 512; i++) perm[i] = p[i & 255];
    function g(h, x, y) { switch (h & 7) { case 0: return x + y; case 1: return -x + y; case 2: return x - y; case 3: return -x - y; case 4: return x; case 5: return -x; case 6: return y; default: return -y; } }
    return function (x, y) {
      var X = Math.floor(x), Y = Math.floor(y); x -= X; y -= Y; X &= 255; Y &= 255;
      var u = x * x * x * (x * (x * 6 - 15) + 10), v = y * y * y * (y * (y * 6 - 15) + 10);
      var a = perm[X] + Y, b = perm[X + 1] + Y;
      var x1 = g(perm[a], x, y) + (g(perm[b], x - 1, y) - g(perm[a], x, y)) * u;
      var x2 = g(perm[a + 1], x, y - 1) + (g(perm[b + 1], x - 1, y - 1) - g(perm[a + 1], x, y - 1)) * u;
      return (x1 + (x2 - x1) * v) * 1.2;
    };
  }
  // Bruit de valeur : valeurs aléatoires aux nœuds de la grille, interpolées en douceur
  function valueNoise(seed) {
    return function (x, y) {
      var X = Math.floor(x), Y = Math.floor(y), fx = x - X, fy = y - Y;
      var u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      var a = hash(X, Y, seed), b = hash(X + 1, Y, seed), c = hash(X, Y + 1, seed), d = hash(X + 1, Y + 1, seed);
      return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
    };
  }
  function fbm(n, oct, lac, gain) {
    oct = Math.max(1, Math.round(oct));
    return function (x, y) {
      var s = 0, a = 1, nn = 0;
      for (var o = 0; o < oct; o++) { s += a * n(x + o * 19.1, y - o * 7.3); nn += a; x *= lac; y *= lac; a *= gain; }
      return s / nn;
    };
  }
  function sstep(a, b, x) { var t = (x - a) / (b - a || 1e-6); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function c01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function terrace(v, steps, soft) {
    steps = Math.max(1, Math.round(steps));
    var q = v * steps, fl = Math.floor(q), fr = q - fl;
    var e = soft <= 0.001 ? 0 : sstep(1 - soft, 1, fr);
    return (fl + e) / steps;
  }
  // Coordonnées de bruit : fréquence, décalage, distorsion (domain warp)
  function coords(p, s, ctx) {
    var fr = p.freq * ctx.gs, ox = p.ox || 0, oy = p.oy || 0, amt = p.warp || 0;
    if (!amt) return function (X, Y, q) { q.x = X * fr + ox; q.y = Y * fr + oy; };
    var a = fbm(simplex(s + 101), 3, 2, 0.5), b = fbm(simplex(s + 202), 3, 2, 0.5);
    return function (X, Y, q) {
      var x = X * fr + ox, y = Y * fr + oy;
      q.x = x + a(x * 0.7, y * 0.7) * amt;
      q.y = y + b(x * 0.7 + 3.1, y * 0.7 - 1.7) * amt;
    };
  }

  // ---------- Définitions de paramètres ----------
  function R(k, l, min, max, step, d, extra) { var o = { k: k, l: l, min: min, max: max, step: step, d: d }; for (var e in extra || {}) o[e] = extra[e]; return o; }
  var SEED = { k: 'seed', l: 'Graine', t: 'seed', d: 1, key: true };
  function NP(d) {
    d = d || {};
    return [SEED,
      R('freq', 'Échelle (fréquence)', 0.25, 16, 0.05, d.freq || 3, { key: true }),
      R('oct', 'Détails (octaves)', 1, 10, 1, d.oct || 6, { key: true }),
      R('gain', 'Rugosité', 0.2, 0.8, 0.01, d.gain || 0.5),
      R('lac', 'Lacunarité', 1.5, 3, 0.01, d.lac || 2),
      R('warp', 'Distorsion', 0, 2, 0.01, d.warp || 0),
      R('ox', 'Décalage X', -10, 10, 0.01, 0),
      R('oy', 'Décalage Y', -10, 10, 0.01, 0)];
  }

  // ---------- Générateurs ----------
  var GENS = {
    bruit: {
      name: 'Bruit fractal', cat: 'Bruit',
      params: [SEED,
        { k: 'noise', l: 'Type de bruit', t: 'select', d: 'perlin', key: true, options: [['perlin', 'Perlin'], ['simplex', 'Simplex'], ['valeur', 'Valeur (value noise)']] },
        { k: 'mode', l: 'Variante', t: 'select', d: 'fbm', key: true, options: [['fbm', 'Standard (fBm)'], ['billow', 'Billow (bosses arrondies)'], ['ridged', 'Ridged (crêtes)'], ['turb', 'Turbulence']] },
        R('freq', 'Échelle (fréquence)', 0.25, 32, 0.05, 4, { key: true }),
        R('oct', 'Détails (octaves)', 1, 10, 1, 6, { key: true }),
        R('gain', 'Rugosité', 0.2, 0.8, 0.01, 0.5),
        R('lac', 'Lacunarité', 1.5, 3, 0.01, 2),
        R('warp', 'Distorsion', 0, 2, 0.01, 0),
        R('ox', 'Décalage X', -10, 10, 0.01, 0), R('oy', 'Décalage Y', -10, 10, 0.01, 0)],
      make: function (p, s, ctx) {
        var n = p.noise === 'simplex' ? simplex(s) : p.noise === 'valeur' ? valueNoise(s) : perlin(s);
        var oct = Math.round(p.oct), cd = coords(p, s, ctx), q = { x: 0, y: 0 }, mode = p.mode;
        return function (X, Y) {
          cd(X, Y, q);
          var x = q.x, y = q.y, sum = 0, a = 1, nn = 0;
          for (var o = 0; o < oct; o++) {
            var v = n(x + o * 19.1, y - o * 7.3);
            if (mode === 'billow') v = 2 * Math.abs(v) - 1;
            else if (mode === 'ridged') { v = 1 - Math.abs(v); v *= v; }
            else if (mode === 'turb') v = Math.abs(v);
            sum += v * a; nn += a; x *= p.lac; y *= p.lac; a *= p.gain;
          }
          sum /= nn;
          return mode === 'ridged' ? sum : mode === 'turb' ? sum * 1.6 : 0.5 + 0.65 * sum;
        };
      }
    },
    voronoi: {
      name: 'Voronoi (cellulaire)', cat: 'Bruit',
      params: [SEED,
        { k: 'feature', l: 'Rendu', t: 'select', d: 'cells', key: true, options: [['f1', 'Distance au point (F1)'], ['f2', 'Seconde distance (F2)'], ['edges', 'Bords des cellules (F2 − F1)'], ['cells', 'Cellules plates'], ['dome', 'Cellules bombées']] },
        { k: 'metric', l: 'Distance', t: 'select', d: 'euclid', key: true, options: [['euclid', 'Euclidienne (ronde)'], ['manhattan', 'Manhattan (losanges)'], ['cheb', 'Chebyshev (carrés)']] },
        R('freq', 'Nombre de cellules (fréquence)', 1, 40, 0.1, 7, { key: true }),
        R('jitter', 'Irrégularité', 0, 1, 0.01, 0.9, { key: true }),
        R('oct', 'Octaves', 1, 6, 1, 1),
        R('gain', 'Poids des octaves', 0.2, 0.8, 0.01, 0.5),
        R('lac', 'Lacunarité', 1.5, 3, 0.01, 2),
        R('warp', 'Distorsion', 0, 2, 0.01, 0),
        R('ox', 'Décalage X', -10, 10, 0.01, 0), R('oy', 'Décalage Y', -10, 10, 0.01, 0)],
      make: function (p, s, ctx) {
        var cd = coords(p, s, ctx), q = { x: 0, y: 0 }, oct = Math.round(p.oct), met = p.metric, feat = p.feature;
        function cell(x, y, sd) {
          var ix = Math.floor(x), iy = Math.floor(y), f1 = 9, f2 = 9, id = 0;
          for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
            var cx = ix + dx, cy = iy + dy;
            var ex = cx + 0.5 + (hash(cx, cy, sd) - 0.5) * p.jitter - x, ey = cy + 0.5 + (hash(cx, cy, sd + 1) - 0.5) * p.jitter - y;
            var d = met === 'manhattan' ? (Math.abs(ex) + Math.abs(ey)) * 0.7 : met === 'cheb' ? Math.max(Math.abs(ex), Math.abs(ey)) : Math.sqrt(ex * ex + ey * ey);
            if (d < f1) { f2 = f1; f1 = d; id = hash(cx, cy, sd + 2); } else if (d < f2) f2 = d;
          }
          switch (feat) {
            case 'f1': return Math.min(1, f1 / 0.85);
            case 'f2': return Math.min(1, f2 / 1.15);
            case 'edges': return Math.min(1, (f2 - f1) * 1.6);
            case 'dome': return id * 0.4 + 0.6 * Math.max(0, 1 - f1 / 0.8);
            default: return id;
          }
        }
        return function (X, Y) {
          cd(X, Y, q);
          var x = q.x, y = q.y, sum = 0, a = 1, nn = 0;
          for (var o = 0; o < oct; o++) { sum += cell(x, y, s + o * 131) * a; nn += a; x *= p.lac; y *= p.lac; a *= p.gain; }
          return sum / nn;
        };
      }
    },
    collines: {
      name: 'Collines', cat: 'Terrain', params: NP({ freq: 2, oct: 6, warp: 0.3 }),
      make: function (p, s, ctx) {
        var F = fbm(simplex(s), p.oct, p.lac, p.gain), cd = coords(p, s, ctx), q = { x: 0, y: 0 };
        return function (X, Y) { cd(X, Y, q); return 0.5 + 0.7 * F(q.x, q.y); };
      }
    },
    montagnes: {
      name: 'Montagnes', cat: 'Terrain',
      params: NP({ freq: 2.2, oct: 8, warp: 0.25 }).concat([
        R('sharp', 'Netteté des crêtes', 0.5, 4, 0.01, 2, { key: true }),
        R('valley', 'Profondeur des vallées', 0, 1.5, 0.01, 0.5, { key: true })]),
      make: function (p, s, ctx) {
        var n = simplex(s), oct = Math.round(p.oct), cd = coords(p, s, ctx), q = { x: 0, y: 0 };
        return function (X, Y) {
          cd(X, Y, q);
          var x = q.x, y = q.y, sum = 0, amp = 1, norm = 0, w = 1;
          for (var o = 0; o < oct; o++) {
            var r = 1 - Math.abs(n(x + o * 19.1, y - o * 7.3));
            r = Math.pow(r, p.sharp) * w;
            sum += r * amp; norm += amp;
            w = r * 1.6; if (w > 1) w = 1;
            x *= p.lac; y *= p.lac; amp *= p.gain;
          }
          return Math.pow(sum / norm * 1.5, 1 + p.valley);
        };
      }
    },
    dunes: {
      name: 'Dunes', cat: 'Terrain',
      params: [SEED,
        R('freq', 'Nombre de dunes', 1, 30, 0.1, 7, { key: true }),
        R('angle', 'Direction du vent (°)', 0, 180, 1, 25, { key: true }),
        R('asym', 'Asymétrie', 0.05, 0.95, 0.01, 0.3, { key: true }),
        R('warp', 'Ondulation', 0, 3, 0.01, 0.9),
        R('vari', 'Variation de hauteur', 0, 1, 0.01, 0.55),
        R('ripple', 'Rides de sable', 0, 1, 0.01, 0.2)],
      make: function (p, s, ctx) {
        var F = fbm(simplex(s), 4, 2, 0.5), n2 = simplex(s + 7), a = p.angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), fr = p.freq * ctx.gs;
        return function (X, Y) {
          var x = X * fr, y = Y * fr, xr = x * ca - y * sa;
          var t = xr + p.warp * F(x * 0.22, y * 0.22);
          var f = t - Math.floor(t);
          var pr = f < p.asym ? f / p.asym : (1 - f) / (1 - p.asym);
          pr = pr * pr * (3 - 2 * pr);
          var mod = 1 - p.vari * (0.5 + 0.5 * F(x * 0.11 + 9, y * 0.11 - 4));
          var rip = 0.5 + 0.5 * Math.sin(xr * 11 + 4 * n2(x * 0.5, y * 0.5));
          return pr * mod * (1 - 0.12 * p.ripple) + rip * 0.12 * p.ripple;
        };
      }
    },
    crateres: {
      name: 'Cratères', cat: 'Terrain',
      params: [SEED,
        R('density', 'Densité de cratères', 1, 20, 0.1, 5, { key: true }),
        R('size', 'Taille', 0.1, 1, 0.01, 0.6, { key: true }),
        R('depth', 'Profondeur', 0, 2, 0.01, 1, { key: true }),
        R('rim', 'Hauteur des bords', 0, 1, 0.01, 0.45),
        R('amount', 'Proportion de cellules', 0.05, 1, 0.01, 0.7),
        R('base', 'Relief de fond', 0, 1, 0.01, 0.35),
        R('freq', 'Échelle du fond', 0.5, 12, 0.05, 3)],
      make: function (p, s, ctx) {
        var F = fbm(simplex(s), 6, 2, 0.5), fr = p.freq * ctx.gs, D = p.density * ctx.gs;
        return function (X, Y) {
          var h = 0.5 + 0.7 * F(X * fr, Y * fr) * p.base;
          for (var L = 0; L < 2; L++) {
            var k = L ? 2.3 : 1, sd = s + L * 977;
            var gx = X * D * k, gy = Y * D * k, ix = Math.floor(gx), iy = Math.floor(gy);
            for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
              var cx = ix + dx, cy = iy + dy;
              if (hash(cx, cy, sd) > p.amount) continue;
              var px = cx + hash(cx, cy, sd + 1), py = cy + hash(cx, cy, sd + 2);
              var r = p.size * (0.25 + 0.6 * hash(cx, cy, sd + 3)) * 0.5;
              var d = Math.sqrt((gx - px) * (gx - px) + (gy - py) * (gy - py)) / r;
              if (d > 1.8) continue;
              var e = (d - 1) / 0.22, c = p.rim * Math.exp(-e * e);
              if (d < 1) c += (d * d - 1) * p.depth;
              h += c * (r / 0.5) * 0.35 / k;
            }
          }
          return h;
        };
      }
    },
    canyons: {
      name: 'Canyons', cat: 'Terrain',
      params: NP({ freq: 1.5, oct: 5, warp: 0.6 }).concat([
        R('width', 'Largeur des gorges', 0.02, 0.5, 0.005, 0.14, { key: true }),
        R('depth', 'Profondeur', 0, 1, 0.01, 0.75, { key: true }),
        R('steps', 'Strates', 0, 12, 1, 4),
        R('meander', 'Méandres', 0, 3, 0.01, 1.2)]),
      make: function (p, s, ctx) {
        var F = fbm(simplex(s), p.oct, p.lac, p.gain), Rv = fbm(simplex(s + 5), 3, 2, 0.5), M = fbm(simplex(s + 9), 2, 2, 0.5);
        var cd = coords(p, s, ctx), q = { x: 0, y: 0 };
        return function (X, Y) {
          cd(X, Y, q);
          var base = 0.5 + 0.7 * F(q.x, q.y);
          var mx = q.x * 0.6 + p.meander * M(q.x * 0.3, q.y * 0.3);
          var wall = sstep(0, p.width, Math.abs(Rv(mx, q.y * 0.6)));
          if (p.steps > 0) { var st = wall * p.steps, fl = Math.floor(st); wall = (fl + sstep(0.65, 1, st - fl)) / p.steps; }
          var plateau = 0.55 + 0.35 * base, floor = 0.1 + 0.1 * base;
          return plateau - p.depth * (plateau - floor) * (1 - wall);
        };
      }
    },
    terrasses: {
      name: 'Plateaux et terrasses', cat: 'Terrain',
      params: NP({ freq: 2, oct: 5, warp: 0.3 }).concat([
        R('steps', 'Nombre de paliers', 2, 24, 1, 8, { key: true }),
        R('soft', 'Douceur des marches', 0, 1, 0.01, 0.25, { key: true })]),
      make: function (p, s, ctx) {
        var F = fbm(simplex(s), p.oct, p.lac, p.gain), cd = coords(p, s, ctx), q = { x: 0, y: 0 };
        return function (X, Y) { cd(X, Y, q); return terrace(c01(0.5 + 0.7 * F(q.x, q.y)), p.steps, p.soft); };
      }
    },
    archipel: {
      name: 'Îles et archipels', cat: 'Terrain',
      params: NP({ freq: 3, oct: 7, warp: 0.4 }).concat([
        R('sea', 'Niveau de la mer', 0, 0.9, 0.01, 0.45, { key: true }),
        R('falloff', 'Regroupement au centre', 0, 1, 0.01, 0.6, { key: true }),
        R('coast', 'Pente des côtes', 0.2, 2, 0.01, 0.8)]),
      make: function (p, s, ctx) {
        var F = fbm(simplex(s), p.oct, p.lac, p.gain), cd = coords(p, s, ctx), q = { x: 0, y: 0 };
        return function (X, Y, CX, CY) {
          cd(X, Y, q);
          var v = 0.5 + 0.7 * F(q.x, q.y);
          var m = 1 - sstep(0.3, 1.05, Math.sqrt(CX * CX + CY * CY));
          v = v * (1 - p.falloff + p.falloff * m);
          var h = Math.max(0, v - p.sea) / (1 - p.sea);
          return Math.pow(h, p.coast);
        };
      }
    },
    rocheux: {
      name: 'Surface rocheuse', cat: 'Surface',
      params: [SEED,
        R('freq', 'Taille des blocs (fréquence)', 2, 40, 0.1, 9, { key: true }),
        R('crack', 'Largeur des fissures', 0, 0.5, 0.005, 0.08, { key: true }),
        R('vari', 'Variation des blocs', 0, 1, 0.01, 0.6, { key: true }),
        R('bevel', 'Bombé des blocs', 0, 1, 0.01, 0.4),
        R('detail', 'Grain', 0, 1, 0.01, 0.3),
        R('jitter', 'Irrégularité', 0, 1, 0.01, 0.9),
        R('warp', 'Distorsion', 0, 2, 0.01, 0.3)],
      make: function (p, s, ctx) {
        var F = fbm(simplex(s + 3), 5, 2.1, 0.5), cd = coords({ freq: p.freq, warp: p.warp * 0.5 }, s, ctx), q = { x: 0, y: 0 };
        return function (X, Y) {
          cd(X, Y, q);
          var x = q.x, y = q.y, ix = Math.floor(x), iy = Math.floor(y), f1 = 9, f2 = 9, id = 0;
          for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
            var cx = ix + dx, cy = iy + dy;
            var px = cx + 0.5 + (hash(cx, cy, s) - 0.5) * p.jitter, py = cy + 0.5 + (hash(cx, cy, s + 1) - 0.5) * p.jitter;
            var d = (x - px) * (x - px) + (y - py) * (y - py);
            if (d < f1) { f2 = f1; f1 = d; id = hash(cx, cy, s + 2); } else if (d < f2) f2 = d;
          }
          var e = Math.sqrt(f2) - Math.sqrt(f1);
          var crack = sstep(0, p.crack + 1e-4, e);
          var top = 0.55 + 0.45 * (id * p.vari + (1 - p.vari) * 0.5);
          var dome = 1 - p.bevel * 0.6 * Math.sqrt(f1);
          return top * dome * (0.3 + 0.7 * crack) + p.detail * 0.18 * F(x * 3, y * 3);
        };
      }
    },
    volcan: {
      name: 'Volcan', cat: 'Terrain',
      params: [SEED,
        R('radius', 'Rayon de la base', 0.2, 1.6, 0.01, 0.85, { key: true }),
        R('slope', 'Profil des pentes', 0.4, 3, 0.01, 1.5, { key: true }),
        R('crater', 'Taille du cratère', 0, 0.6, 0.01, 0.17, { key: true }),
        R('cdepth', 'Profondeur du cratère', 0, 1, 0.01, 0.55),
        R('ridges', 'Ravines', 0, 1, 0.01, 0.55),
        R('rfreq', 'Nombre de ravines', 2, 40, 0.5, 14),
        R('ground', 'Relief du sol', 0, 1, 0.01, 0.35),
        R('px', 'Position X', -1, 1, 0.01, 0), R('py', 'Position Y', -1, 1, 0.01, 0)],
      make: function (p, s, ctx) {
        var n = simplex(s), G = fbm(simplex(s + 4), 6, 2, 0.5);
        return function (X, Y, CX, CY) {
          var dx = CX - p.px, dy = CY - p.py, r = Math.sqrt(dx * dx + dy * dy) / p.radius, a = Math.atan2(dy, dx);
          var k = p.rfreq * 0.25, rn = 1 - Math.abs(n(Math.cos(a) * k + r * 2.5, Math.sin(a) * k));
          var rr = r * (1 + 0.08 * G(X * 3, Y * 3));
          var cone = Math.pow(Math.max(0, 1 - rr), p.slope);
          if (rr < p.crater) { var rim = Math.pow(1 - p.crater, p.slope), t = rr / p.crater; cone = rim - p.cdepth * rim * (1 - t * t); }
          cone *= 1 - p.ridges * 0.3 * (1 - rn) * sstep(0.05, 0.4, r);
          return cone * 0.85 + (0.5 + 0.6 * G(X * 4 * ctx.gs, Y * 4 * ctx.gs)) * p.ground * 0.2;
        };
      }
    },
    organique: {
      name: 'Relief organique', cat: 'Abstrait',
      params: [SEED,
        R('freq', 'Échelle (fréquence)', 0.25, 10, 0.05, 1.8, { key: true }),
        R('oct', 'Détails (octaves)', 1, 8, 1, 4, { key: true }),
        R('strength', 'Torsion', 0, 6, 0.01, 3, { key: true }),
        R('gain', 'Rugosité', 0.2, 0.8, 0.01, 0.5),
        R('lac', 'Lacunarité', 1.5, 3, 0.01, 2),
        R('ox', 'Décalage X', -10, 10, 0.01, 0), R('oy', 'Décalage Y', -10, 10, 0.01, 0)],
      make: function (p, s, ctx) {
        var F = fbm(simplex(s), p.oct, p.lac, p.gain), st = p.strength, fr = p.freq * ctx.gs;
        return function (X, Y) {
          var x = X * fr + p.ox, y = Y * fr + p.oy;
          var qx = F(x, y), qy = F(x + 5.2, y + 1.3);
          var rx = F(x + st * qx + 1.7, y + st * qy + 9.2), ry = F(x + st * qx + 8.3, y + st * qy + 2.8);
          return 0.5 + 0.8 * F(x + st * rx, y + st * ry);
        };
      }
    },
    abstrait: {
      name: 'Motifs abstraits', cat: 'Abstrait',
      params: [SEED,
        { k: 'pattern', l: 'Motif', t: 'select', d: 'ondes', key: true, options: [['ondes', 'Ondes concentriques'], ['interf', 'Interférences'], ['spirale', 'Spirale'], ['grille', 'Grille de bosses'], ['rayures', 'Rayures']] },
        R('freq', 'Fréquence', 1, 40, 0.1, 8, { key: true }),
        R('noise', 'Perturbation', 0, 2, 0.01, 0.3, { key: true }),
        R('sharp', 'Profil', 0.2, 4, 0.01, 1),
        R('px', 'Centre X', -1, 1, 0.01, 0), R('py', 'Centre Y', -1, 1, 0.01, 0)],
      make: function (p, s, ctx) {
        var N = fbm(simplex(s), 3, 2, 0.5), fr = p.freq * ctx.gs, PI = Math.PI;
        return function (X, Y, CX, CY) {
          var dx = CX - p.px, dy = CY - p.py, r = Math.sqrt(dx * dx + dy * dy), nz = p.noise * N(X * 3, Y * 3) * 3, v;
          switch (p.pattern) {
            case 'interf':
              var d1 = Math.hypot(CX + 0.45, CY), d2 = Math.hypot(CX - 0.4, CY - 0.25);
              v = 0.5 * (Math.sin(d1 * fr * PI + nz) + Math.sin(d2 * fr * PI + nz)); break;
            case 'spirale': v = Math.sin(Math.atan2(dy, dx) * 5 + r * fr * PI + nz); break;
            case 'grille': v = Math.sin(CX * fr * PI + nz) * Math.sin(CY * fr * PI + nz); break;
            case 'rayures': v = Math.sin((CX * 0.87 + CY * 0.5) * fr * PI + nz); break;
            default: v = Math.sin(r * fr * PI + nz);
          }
          return Math.pow(0.5 + 0.5 * v, p.sharp);
        };
      }
    },
    primitive: {
      name: 'Forme primitive', cat: 'Forme',
      params: [
        { k: 'shape', l: 'Forme', t: 'select', d: 'dome', key: true, options: [['dome', 'Dôme'], ['cone', 'Cône'], ['pyramide', 'Pyramide'], ['anneau', 'Anneau'], ['plateau', 'Plateau'], ['pente', 'Pente linéaire']] },
        R('size', 'Taille', 0.05, 1.6, 0.01, 0.7, { key: true }),
        R('soft', 'Douceur', 0, 1, 0.01, 0.4, { key: true }),
        R('angle', 'Angle (pente)', 0, 360, 1, 0),
        R('px', 'Position X', -1, 1, 0.01, 0), R('py', 'Position Y', -1, 1, 0.01, 0)],
      make: function (p) {
        var a = p.angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
        return function (X, Y, CX, CY) {
          var dx = CX - p.px, dy = CY - p.py, r = Math.sqrt(dx * dx + dy * dy) / p.size, v;
          switch (p.shape) {
            case 'cone': v = Math.max(0, 1 - r); break;
            case 'pyramide': v = Math.max(0, 1 - Math.max(Math.abs(dx), Math.abs(dy)) / p.size); break;
            case 'anneau': var e = (r - 0.8) / (0.08 + p.soft * 0.4); return Math.exp(-e * e);
            case 'plateau': return 1 - sstep(Math.max(0, 1 - p.soft * 0.9 - 0.02), 1, r);
            case 'pente': return c01(0.5 + 0.5 * (dx * ca + dy * sa) / p.size);
            default: v = r < 1 ? Math.sqrt(1 - r * r) : 0;
          }
          return v + (v * v * (3 - 2 * v) - v) * p.soft;
        };
      }
    }
  };

  var IMAGE = [
    { k: 'fit', l: 'Cadrage', t: 'select', d: 'cover', key: true, options: [['cover', 'Remplir (recadre)'], ['stretch', 'Étirer']] },
    R('black', 'Point noir', 0, 1, 0.005, 0), R('white', 'Point blanc', 0, 1, 0.005, 1),
    R('contrast', 'Contraste', 0, 3, 0.01, 1, { key: true }), R('bright', 'Luminosité', -1, 1, 0.01, 0, { key: true }),
    R('gamma', 'Gamma', 0.1, 4, 0.01, 1, { key: true }),
    R('blur', 'Lissage', 0, 0.05, 0.0005, 0, { key: true }),
    R('sharpen', 'Netteté', 0, 3, 0.01, 0)];

  var FILTER = [
    { k: 'op', l: 'Opération', t: 'select', d: 'lisser', key: true, options: [['lisser', 'Lisser'], ['terrasses', 'Terrasses'], ['courbe', 'Courbe (gamma)'], ['niveaux', 'Niveaux'], ['inverser', 'Inverser']] },
    R('radius', 'Rayon (part de la largeur)', 0.001, 0.05, 0.0005, 0.008, { key: true, when: ['op', ['lisser']] }),
    R('steps', 'Nombre de paliers', 2, 30, 1, 8, { key: true, when: ['op', ['terrasses']] }),
    R('soft', 'Douceur des marches', 0, 1, 0.01, 0.25, { key: true, when: ['op', ['terrasses']] }),
    R('gamma', 'Gamma', 0.2, 4, 0.01, 1.4, { key: true, when: ['op', ['courbe']] }),
    R('lo', 'Bas', 0, 1, 0.005, 0.1, { key: true, when: ['op', ['niveaux']] }),
    R('hi', 'Haut', 0, 1, 0.005, 0.9, { key: true, when: ['op', ['niveaux']] })];

  var GLOBAL = [
    R('scale', 'Échelle globale', 0.25, 4, 0.01, 1, { key: true }),
    R('curve', 'Courbe de hauteur', 0.3, 3, 0.01, 1, { key: true }),
    { k: 'normalize', l: 'Normaliser (0 à 1)', t: 'bool', d: true },
    { k: 'invert', l: 'Inverser le relief', t: 'bool', d: false },
    { k: 'seamless', l: 'Raccord sans couture (seamless)', t: 'bool', d: false, key: true },
    R('band', 'Largeur de la zone de raccord', 0.05, 0.45, 0.01, 0.2, { when: ['seamless', [true]], key: true })];

  function defaults(defs) { var o = {}; defs.forEach(function (d) { o[d.k] = d.d; }); return o; }
  function withDefaults(defs, p) { var o = defaults(defs); for (var k in p) o[k] = p[k]; return o; }

  // ---------- Filtres d'image ----------
  function ix(i, n, wrap) { return wrap ? ((i % n) + n) % n : (i < 0 ? 0 : i >= n ? n - 1 : i); }
  function boxH(src, dst, w, h, r, wrap) {
    var inv = 1 / (2 * r + 1);
    for (var y = 0; y < h; y++) {
      var o = y * w, s = 0, k;
      for (k = -r; k <= r; k++) s += src[o + ix(k, w, wrap)];
      for (var x = 0; x < w; x++) {
        dst[o + x] = s * inv;
        s += src[o + ix(x + r + 1, w, wrap)] - src[o + ix(x - r, w, wrap)];
      }
    }
  }
  function boxV(src, dst, w, h, r, wrap) {
    var inv = 1 / (2 * r + 1);
    for (var x = 0; x < w; x++) {
      var s = 0, k;
      for (k = -r; k <= r; k++) s += src[ix(k, h, wrap) * w + x];
      for (var y = 0; y < h; y++) {
        dst[y * w + x] = s * inv;
        s += src[ix(y + r + 1, h, wrap) * w + x] - src[ix(y - r, h, wrap) * w + x];
      }
    }
  }
  // Flou quasi gaussien (3 passes de boîte). Rayon exprimé en fraction de la largeur → identique en aperçu et à l'export.
  // wrap = vrai en mode seamless : le flou traverse les bords pour ne pas casser le raccord.
  function blur(a, w, h, frac, wrap) { return blurPx(a, w, h, Math.round(frac * Math.max(w, h) / 1.7), wrap); }
  function blurPx(a, w, h, r, wrap) {
    if (r < 1) return a;
    var t = new Float32Array(a.length);
    for (var i = 0; i < 3; i++) { boxH(a, t, w, h, r, wrap); boxV(t, a, w, h, r, wrap); }
    return a;
  }
  function minmax(a) { var mn = Infinity, mx = -Infinity; for (var i = 0; i < a.length; i++) { var v = a[i]; if (v < mn) mn = v; if (v > mx) mx = v; } return [mn, mx]; }

  function applyFilter(acc, w, h, p, wrap) {
    var out = new Float32Array(acc), i, n = out.length;
    switch (p.op) {
      case 'lisser': blur(out, w, h, p.radius, wrap); break;
      case 'terrasses': for (i = 0; i < n; i++) out[i] = terrace(out[i], p.steps, p.soft); break;
      case 'courbe': for (i = 0; i < n; i++) out[i] = Math.pow(Math.max(0, out[i]), p.gamma); break;
      case 'niveaux': var d = (p.hi - p.lo) || 1e-6; for (i = 0; i < n; i++) out[i] = c01((out[i] - p.lo) / d); break;
      case 'inverser': var m = minmax(out), sm = m[0] + m[1]; for (i = 0; i < n; i++) out[i] = sm - out[i]; break;
    }
    return out;
  }

  // Échantillonneur d'image exprimé dans les mêmes coordonnées que les générateurs (X = u·ax).
  // En mode seamless, l'image est lue sur [band, 1] : la bande retirée sert de matière au raccord.
  function imageFn(img, p, w, h, ax, ay, sm, band) {
    if (!img) return function () { return 0; };
    var iw = img.w, ih = img.h, d = img.data, sx = 1, sy = 1, ox = 0, oy = 0;
    if (p.fit === 'cover') {
      var ra = w / h, ri = iw / ih;
      if (ri > ra) { sx = ra / ri; ox = (1 - sx) / 2; } else { sy = ri / ra; oy = (1 - sy) / 2; }
    }
    var span = (p.white - p.black) || 1e-6, ig = 1 / p.gamma;
    return function (X, Y) {
      var u = X / ax, v = Y / ay;
      if (sm) { u = band + u * (1 - band); v = band + v * (1 - band); }
      var fx = (ox + sx * u) * iw - 0.5, x0 = Math.floor(fx), tx = fx - x0;
      var fy = (oy + sy * v) * ih - 0.5, y0 = Math.floor(fy), ty = fy - y0;
      var xa = x0 < 0 ? 0 : x0 > iw - 1 ? iw - 1 : x0, xb = x0 + 1 < 0 ? 0 : x0 + 1 > iw - 1 ? iw - 1 : x0 + 1;
      var ya = y0 < 0 ? 0 : y0 > ih - 1 ? ih - 1 : y0, yb = y0 + 1 < 0 ? 0 : y0 + 1 > ih - 1 ? ih - 1 : y0 + 1;
      var a = d[ya * iw + xa] + (d[ya * iw + xb] - d[ya * iw + xa]) * tx;
      var b = d[yb * iw + xa] + (d[yb * iw + xb] - d[yb * iw + xa]) * tx;
      var val = c01((a + (b - a) * ty - p.black) / span);
      val = c01((val - 0.5) * p.contrast + 0.5 + p.bright);
      return Math.pow(val, ig);
    };
  }

  // Remplit une couche. En mode seamless, la bande de bord mélange le relief avec sa copie décalée
  // d'une période : la valeur et la pente au bord droit égalent celles du bord gauche (idem haut/bas).
  function fillLayer(L, w, h, f, ax, ay, sm, band, prog) {
    for (var y = 0; y < h; y++) {
      var v = (y + 0.5) / h, Y = v * ay, CY = (v - 0.5) * 2 * ay, av = sm ? sstep(1 - band, 1, v) : 0, o = y * w;
      for (var x = 0; x < w; x++) {
        var u = (x + 0.5) / w, X = u * ax, CX = (u - 0.5) * 2 * ax, r = f(X, Y, CX, CY);
        if (sm) {
          var au = sstep(1 - band, 1, u);
          if (au > 0 || av > 0) {
            r *= (1 - au) * (1 - av);
            if (au > 0) r += f(X - ax, Y, CX - 2 * ax, CY) * au * (1 - av);
            if (av > 0) r += f(X, Y - ay, CX, CY - 2 * ay) * (1 - au) * av;
            if (au > 0 && av > 0) r += f(X - ax, Y - ay, CX - 2 * ax, CY - 2 * ay) * au * av;
          }
        }
        L[o + x] = r;
      }
      if (prog && (y & 63) === 0) prog(y / h);
    }
  }

  function isFx(l) { return l.kind === 'filter' || l.kind === 'erosion' || l.kind === 'sculpt'; }
  function isBase(layers, li) {
    for (var i = 0; i < li; i++) if (!isFx(layers[i])) return false;
    return !isFx(layers[li]);
  }
  function maskW(a, m) {
    var s = Math.max(m.soft, 0.001);
    return sstep(m.lo - s, m.lo + s, a) * (1 - sstep(m.hi - s, m.hi + s, a));
  }

  function blendInto(acc, L, ly, PM) {
    var k = ly.intensity, k1 = Math.min(k, 1), mode = ly.blend, M = ly.mask && ly.mask.on ? ly.mask : null, n = acc.length;
    for (var i = 0; i < n; i++) {
      var a = acc[i], b = L[i], f = (M ? maskW(a, M) : 1) * (PM ? PM[i] : 1), w = k * f, w1 = k1 * f, r;
      switch (mode) {
        case 'add': r = a + b * w; break;
        case 'sub': r = a - b * w; break;
        case 'mul': r = a + (a * b - a) * w1; break;
        case 'max': r = a + (Math.max(a, b) - a) * w1; break;
        case 'min': r = a + (Math.min(a, b) - a) * w1; break;
        case 'mask': r = a + (a * c01(b) - a) * w1; break;
        default: r = a + (b - a) * w1;
      }
      acc[i] = r;
    }
  }

  // ---------- Érosion ----------
  // La simulation tourne toujours sur une grille de taille fixe (« résolution de simulation »), puis la
  // différence avant/après est rééchantillonnée sur la map : l'aperçu et l'export donnent la même érosion.
  function W_(when) { return { when: ['op', [when]] }; }
  function wk(when) { return { key: true, when: ['op', [when]] }; }
  var EROSION = [
    { k: 'op', l: 'Modèle', t: 'select', d: 'hydraulique', key: true, options: [['hydraulique', 'Hydraulique (pluie, rigoles)'], ['thermique', 'Thermique (éboulis, talus)']] },
    { k: 'quality', l: 'Résolution de simulation', t: 'select', d: '512', options: [['256', '256 (rapide)'], ['512', '512'], ['1024', '1024 (fin, plus lent)']] },
    R('relief', 'Hauteur du relief simulé', 0.02, 0.5, 0.01, 0.15),
    { k: 'seed', l: 'Graine', t: 'seed', d: 1, key: true, when: ['op', ['hydraulique']] },
    R('amount', 'Quantité de pluie', 0.1, 4, 0.05, 1, wk('hydraulique')),
    R('erode', 'Force d\'érosion', 0.05, 1, 0.01, 0.3, wk('hydraulique')),
    R('deposit', 'Dépôt de sédiments', 0.05, 1, 0.01, 0.3, W_('hydraulique')),
    R('capacity', 'Capacité de transport', 1, 10, 0.1, 4, W_('hydraulique')),
    R('inertia', 'Inertie des gouttes', 0, 0.9, 0.01, 0.05, W_('hydraulique')),
    R('evaporate', 'Évaporation', 0.005, 0.1, 0.001, 0.02, W_('hydraulique')),
    R('life', 'Durée de vie des gouttes', 10, 80, 1, 30, W_('hydraulique')),
    R('brush', 'Largeur des rigoles', 0.001, 0.02, 0.0005, 0.004, W_('hydraulique')),
    R('angle', 'Angle de talus (°)', 5, 60, 1, 30, wk('thermique')),
    R('strength', 'Intensité', 0.1, 4, 0.05, 1, wk('thermique'))];

  function sampleBil(a, w, h, x, y, wrap) {
    var x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0;
    var xa = ix(x0, w, wrap), xb = ix(x0 + 1, w, wrap), ya = ix(y0, h, wrap), yb = ix(y0 + 1, h, wrap);
    var p = a[ya * w + xa] + (a[ya * w + xb] - a[ya * w + xa]) * tx;
    var q = a[yb * w + xa] + (a[yb * w + xb] - a[yb * w + xa]) * tx;
    return p + (q - p) * ty;
  }
  function resample(src, w, h, tw, th, wrap) {
    var f = Math.max(w / tw, h / th), s = src;
    if (f > 1.5) s = blurPx(new Float32Array(src), w, h, Math.round(f / 2), wrap);
    var out = new Float32Array(tw * th);
    for (var y = 0; y < th; y++) for (var x = 0; x < tw; x++)
      out[y * tw + x] = sampleBil(s, w, h, (x + 0.5) * w / tw - 0.5, (y + 0.5) * h / th - 0.5, wrap);
    return out;
  }
  function hydraulic(H, W, Hh, p, wrap, prog) {
    var rnd = mulberry32(((p.seed | 0) * 7919 + 13) >>> 0), n = Math.round(p.amount * W * Hh);
    var R = Math.max(1, Math.round(p.brush * Math.max(W, Hh))), bx = [], by = [], bw = [], sum = 0, dx, dy;
    for (dy = -R; dy <= R; dy++) for (dx = -R; dx <= R; dx++) {
      var dd = Math.sqrt(dx * dx + dy * dy);
      if (dd <= R) { var ww = 1 - dd / (R + 1); bx.push(dx); by.push(dy); bw.push(ww); sum += ww; }
    }
    for (var b = 0; b < bw.length; b++) bw[b] /= sum;
    var inertia = p.inertia, cap = p.capacity, dep = p.deposit, er = p.erode, evap = p.evaporate, life = p.life | 0, grav = 4, minC = 0.01;
    function cell(x, y) { return wrap ? ix(y, Hh, true) * W + ix(x, W, true) : (x < 0 || y < 0 || x >= W || y >= Hh) ? -1 : y * W + x; }
    function hAt(x, y) { return sampleBil(H, W, Hh, x, y, wrap); }
    for (var d = 0; d < n; d++) {
      var px = rnd() * (W - 1), py = rnd() * (Hh - 1), vx = 0, vy = 0, speed = 1, water = 1, sed = 0;
      for (var l = 0; l < life; l++) {
        var cx = Math.floor(px), cy = Math.floor(py), ox = px - cx, oy = py - cy;
        var i00 = cell(cx, cy), i10 = cell(cx + 1, cy), i01 = cell(cx, cy + 1), i11 = cell(cx + 1, cy + 1);
        if (i00 < 0 || i10 < 0 || i01 < 0 || i11 < 0) break;
        var h00 = H[i00], h10 = H[i10], h01 = H[i01], h11 = H[i11];
        var gx = (h10 - h00) * (1 - oy) + (h11 - h01) * oy, gy = (h01 - h00) * (1 - ox) + (h11 - h10) * ox;
        var h = h00 * (1 - ox) * (1 - oy) + h10 * ox * (1 - oy) + h01 * (1 - ox) * oy + h11 * ox * oy;
        vx = vx * inertia - gx * (1 - inertia); vy = vy * inertia - gy * (1 - inertia);
        var len = Math.sqrt(vx * vx + vy * vy);
        if (len < 1e-9) break;
        vx /= len; vy /= len; px += vx; py += vy;
        if (wrap) { px = (px % W + W) % W; py = (py % Hh + Hh) % Hh; }
        else if (px < 0 || py < 0 || px >= W - 1 || py >= Hh - 1) break;
        var dh = hAt(px, py) - h, c = Math.max(-dh * speed * water * cap, minC);
        if (sed > c || dh > 0) {
          var a = dh > 0 ? Math.min(dh, sed) : (sed - c) * dep;
          sed -= a;
          H[i00] += a * (1 - ox) * (1 - oy); H[i10] += a * ox * (1 - oy); H[i01] += a * (1 - ox) * oy; H[i11] += a * ox * oy;
        } else {
          var e = Math.min((c - sed) * er, -dh);
          for (var k = 0; k < bw.length; k++) { var ci = cell(cx + bx[k], cy + by[k]); if (ci >= 0) { var we = e * bw[k]; H[ci] -= we; sed += we; } }
        }
        speed = Math.sqrt(Math.max(0, speed * speed + dh * grav));
        water *= 1 - evap;
      }
      if (prog && (d & 8191) === 0) prog(d / n);
    }
  }
  function thermal(H, W, Hh, p, wrap, prog) {
    var T = Math.tan(p.angle * Math.PI / 180) / 40, it = Math.max(1, Math.round(p.strength * Math.max(W, Hh) / 8)), D = new Float32Array(H.length), k = 0.2;
    for (var t = 0; t < it; t++) {
      D.fill(0);
      for (var y = 0; y < Hh; y++) for (var x = 0; x < W; x++) {
        var i = y * W + x;
        for (var nb = 0; nb < 2; nb++) {
          var nx = nb ? x : x + 1, ny = nb ? y + 1 : y;
          if (!wrap && (nx >= W || ny >= Hh)) continue;
          var j = ix(ny, Hh, wrap) * W + ix(nx, W, wrap), d = H[i] - H[j], m;
          if (d > T) { m = (d - T) * k; D[i] -= m; D[j] += m; }
          else if (-d > T) { m = (-d - T) * k; D[j] -= m; D[i] += m; }
        }
      }
      for (var q = 0; q < H.length; q++) H[q] += D[q];
      if (prog && (t & 7) === 0) prog(t / it);
    }
  }
  function erodeMap(acc, w, h, p, wrap, prog) {
    var S = parseInt(p.quality, 10) || 512, m = Math.max(w, h);
    var sx = Math.max(8, Math.round(S * w / m)), sy = Math.max(8, Math.round(S * h / m));
    var D = resample(acc, w, h, sx, sy, wrap), E = new Float32Array(D), z = p.relief * Math.max(sx, sy) / 40, i;
    for (i = 0; i < E.length; i++) E[i] *= z;
    if (p.op === 'thermique') thermal(E, sx, sy, p, wrap, prog); else hydraulic(E, sx, sy, p, wrap, prog);
    for (i = 0; i < E.length; i++) E[i] = E[i] / z - D[i];
    var out = new Float32Array(acc);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++)
      out[y * w + x] += sampleBil(E, sx, sy, (x + 0.5) * sx / w - 0.5, (y + 0.5) * sy / h - 0.5, wrap);
    return out;
  }

  // ---------- Masques peints ----------
  // Comme la sculpture, le masque est une liste de traits rejouée à la résolution du calcul.
  function dabOffsets(u, v, R, w, h, wrap) {
    if (!wrap) return [[0, 0]];
    var ex = R / w, ey = R / h, ou = [0], ov = [0], o = [];
    if (u < ex) ou.push(1); if (u > 1 - ex) ou.push(-1); if (v < ey) ov.push(1); if (v > 1 - ey) ov.push(-1);
    ou.forEach(function (a) { ov.forEach(function (b) { o.push([a, b]); }); });
    return o;
  }
  function rasterMask(w, h, pm, wrap) {
    var M = new Float32Array(w * h), m = Math.max(w, h);
    M.fill(pm.fill === 'black' ? 0 : 1);
    (pm.strokes || []).forEach(function (st) {
      var R = Math.max(0.75, st.r * m), hard = Math.min(0.95, st.h || 0), target = st.t === 'erase' ? 0 : 1;
      (st.p || []).forEach(function (pt) {
        dabOffsets(pt[0], pt[1], R, w, h, wrap).forEach(function (o) {
          var cx = (pt[0] + o[0]) * w - 0.5, cy = (pt[1] + o[1]) * h - 0.5;
          var x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(w - 1, Math.ceil(cx + R)), y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(h - 1, Math.ceil(cy + R));
          for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
            var d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) / R;
            if (d >= 1) continue;
            var k = st.s * (1 - sstep(hard, 1, d)), i = y * w + x;
            M[i] += (target - M[i]) * k;
          }
        });
      });
    });
    if (pm.feather > 0) blur(M, w, h, pm.feather, wrap);
    if (pm.invert) for (var i = 0; i < M.length; i++) M[i] = 1 - M[i];
    return M;
  }

  // ---------- Sculpture ----------
  // Les traits sont stockés en coordonnées normalisées (u, v dans [0, 1], rayon en part de la largeur)
  // et rejoués à chaque calcul : la sculpture reste modifiable et identique à toutes les résolutions.
  var TOOLS = ['raise', 'lower', 'smooth', 'flatten', 'pinch', 'noise', 'blur', 'clone'];
  function applySculpt(acc, w, h, strokes, wrap) {
    var m = Math.max(w, h);
    (strokes || []).forEach(function (st) {
      if (!st || !st.p || !st.p.length) return;
      var R = Math.max(0.75, st.r * m), hard = Math.min(0.95, st.h || 0), s = st.s, tool = st.t;
      var snap = tool === 'clone' ? new Float32Array(acc) : null;
      var nz = tool === 'noise' ? simplex(st.seed | 0) : null, nf = 0.6 / Math.max(st.r, 1e-3);
      var target = null;
      if (tool === 'flatten') target = sampleBil(acc, w, h, st.p[0][0] * w - 0.5, st.p[0][1] * h - 0.5, wrap);
      st.p.forEach(function (pt) {
        dabOffsets(pt[0], pt[1], R, w, h, wrap).forEach(function (o) { dab(pt[0] + o[0], pt[1] + o[1]); });
      });
      function dab(u, v) {
        var cx = u * w - 0.5, cy = v * h - 0.5;
        var x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(w - 1, Math.ceil(cx + R));
        var y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(h - 1, Math.ceil(cy + R));
        if (x1 < x0 || y1 < y0) return;
        var rw = x1 - x0 + 1, rh = y1 - y0 + 1, reg = null, x, y;
        if (tool === 'smooth' || tool === 'blur' || tool === 'pinch') {
          reg = new Float32Array(rw * rh);
          for (y = 0; y < rh; y++) for (x = 0; x < rw; x++) reg[y * rw + x] = acc[(y0 + y) * w + x0 + x];
          blurPx(reg, rw, rh, Math.max(1, Math.round(R * (tool === 'blur' ? 0.3 : 0.12))), false);
        }
        for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
          var d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) / R;
          if (d >= 1) continue;
          var k = s * (1 - sstep(hard, 1, d)), i = y * w + x, a = acc[i];
          switch (tool) {
            case 'raise': acc[i] = a + k * 0.08; break;
            case 'lower': acc[i] = a - k * 0.08; break;
            case 'flatten': acc[i] = a + (target - a) * k * 0.5; break;
            case 'smooth': case 'blur': acc[i] = a + (reg[(y - y0) * rw + x - x0] - a) * Math.min(1, k); break;
            case 'pinch': acc[i] = a + (a - reg[(y - y0) * rw + x - x0]) * k * 0.6; break;
            case 'noise': acc[i] = a + k * 0.12 * nz((x + 0.5) / m * nf, (y + 0.5) / m * nf); break;
            case 'clone': acc[i] = a + (sampleBil(snap, w, h, x + st.o[0] * w, y + st.o[1] * h, wrap) - a) * Math.min(1, k); break;
          }
        }
      }
    });
    return acc;
  }

  // ---------- Composition de la pile ----------
  // cache (facultatif) : garde l'état cumulé après chaque couche ; seules les couches modifiées
  // et celles situées au-dessus sont recalculées.
  function compute(job, imgs, onProgress, cache) {
    var w = job.w, h = job.h, g = withDefaults(GLOBAL, job.global || {}), N = w * h;
    var m = Math.max(w, h), ax = w / m, ay = h / m, ctx = { gs: g.scale }, sm = !!g.seamless, band = g.band;
    var layers = job.layers.filter(function (l) { return l.enabled; });
    var nL = layers.length || 1, keys = [], key = [w, h, g.scale, g.seedOffset | 0, sm ? band : 0].join(',');
    layers.forEach(function (ly) { var c = {}; for (var k in ly) if (k !== 'name') c[k] = ly[k]; key += '|' + JSON.stringify(c); keys.push(key); });
    var start = 0, acc;
    if (cache) {
      while (start < layers.length && cache.entries[start] && cache.entries[start].key === keys[start]) start++;
      acc = start > 0 ? new Float32Array(cache.entries[start - 1].acc) : new Float32Array(N);
      cache.entries.length = start;
    } else acc = new Float32Array(N);
    var L = new Float32Array(N);
    for (var li = start; li < layers.length; li++) {
      var ly = layers[li], PM = ly.pmask && ly.pmask.on ? rasterMask(w, h, ly.pmask, sm) : null, prog = onProgress ? (function (base) { return function (p) { onProgress((base + p) / nL); }; })(li) : null;
      if (ly.kind === 'filter' || ly.kind === 'erosion' || ly.kind === 'sculpt') {
        var out = ly.kind === 'filter' ? applyFilter(acc, w, h, withDefaults(FILTER, ly.params), sm)
          : ly.kind === 'erosion' ? erodeMap(acc, w, h, withDefaults(EROSION, ly.params), sm, prog)
          : applySculpt(new Float32Array(acc), w, h, ly.strokes, sm);
        blendInto(acc, out, { intensity: ly.intensity, blend: 'normal', mask: ly.mask }, PM);
      } else {
        if (ly.kind === 'image') {
          var ip = withDefaults(IMAGE, ly.params);
          fillLayer(L, w, h, imageFn(imgs[ly.imgId], ip, w, h, ax, ay, sm, band), ax, ay, sm, band, prog);
          if (ip.blur > 0) blur(L, w, h, ip.blur, sm);
          if (ip.sharpen > 0) { var b2 = blur(new Float32Array(L), w, h, 0.004, sm); for (var q = 0; q < N; q++) L[q] += (L[q] - b2[q]) * ip.sharpen; }
        } else {
          var G = GENS[ly.type] || GENS.collines, p = withDefaults(G.params, ly.params);
          fillLayer(L, w, h, G.make(p, ((p.seed | 0) + (g.seedOffset | 0)) | 0, ctx), ax, ay, sm, band, prog);
        }
        if (ly.invert) for (var i = 0; i < N; i++) L[i] = 1 - L[i];
        // La première couche active (hors filtre) est la base : elle pose le relief, quel que soit son mode de fusion.
        if (isBase(layers, li)) { for (var b0 = 0; b0 < N; b0++) acc[b0] = L[b0] * ly.intensity * (PM ? PM[b0] : 1); }
        else blendInto(acc, L, ly, PM);
      }
      if (cache) cache.entries[li] = { key: keys[li], acc: new Float32Array(acc) };
      if (onProgress) onProgress((li + 1) / nL);
    }
    var mm = minmax(acc), mn = mm[0], mx = mm[1], j;
    if (g.normalize && mx > mn) { var sc = 1 / (mx - mn); for (j = 0; j < N; j++) acc[j] = (acc[j] - mn) * sc; }
    else for (j = 0; j < N; j++) acc[j] = c01(acc[j]);
    if (g.invert) for (j = 0; j < N; j++) acc[j] = 1 - acc[j];
    if (g.curve !== 1) for (j = 0; j < N; j++) acc[j] = Math.pow(acc[j], g.curve);
    return { data: acc, min: mn, max: mx, recomputed: layers.length - start, total: layers.length };
  }

  // ---------- Maps dérivées ----------
  var MAPS = {
    height: { name: 'Height map', short: 'height', params: [] },
    normal: { name: 'Normal map', short: 'normal', params: [
      R('strength', 'Intensité', 0.1, 4, 0.01, 1),
      { k: 'conv', l: 'Convention', t: 'select', d: 'gl', options: [['gl', 'OpenGL (Blender, Unity, Godot)'], ['dx', 'DirectX (Unreal)']] }] },
    slope: { name: 'Pente', short: 'slope', params: [] },
    curvature: { name: 'Courbure', short: 'curvature', params: [R('radius', 'Rayon d\'analyse', 0.002, 0.05, 0.001, 0.01), R('gain', 'Contraste', 0.1, 10, 0.1, 2)] },
    ao: { name: 'Occlusion ambiante', short: 'ao', params: [R('radius', 'Rayon', 0.005, 0.15, 0.005, 0.04), R('strength', 'Intensité', 0.1, 5, 0.05, 1.5)] },
    hmask: { name: 'Masque d\'altitude', short: 'heightmask', params: [R('lo', 'Altitude minimale', 0, 1, 0.01, 0.5), R('hi', 'Altitude maximale', 0, 1, 0.01, 1), R('soft', 'Transition', 0, 0.5, 0.01, 0.05)] },
    smask: { name: 'Masque de pente', short: 'slopemask', params: [R('min', 'Pente minimale (°)', 0, 90, 1, 30), R('max', 'Pente maximale (°)', 0, 90, 1, 90), R('soft', 'Transition (°)', 0, 30, 1, 5)] },
    cavity: { name: 'Masque de cavités', short: 'cavity', params: [R('radius', 'Rayon d\'analyse', 0.002, 0.05, 0.001, 0.008), R('gain', 'Contraste', 0.1, 10, 0.1, 3)] }
  };
  // zscale : hauteur du relief exprimée en largeur de map (0.25 = le point le plus haut vaut un quart de la largeur).
  function derive(type, H, w, h, p, zscale, wrap) {
    var N = w * h, m = Math.max(w, h), k = zscale * m / 2, out, x, y, i = 0, dx, dy;
    p = withDefaults((MAPS[type] || MAPS.height).params, p || {});
    function at(x, y) { return H[ix(y, h, wrap) * w + ix(x, w, wrap)]; }
    function band(v, lo, hi, s, top) {
      s = Math.max(s, 1e-4);
      var a = lo <= 0 ? 1 : sstep(lo - s, lo + s, v), b = hi >= top ? 1 : 1 - sstep(hi - s, hi + s, v);
      return a * b;
    }
    if (type === 'normal') {
      out = new Float32Array(N * 3);
      var sY = p.conv === 'dx' ? -1 : 1;
      for (y = 0; y < h; y++) for (x = 0; x < w; x++, i++) {
        dx = (at(x + 1, y) - at(x - 1, y)) * k * p.strength; dy = (at(x, y + 1) - at(x, y - 1)) * k * p.strength;
        var nl = 1 / Math.sqrt(dx * dx + dy * dy + 1);
        out[i * 3] = 0.5 + 0.5 * (-dx * nl); out[i * 3 + 1] = 0.5 + 0.5 * (dy * sY * nl); out[i * 3 + 2] = 0.5 + 0.5 * nl;
      }
      return out;
    }
    out = new Float32Array(N);
    if (type === 'slope' || type === 'smask') {
      for (y = 0; y < h; y++) for (x = 0; x < w; x++, i++) {
        dx = (at(x + 1, y) - at(x - 1, y)) * k; dy = (at(x, y + 1) - at(x, y - 1)) * k;
        var ang = Math.atan(Math.sqrt(dx * dx + dy * dy));
        out[i] = type === 'slope' ? ang / (Math.PI / 2) : band(ang * 180 / Math.PI, p.min, p.max, p.soft, 90);
      }
      return out;
    }
    if (type === 'hmask') { for (i = 0; i < N; i++) out[i] = band(H[i], p.lo, p.hi, p.soft, 1); return out; }
    if (type === 'curvature' || type === 'cavity') {
      var b = blur(new Float32Array(H), w, h, p.radius, wrap), f = zscale * p.gain / p.radius;
      for (i = 0; i < N; i++) {
        var d = (H[i] - b[i]) * f;
        out[i] = type === 'curvature' ? 0.5 + 0.5 * Math.tanh(d) : Math.tanh(Math.max(0, -d));
      }
      return out;
    }
    if (type === 'ao') {
      var occ = new Float32Array(N), radii = [p.radius * 0.25, p.radius * 0.5, p.radius];
      radii.forEach(function (r) {
        var bb = blur(new Float32Array(H), w, h, r, wrap), f2 = zscale / r;
        for (var j = 0; j < N; j++) occ[j] += Math.max(0, bb[j] - H[j]) * f2;
      });
      for (i = 0; i < N; i++) out[i] = 1 - Math.tanh(occ[i] * p.strength * 0.6);
      return out;
    }
    out.set(H);
    return out;
  }

  return { GENS: GENS, IMAGE: IMAGE, FILTER: FILTER, EROSION: EROSION, TOOLS: TOOLS, GLOBAL: GLOBAL, MAPS: MAPS, derive: derive, rasterMask: rasterMask, compute: compute, defaults: defaults, withDefaults: withDefaults };
})();
