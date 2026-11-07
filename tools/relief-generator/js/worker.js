importScripts('engine.js');
(function workerMain() {
    var imgs = {}, cache = { entries: [] };
    self.onmessage = function (e) {
      var m = e.data;
      if (m.type === 'image') { imgs[m.id] = { w: m.w, h: m.h, data: m.data }; return; }
      if (m.type === 'derive') {
        var t1 = performance.now(), dd = Engine.derive(m.map, m.H, m.w, m.h, m.p, m.z, m.wrap);
        self.postMessage({ type: 'done', data: dd, min: 0, max: 1, ms: performance.now() - t1 }, [dd.buffer]); return;
      }
      if (m.type === 'render') {
        var t0 = performance.now(), last = 0;
        try {
          var r = Engine.compute(m.job, imgs, m.progress ? function (p) { var t = performance.now(); if (t - last > 80) { last = t; self.postMessage({ type: 'progress', p: p }); } } : null, m.cache ? cache : null);
          self.postMessage({ type: 'done', data: r.data, min: r.min, max: r.max, ms: performance.now() - t0, recomputed: r.recomputed, total: r.total }, [r.data.buffer]);
        } catch (err) { self.postMessage({ type: 'error', message: String(err && err.message || err) }); }
      }
    };
  })();
