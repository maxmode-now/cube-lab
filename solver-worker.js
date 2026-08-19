// 같은 출처만 로드한다. CDN importScripts는 CORS/SW 캐시에서 Failed to fetch가 난다.
importScripts('./vendor/cube.js', './vendor/solve.js', './cube-solver.js');

self.onmessage = function (e) {
  const msg = e.data || {};
  try {
    if (msg.type === 'init') {
      CubeSolver.init();
      self.postMessage({ type: 'ready', job: msg.job, ok: true });
      return;
    }
    if (msg.type === 'solve') {
      const maxMs = 45000;
      CubeSolver.setYield(function () {
        return new Promise(function (r) { setTimeout(r, 0); });
      }, maxMs);
      Promise.resolve(CubeSolver.solve(msg.facelets, msg.n)).then(function (sol) {
        self.postMessage({ type: 'done', job: msg.job, ok: true, sol: sol || '' });
      }).catch(function (err) {
        self.postMessage({
          type: 'done',
          job: msg.job,
          ok: false,
          error: err && err.message ? err.message : String(err),
        });
      }).then(function () {
        CubeSolver.setYield(null);
      });
      return;
    }
  } catch (err) {
    const error = err && err.message ? err.message : String(err);
    self.postMessage({
      type: msg.type === 'init' ? 'ready' : 'done',
      job: msg.job,
      ok: false,
      error: error,
    });
  }
};
