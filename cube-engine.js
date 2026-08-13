// 3D 큐브 엔진. Three는 index 모듈이 CDN에서 import한 뒤 주입한다.
// classic script (file:// 가능).
(function (g) {
  'use strict';

  const COLORS_DEFAULT = {
    R: 0xe8312a,
    L: 0xff8c2b,
    U: 0xf0f0f0,
    D: 0xffd60a,
    F: 0x39c45a,
    B: 0x2563eb,
    inner: 0x0d0e12,
  };
  const CUBIE = 0.94;
  const GAP = 1.0;
  const AXES = ['x', 'y', 'z'];
  const AXIS_MAP = ['x', 'x', 'y', 'y', 'z', 'z'];
  const SIGN_MAP = [1, -1, 1, -1, 1, -1];

  const DECIDE_PX = 20;
  const DOMINANCE = 1.25;
  const FORCE_PX = 45;
  const SNAP_FRACTION = 0.5;
  const DRAG_SENSITIVITY = 0.65;
  const PX90_MIN = 45, PX90_MAX = 220;
  const FLICK_SPEED = 0.9;
  const FLICK_MIN_DEG = 20;

  function create(opts) {
    const THREE = opts.THREE;
    const OrbitControls = opts.OrbitControls;
    const RoundedBoxGeometry = opts.RoundedBoxGeometry;
    const EffectComposer = opts.EffectComposer;
    const RenderPass = opts.RenderPass;
    const UnrealBloomPass = opts.UnrealBloomPass;
    const OutputPass = opts.OutputPass;
    const CubeMath = opts.CubeMath;
    const mount = opts.mount;
    let N = opts.n == null ? 3 : opts.n;
    if (N !== 2 && N !== 3 && N !== 4 && N !== 5) N = 3;

    const COLORS = Object.assign({}, COLORS_DEFAULT);
    let plasticLook = { roughness: 0.38, metalness: 0.20 };
    let stickerLook = { roughness: 0.12, metalness: 0.05 };

    const { outerOf, layerCoordsOf, snapCoord, isOuterCoord, coordToIndex, assertCubeMath } = CubeMath;
    assertCubeMath();
    let OUTER = outerOf(N);

    function gridCoord(v) { return snapCoord(N, v, GAP) / GAP; }
    function round(v) { return snapCoord(N, v, GAP); }

    const listeners = [];
    function subscribe(fn) {
      listeners.push(fn);
      return function unsubscribe() {
        const i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    }
    function notify(info) {
      if (isSolved() && timerStart !== null) freezeTimer();
      const payload = Object.assign({ solver: false }, info);
      for (let i = 0; i < listeners.length; i++) listeners[i](payload);
    }

    // 뷰 크기는 "창"이 아니라 캔버스가 실제로 차지하는 컨테이너 박스에서 읽는다.
    // 이래야 패널이 열려 stage 가 줄었을 때 큐브가 남은 영역의 정중앙에 맞는다.
    // (박스가 아직 0이면 레이아웃 전이므로 창 크기로 폴백)
    function viewSize() {
      const r = mount.getBoundingClientRect();
      if (r.width >= 1 && r.height >= 1) return { w: r.width, h: r.height };
      const vv = window.visualViewport;
      const w = (vv && vv.width) ? vv.width : window.innerWidth;
      const h = (vv && vv.height) ? vv.height : window.innerHeight;
      return { w: Math.max(w, 1), h: Math.max(h, 1) };
    }

    // ── 씬 ──
    const scene = new THREE.Scene();
    const vs0 = viewSize();
    const camera = new THREE.PerspectiveCamera(45, vs0.w / vs0.h, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(vs0.w, vs0.h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    mount.appendChild(renderer.domElement);

    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 2; bgCanvas.height = 512;
    const bgCtx = bgCanvas.getContext('2d');
    function paintBackground(top, bot) {
      const bgGrad = bgCtx.createLinearGradient(0, 0, 0, 512);
      bgGrad.addColorStop(0, top);
      bgGrad.addColorStop(1, bot);
      bgCtx.fillStyle = bgGrad;
      bgCtx.fillRect(0, 0, 2, 512);
    }
    paintBackground('#2a2c3a', '#1b1f27');
    const bgTex = new THREE.CanvasTexture(bgCanvas);
    bgTex.colorSpace = THREE.SRGBColorSpace;
    scene.background = bgTex;

    const ambientLight = new THREE.AmbientLight(0xd0d8ff, 0.42);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.7);
    keyLight.position.set(6, 10, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.top = 6;
    keyLight.shadow.camera.bottom = -6;
    keyLight.shadow.camera.left = -6;
    keyLight.shadow.camera.right = 6;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8ab4ff, 0.34);
    fillLight.position.set(-5, 2, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfff0cc, 0.26);
    rimLight.position.set(0, -6, -8);
    scene.add(rimLight);

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.ShadowMaterial({ opacity: 0.22, transparent: true })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    function fitShadowPlane() {
      shadowPlane.position.y = -(OUTER * GAP + 0.7);
      const s = Math.max(6, OUTER * GAP + 6);
      keyLight.shadow.camera.top = s;
      keyLight.shadow.camera.bottom = -s;
      keyLight.shadow.camera.left = -s;
      keyLight.shadow.camera.right = -s;
      keyLight.shadow.camera.updateProjectionMatrix();
    }
    fitShadowPlane();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.rotateSpeed = 0.9;
    controls.enablePan = false;

    const FIT_PAD = 1.6;

    function cubeRadius() {
      return OUTER * GAP * Math.sqrt(3) + CUBIE * 0.55;
    }

    function requiredDistance() {
      const { w, h } = viewSize();
      const aspect = Math.max(w / h, 0.01);
      const vFov = camera.fov * Math.PI / 180;
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
      const r = cubeRadius() * FIT_PAD;
      const distV = r / Math.tan(vFov / 2);
      const distH = r / Math.tan(hFov / 2);
      return Math.max(distV, distH);
    }

    function applyFitLimits(dist) {
      controls.minDistance = dist * 0.72;
      controls.maxDistance = dist * 2.4;
    }

    function fitCamera() {
      const { w, h } = viewSize();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const dist = requiredDistance();
      camera.position.set(4.2, 4.0, 5.2).normalize().multiplyScalar(dist);
      applyFitLimits(dist);
      controls.target.set(0, 0, 0);
      controls.update();
    }
    fitCamera();

    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setSize(vs0.w, vs0.h);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(vs0.w, vs0.h),
      0.08, 0.5, 1.35
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    const cube = new THREE.Group();
    scene.add(cube);
    const cubies = [];
    let showNumbers = false;

    function faceCellNumber(faceIndex, x, y, z) {
      const ix = coordToIndex(N, x, 1);
      const iy = coordToIndex(N, y, 1);
      const iz = coordToIndex(N, z, 1);
      let cell = -1;
      if (faceIndex === 0) cell = (N - 1 - iy) * N + (N - 1 - iz); // R
      else if (faceIndex === 1) cell = (N - 1 - iy) * N + iz;       // L
      else if (faceIndex === 2) cell = iz * N + ix;                 // U
      else if (faceIndex === 3) cell = (N - 1 - iz) * N + ix;       // D
      else if (faceIndex === 4) cell = (N - 1 - iy) * N + ix;       // F
      else if (faceIndex === 5) cell = (N - 1 - iy) * N + (N - 1 - ix); // B
      return cell < 0 ? null : cell + 1;
    }

    function makeStickerTexture(hex, num) {
      const size = 128;
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, size, size);
      if (showNumbers && num != null) {
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        ctx.fillStyle = lum > 0.55 ? '#14161c' : '#ffffff';
        const fontPx = num > 9
          ? Math.max(36, Math.floor(58 - Math.min(N, 5) * 3))
          : Math.max(44, Math.floor(72 - Math.min(N, 5) * 4));
        ctx.font = `700 ${fontPx}px system-ui,Segoe UI,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(num), size / 2, size / 2 + 1);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      tex.needsUpdate = true;
      return tex;
    }

    function orientStickerPlane(plane, axis, sign) {
      if (axis === 'x') plane.rotation.set(0, sign > 0 ? Math.PI / 2 : -Math.PI / 2, 0);
      else if (axis === 'y') plane.rotation.set(sign > 0 ? -Math.PI / 2 : Math.PI / 2, 0, 0);
      else plane.rotation.set(0, sign > 0 ? 0 : Math.PI, 0);
    }

    function makeStickerMesh(hex, axis, sign, num) {
      // Plane으로 붙여 가장자리가 직선으로 보이게 한다 (얇은 박스는 옆면·블룸에 선이 깨져 보임)
      const SIZE = CUBIE * 0.84;
      const OFFSET = CUBIE / 2 + 0.0012;
      const mat = new THREE.MeshStandardMaterial({
        map: makeStickerTexture(hex, num),
        roughness: stickerLook.roughness,
        metalness: stickerLook.metalness,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), mat);
      orientStickerPlane(m, axis, sign);
      m.position[axis] = sign * OFFSET;
      m.castShadow = false;
      m.receiveShadow = false;
      m.userData.isSticker = true;
      m.userData.stickerNum = num;
      m.userData.stickerHex = hex;
      return m;
    }

    function remeshStickers() {
      for (let ci = 0; ci < cubies.length; ci++) {
        const mesh = cubies[ci];
        const nums = mesh.userData.faceNumbers || [];
        [...mesh.children].forEach(ch => mesh.remove(ch));
        mesh.userData.faceColors.forEach((hex, i) => {
          if (hex !== COLORS.inner) {
            mesh.add(makeStickerMesh(hex, AXIS_MAP[i], SIGN_MAP[i], nums[i]));
          }
        });
      }
      clearHighlight();
    }

    function setShowNumbers(on) {
      showNumbers = !!on;
      remeshStickers();
      return showNumbers;
    }

    function makeCubie(x, y, z) {
      const plus = v => isOuterCoord(N, v) && v > 0;
      const minus = v => isOuterCoord(N, v) && v < 0;
      const faceColors = [
        plus(x) ? COLORS.R : COLORS.inner,
        minus(x) ? COLORS.L : COLORS.inner,
        plus(y) ? COLORS.U : COLORS.inner,
        minus(y) ? COLORS.D : COLORS.inner,
        plus(z) ? COLORS.F : COLORS.inner,
        minus(z) ? COLORS.B : COLORS.inner,
      ];
      const faceNumbers = faceColors.map((hex, i) =>
        hex === COLORS.inner ? null : faceCellNumber(i, x, y, z)
      );

      const geo = new RoundedBoxGeometry(CUBIE, CUBIE, CUBIE, 2, 0.04);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: COLORS.inner,
        roughness: plasticLook.roughness,
        metalness: plasticLook.metalness,
      });
      const mesh = new THREE.Mesh(geo, bodyMat);
      mesh.position.set(x * GAP, y * GAP, z * GAP);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.faceColors = faceColors;
      mesh.userData.faceNumbers = faceNumbers;

      faceColors.forEach((hex, i) => {
        if (hex !== COLORS.inner) {
          mesh.add(makeStickerMesh(hex, AXIS_MAP[i], SIGN_MAP[i], faceNumbers[i]));
        }
      });

      cube.add(mesh);
      cubies.push(mesh);
    }

    function buildCube() {
      cubies.forEach(c => cube.remove(c));
      cubies.length = 0;
      const layers = layerCoordsOf(N);
      for (let i = 0; i < layers.length; i++) {
        const x = layers[i];
        for (let j = 0; j < layers.length; j++) {
          const y = layers[j];
          for (let k = 0; k < layers.length; k++) {
            const z = layers[k];
            if (N >= 4 && !isOuterCoord(N, x) && !isOuterCoord(N, y) && !isOuterCoord(N, z)) continue;
            makeCubie(x, y, z);
          }
        }
      }
    }
    buildCube();

    let animating = false;
    const queue = [];
    const history = [];
    let moveCount = 0;
    let timerStart = null;
    let timerFrozen = false;
    let frozenElapsed = 0;

    function freezeTimer() {
      if (timerStart !== null && !timerFrozen) {
        frozenElapsed = performance.now() - timerStart;
        timerFrozen = true;
      }
    }

    function recordMove(axisIndex, layerValues, dir) {
      history.push({ axisIndex, layerValues: layerValues.slice(), dir });
      moveCount++;
      if (timerStart === null && !timerFrozen) timerStart = performance.now();
    }

    function resetStats() {
      history.length = 0;
      moveCount = 0;
      timerStart = null;
      timerFrozen = false;
      frozenElapsed = 0;
    }

    function selectLayers(axisIndex, layerValues) {
      const a = AXES[axisIndex];
      return cubies.filter(c => {
        for (let i = 0; i < layerValues.length; i++) {
          if (Math.abs(c.position[a] - layerValues[i] * GAP) < 0.1) return true;
        }
        return false;
      });
    }
    function selectLayer(axisIndex, layerValue) {
      return selectLayers(axisIndex, [layerValue]);
    }

    function axisVecOf(axisIndex) {
      return new THREE.Vector3(
        axisIndex === 0 ? 1 : 0,
        axisIndex === 1 ? 1 : 0,
        axisIndex === 2 ? 1 : 0
      );
    }

    function grabLayers(axisIndex, layerValues) {
      const group = selectLayers(axisIndex, layerValues);
      const pivot = new THREE.Group();
      scene.add(pivot);
      group.forEach(c => pivot.attach(c));
      return { group, pivot, axisVec: axisVecOf(axisIndex), angle: 0 };
    }
    function grabLayer(axisIndex, layerValue) {
      return grabLayers(axisIndex, [layerValue]);
    }

    function setLayerAngle(h, angle) {
      h.angle = angle;
      h.pivot.setRotationFromAxisAngle(h.axisVec, angle);
    }

    function finalizeLayer(h, angle) {
      h.pivot.rotation.set(0, 0, 0);
      h.pivot.setRotationFromAxisAngle(h.axisVec, angle);
      h.pivot.updateMatrixWorld(true);
      [...h.group].forEach(c => {
        cube.attach(c);
        c.position.set(round(c.position.x), round(c.position.y), round(c.position.z));
      });
      scene.remove(h.pivot);
    }

    function settleLayer(h, toAngle, instant) {
      return new Promise(resolve => {
        const from = h.angle;
        const done = () => { finalizeLayer(h, toAngle); resolve(); };
        if (instant || Math.abs(toAngle - from) < 1e-6) { done(); return; }

        const dur = Math.max(160 * Math.abs(toAngle - from) / (Math.PI / 2), 40);
        const t0 = performance.now();
        (function step(now) {
          const t = Math.min((now - t0) / dur, 1);
          const e = 1 - Math.pow(1 - t, 3);
          setLayerAngle(h, from + (toAngle - from) * e);
          if (t < 1) requestAnimationFrame(step);
          else done();
        })(performance.now());
      });
    }

    function rotateLayers(axisIndex, layerValues, dir, instant) {
      return settleLayer(grabLayers(axisIndex, layerValues), (Math.PI / 2) * dir, instant);
    }
    function rotateLayer(axisIndex, layerValue, dir, instant) {
      return rotateLayers(axisIndex, [layerValue], dir, instant);
    }

    function makeMoves(n, outer) {
      const m = {
        U: { axis: 1, layers: [outer], dir: -1 },
        D: { axis: 1, layers: [-outer], dir: 1 },
        R: { axis: 0, layers: [outer], dir: -1 },
        L: { axis: 0, layers: [-outer], dir: 1 },
        F: { axis: 2, layers: [outer], dir: -1 },
        B: { axis: 2, layers: [-outer], dir: 1 },
      };
      if (n >= 4) {
        const inner = outer - 1;
        m['2U'] = { axis: 1, layers: [inner], dir: -1 };
        m['2D'] = { axis: 1, layers: [-inner], dir: 1 };
        m['2R'] = { axis: 0, layers: [inner], dir: -1 };
        m['2L'] = { axis: 0, layers: [-inner], dir: 1 };
        m['2F'] = { axis: 2, layers: [inner], dir: -1 };
        m['2B'] = { axis: 2, layers: [-inner], dir: 1 };
        m.Uw = { axis: 1, layers: [outer, inner], dir: -1 };
        m.Dw = { axis: 1, layers: [-outer, -inner], dir: 1 };
        m.Rw = { axis: 0, layers: [outer, inner], dir: -1 };
        m.Lw = { axis: 0, layers: [-outer, -inner], dir: 1 };
        m.Fw = { axis: 2, layers: [outer, inner], dir: -1 };
        m.Bw = { axis: 2, layers: [-outer, -inner], dir: 1 };
        if (n >= 5) {
          m['3U'] = { axis: 1, layers: [0], dir: -1 };
          m['3D'] = { axis: 1, layers: [0], dir: 1 };
          m['3R'] = { axis: 0, layers: [0], dir: -1 };
          m['3L'] = { axis: 0, layers: [0], dir: 1 };
          m['3F'] = { axis: 2, layers: [0], dir: -1 };
          m['3B'] = { axis: 2, layers: [0], dir: 1 };
          m['3Uw'] = { axis: 1, layers: [outer, inner, 0], dir: -1 };
          m['3Dw'] = { axis: 1, layers: [-outer, -inner, 0], dir: 1 };
          m['3Rw'] = { axis: 0, layers: [outer, inner, 0], dir: -1 };
          m['3Lw'] = { axis: 0, layers: [-outer, -inner, 0], dir: 1 };
          m['3Fw'] = { axis: 2, layers: [outer, inner, 0], dir: -1 };
          m['3Bw'] = { axis: 2, layers: [-outer, -inner, 0], dir: 1 };
        }
      }
      return m;
    }
    let MOVES = makeMoves(N, OUTER);

    function parseMoveToken(tok) {
      const m = String(tok).match(/^(3|2)?(Uw|Dw|Lw|Rw|Fw|Bw|[UDLRFB]|[udlrfb])(2|')?$/i);
      if (!m) return null;
      const prefix = m[1] || '';
      let face = m[2];
      const suffix = m[3] || '';
      const prime = suffix === "'";
      const double = suffix === '2';
      if (face.length === 1 && face === face.toLowerCase()) face = face.toUpperCase() + 'w';
      else if (/w$/i.test(face)) face = face[0].toUpperCase() + 'w';
      else face = face.toUpperCase();
      if (prefix) {
        if (prefix === '2' && face.length > 1) return null;
        face = prefix + face;
      }
      if (!MOVES[face]) return null;
      return { name: face, prime, double };
    }

    function doMove(name, prime, record) {
      if (prime == null) prime = false;
      if (record == null) record = true;
      if (animating) { queue.push([name, prime, record]); return; }
      animating = true;
      const spec = MOVES[name];
      if (!spec) { animating = false; return; }
      const dir = spec.dir * (prime ? -1 : 1);
      if (record) recordMove(spec.axis, spec.layers, dir);
      return rotateLayers(spec.axis, spec.layers, dir).then(() => {
        animating = false;
        const idle = queue.length === 0;
        notify({ solver: record && idle });
        if (!idle) {
          const next = queue.shift();
          doMove(next[0], next[1], next[2]);
        }
      });
    }

    function playAlg(str, record) {
      if (record == null) record = false;
      const toks = str.trim().split(/\s+/);
      for (let i = 0; i < toks.length; i++) {
        const parsed = parseMoveToken(toks[i]);
        if (!parsed) continue;
        doMove(parsed.name, parsed.prime, record);
        if (parsed.double) doMove(parsed.name, parsed.prime, record);
      }
    }

    function undo() {
      if (animating || history.length === 0) return Promise.resolve();
      const m = history.pop();
      moveCount = Math.max(0, moveCount - 1);
      animating = true;
      const layers = m.layerValues || [m.layerValue];
      return rotateLayers(m.axisIndex, layers, -m.dir).then(() => {
        animating = false;
        notify({ solver: true });
      });
    }

    function doMoveAwaitable(name, prime) {
      const spec = MOVES[name];
      animating = true;
      return rotateLayers(spec.axis, spec.layers, spec.dir * (prime ? -1 : 1), false).then(() => {
        animating = false;
      });
    }

    function scramble(count) {
      if (count == null) count = N <= 2 ? 11 : N >= 5 ? 60 : N >= 4 ? 40 : 25;
      if (animating) return Promise.resolve();
      queue.length = 0;
      const names = Object.keys(MOVES);
      let lastAxis = -1;
      let p = Promise.resolve();
      for (let i = 0; i < count; i++) {
        let name = names[Math.floor(Math.random() * names.length)];
        let spec = MOVES[name];
        for (let t = 0; t < 12 && spec.axis === lastAxis; t++) {
          name = names[Math.floor(Math.random() * names.length)];
          spec = MOVES[name];
        }
        lastAxis = spec.axis;
        const prime = Math.random() < 0.5;
        p = p.then(() => doMoveAwaitable(name, prime));
      }
      return p.then(() => {
        resetStats();
        notify({ solver: true });
      });
    }

    function resetCube() {
      queue.length = 0;
      animating = false;
      drag = null;
      controls.enabled = true;
      clearHighlight();
      cube.clear();
      cubies.length = 0;
      buildCube();
      resetStats();
      notify({ solver: true });
    }

    function isSolved() {
      const faces = [
        { n: new THREE.Vector3(1, 0, 0) },
        { n: new THREE.Vector3(-1, 0, 0) },
        { n: new THREE.Vector3(0, 1, 0) },
        { n: new THREE.Vector3(0, -1, 0) },
        { n: new THREE.Vector3(0, 0, 1) },
        { n: new THREE.Vector3(0, 0, -1) },
      ];
      for (let f = 0; f < faces.length; f++) {
        const colors = new Set();
        for (let ci = 0; ci < cubies.length; ci++) {
          const c = cubies[ci];
          for (let i = 0; i < 6; i++) {
            const localNormal = new THREE.Vector3(
              i === 0 ? 1 : i === 1 ? -1 : 0,
              i === 2 ? 1 : i === 3 ? -1 : 0,
              i === 4 ? 1 : i === 5 ? -1 : 0
            );
            const world = localNormal.clone().applyQuaternion(c.quaternion).round();
            if (world.equals(faces[f].n)) {
              const col = c.userData.faceColors[i];
              if (col !== COLORS.inner) colors.add(col);
            }
          }
        }
        if (colors.size > 1) return false;
      }
      return true;
    }

    // ── 드래그 ──
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let drag = null;

    function toNDC(e) {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    }

    function findCubie(obj) {
      let o = obj;
      while (o) {
        if (cubies.indexOf(o) >= 0) return o;
        o = o.parent;
      }
      return null;
    }

    function onPointerDown(e) {
      if (animating || drag) return;
      if (e.button !== 0 || e.isPrimary === false) return;
      toNDC(e);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(cubies, true);
      if (hits.length === 0) return;

      const hit = hits[0];
      const hitObj = hit.object;
      const parentCubie = findCubie(hitObj);
      if (!parentCubie) return;

      // 면 드래그가 카메라 궤도보다 우선 — OrbitControls가 같은 pointerdown을 먹지 않게
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      controls.enabled = false;

      const rawNormal = hit.face.normal.clone()
        .applyMatrix3(new THREE.Matrix3().getNormalMatrix(hitObj.matrixWorld));
      const ax = Math.abs(rawNormal.x), ay = Math.abs(rawNormal.y), az = Math.abs(rawNormal.z);
      let normal;
      if (ax >= ay && ax >= az) normal = new THREE.Vector3(Math.sign(rawNormal.x), 0, 0);
      else if (ay >= az) normal = new THREE.Vector3(0, Math.sign(rawNormal.y), 0);
      else normal = new THREE.Vector3(0, 0, Math.sign(rawNormal.z));

      drag = {
        mesh: parentCubie,
        normal,
        point: hit.point.clone(),
        startX: e.clientX, startY: e.clientY,
        lastX: e.clientX, lastY: e.clientY,
        decided: false,
        handle: null, axisIndex: null, axisSign: null, layerValue: null,
        tangentPx: null, pxPer90: 1, projBase: 0, theta: 0,
        lastProj: 0, lastT: 0, vel: 0,
      };
    }

    function screenDelta(origin, dirVec, worldLen) {
      const r = renderer.domElement.getBoundingClientRect();
      const p0 = origin.clone().project(camera);
      const p1 = origin.clone().add(dirVec.clone().multiplyScalar(worldLen)).project(camera);
      return new THREE.Vector2((p1.x - p0.x) * r.width / 2, -(p1.y - p0.y) * r.height / 2);
    }

    function decideDragAxis() {
      if (animating) return false;
      const dx = drag.lastX - drag.startX;
      const dy = drag.lastY - drag.startY;
      const dist = Math.hypot(dx, dy);
      if (dist < DECIDE_PX) return false;

      const mouse = new THREE.Vector2(dx, dy).normalize();
      const n = drag.normal;
      const cands = [];
      for (let i = 0; i < 3; i++) {
        const v = new THREE.Vector3(i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0);
        if (Math.abs(v.dot(n)) >= 0.5) continue;
        const px = screenDelta(drag.point, v, 1);
        if (px.lengthSq() < 1e-9) continue;
        const unit = px.clone().normalize();
        const score = unit.dot(mouse);
        cands.push({ v, unit, pxLen: px.length(), score, abs: Math.abs(score) });
      }
      if (cands.length === 0) return false;
      cands.sort((a, b) => b.abs - a.abs);

      const best = cands[0], second = cands[1];
      if (second && best.abs < second.abs * DOMINANCE && dist < FORCE_PX) return false;

      const sign = best.score >= 0 ? 1 : -1;
      const T = best.v.clone().multiplyScalar(sign);
      const tangentPx = best.unit.clone().multiplyScalar(sign);
      const omega = n.clone().cross(T).round();
      const axisIndex = omega.x !== 0 ? 0 : omega.y !== 0 ? 1 : 2;
      const axisSign = omega.getComponent(axisIndex);

      let layerValue = gridCoord(drag.mesh.position[AXES[axisIndex]]);
      if (N === 3 && Math.abs(layerValue) < 1e-6)
        layerValue = drag.point.getComponent(axisIndex) >= 0 ? OUTER : -OUTER;

      const axisVec = axisVecOf(axisIndex);
      const rAxis = drag.point.clone()
        .sub(axisVec.clone().multiplyScalar(drag.point.dot(axisVec))).length();

      drag.axisIndex = axisIndex;
      drag.axisSign = axisSign;
      drag.layerValue = layerValue;
      drag.tangentPx = tangentPx;
      const chordPx = best.pxLen * Math.SQRT2 * Math.max(rAxis, 0.5);
      drag.pxPer90 = Math.min(Math.max(chordPx * DRAG_SENSITIVITY, PX90_MIN), PX90_MAX);
      drag.projBase = new THREE.Vector2(dx, dy).dot(tangentPx);
      drag.lastProj = drag.projBase;
      drag.lastT = performance.now();
      drag.vel = 0;
      drag.handle = grabLayer(axisIndex, layerValue);
      drag.decided = true;
      animating = true;
      return true;
    }

    function onPointerMove(e) {
      if (!drag) return;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      if (!drag.decided) { decideDragAxis(); return; }

      const d = new THREE.Vector2(e.clientX - drag.startX, e.clientY - drag.startY);
      const proj = d.dot(drag.tangentPx);
      const eff = proj - drag.projBase;
      const t = Math.max(-1, Math.min(1, eff / drag.pxPer90));
      drag.theta = t * (Math.PI / 2);
      setLayerAngle(drag.handle, drag.axisSign * drag.theta);

      const now = performance.now();
      const dt = now - drag.lastT;
      if (dt > 0) {
        const v = (proj - drag.lastProj) / dt;
        drag.vel = drag.vel * 0.4 + v * 0.6;
        drag.lastProj = proj;
        drag.lastT = now;
      }
    }

    function endDrag() {
      const d = drag;
      drag = null;
      controls.enabled = true;
      if (!d || !d.decided) return Promise.resolve();

      const deg = Math.abs(d.theta) * 180 / Math.PI;
      const flick = deg >= FLICK_MIN_DEG
        && Math.abs(d.vel) >= FLICK_SPEED
        && Math.sign(d.vel) === Math.sign(d.theta);
      const quarter = (deg > 90 * SNAP_FRACTION || flick) ? Math.sign(d.theta) : 0;
      const dir = d.axisSign * quarter;
      if (dir !== 0) recordMove(d.axisIndex, [d.layerValue], dir);

      return settleLayer(d.handle, (Math.PI / 2) * dir).then(() => {
        animating = false;
        const idle = queue.length === 0;
        notify({ solver: idle });
        if (!idle) {
          const next = queue.shift();
          doMove(next[0], next[1], next[2]);
        }
      });
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    // ── 상태 읽기 ──
    const FACE_BY_HEX = {};
    function rebuildFaceMap() {
      for (const k of Object.keys(FACE_BY_HEX)) delete FACE_BY_HEX[k];
      FACE_BY_HEX[COLORS.U] = 'U';
      FACE_BY_HEX[COLORS.R] = 'R';
      FACE_BY_HEX[COLORS.F] = 'F';
      FACE_BY_HEX[COLORS.D] = 'D';
      FACE_BY_HEX[COLORS.L] = 'L';
      FACE_BY_HEX[COLORS.B] = 'B';
    }
    rebuildFaceMap();

    function faceletSpec() {
      const s = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) s.push({ p: [c - OUTER, OUTER, r - OUTER], n: [0, 1, 0] });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) s.push({ p: [OUTER, OUTER - r, OUTER - c], n: [1, 0, 0] });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) s.push({ p: [c - OUTER, OUTER - r, OUTER], n: [0, 0, 1] });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) s.push({ p: [c - OUTER, -OUTER, OUTER - r], n: [0, -1, 0] });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) s.push({ p: [-OUTER, OUTER - r, c - OUTER], n: [-1, 0, 0] });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) s.push({ p: [OUTER - c, OUTER - r, -OUTER], n: [0, 0, -1] });
      return s;
    }
    let FACELET_SPEC = N === 3 ? faceletSpec() : null;

    function applySize(next) {
      N = next;
      OUTER = outerOf(N);
      MOVES = makeMoves(N, OUTER);
      FACELET_SPEC = N === 3 ? faceletSpec() : null;
      fitShadowPlane();
    }

    function setN(next) {
      next = next | 0;
      if (next !== 2 && next !== 3 && next !== 4 && next !== 5) return false;
      if (next === N) return true;
      if (animating || queue.length > 0 || drag) return false;
      applySize(next);
      fitCamera();
      resetCube();
      return true;
    }

    function cubieAt(p) {
      for (let i = 0; i < cubies.length; i++) {
        const c = cubies[i];
        if (gridCoord(c.position.x) === p[0]
          && gridCoord(c.position.y) === p[1]
          && gridCoord(c.position.z) === p[2]) return c;
      }
      return null;
    }

    function colorAt(p, n) {
      const c = cubieAt(p);
      if (!c) return null;
      const ln = new THREE.Vector3(n[0], n[1], n[2])
        .applyQuaternion(c.quaternion.clone().invert()).round();
      const idx = ln.x === 1 ? 0 : ln.x === -1 ? 1 : ln.y === 1 ? 2 : ln.y === -1 ? 3 : ln.z === 1 ? 4 : 5;
      return FACE_BY_HEX[c.userData.faceColors[idx]];
    }

    function readState() {
      if (N !== 3 || !FACELET_SPEC) return { n: N, facelets: null };
      let out = '';
      for (let i = 0; i < FACELET_SPEC.length; i++) {
        const s = FACELET_SPEC[i];
        out += colorAt(s.p, s.n) || '?';
      }
      return { n: N, facelets: out };
    }

    let highlightTimer = null;
    function clearHighlight() {
      if (highlightTimer) { clearTimeout(highlightTimer); highlightTimer = null; }
      cubies.forEach(cb => {
        cb.children.forEach(child => {
          if (child.isMesh && child.material && child.material.emissive) {
            child.material.emissive.setHex(0x000000);
          }
        });
      });
    }
    function highlight(name) {
      clearHighlight();
      const spec = MOVES[name];
      if (!spec) return;
      const group = selectLayers(spec.axis, spec.layers);
      for (let i = 0; i < group.length; i++) {
        group[i].children.forEach(child => {
          if (child.isMesh && child.material && child.material.emissive) {
            const hex = child.userData.stickerHex;
            if (hex != null) child.material.emissive.setHex(hex).multiplyScalar(0.45);
            else if (child.material.color) {
              child.material.emissive.copy(child.material.color).multiplyScalar(0.5);
            }
          }
        });
      }
      highlightTimer = setTimeout(clearHighlight, 600);
    }

    function eachCubie(fn) {
      cubies.forEach(cubie => {
        fn({
          x: gridCoord(cubie.position.x),
          y: gridCoord(cubie.position.y),
          z: gridCoord(cubie.position.z),
          clearStickers() {
            [...cubie.children].forEach(ch => cubie.remove(ch));
          },
          setFace(fi, hex) {
            cubie.userData.faceColors[fi] = hex;
            if (hex !== COLORS.inner) {
              const num = (cubie.userData.faceNumbers || [])[fi];
              cubie.add(makeStickerMesh(hex, AXIS_MAP[fi], SIGN_MAP[fi], num));
            }
          },
        });
      });
    }

    function setTheme(theme) {
      if (!theme || !theme.colors) return false;
      const letters = cubies.map(c => c.userData.faceColors.map(hex => {
        if (hex === COLORS.inner) return null;
        return FACE_BY_HEX[hex] || null;
      }));

      Object.assign(COLORS, theme.colors);
      rebuildFaceMap();
      plasticLook = Object.assign({}, theme.plastic || plasticLook);
      stickerLook = Object.assign({}, theme.sticker || stickerLook);

      for (let ci = 0; ci < cubies.length; ci++) {
        const mesh = cubies[ci];
        const faces = letters[ci];
        for (let i = 0; i < 6; i++) {
          mesh.userData.faceColors[i] = faces[i] ? COLORS[faces[i]] : COLORS.inner;
        }
        if (mesh.material) {
          mesh.material.color.setHex(COLORS.inner);
          mesh.material.roughness = plasticLook.roughness;
          mesh.material.metalness = plasticLook.metalness;
        }
        [...mesh.children].forEach(ch => mesh.remove(ch));
        mesh.userData.faceColors.forEach((hex, i) => {
          if (hex !== COLORS.inner) {
            mesh.add(makeStickerMesh(hex, AXIS_MAP[i], SIGN_MAP[i], (mesh.userData.faceNumbers || [])[i]));
          }
        });
      }
      clearHighlight();
      return true;
    }

    function whenIdle() {
      return new Promise(resolve => {
        const tick = () => {
          if (!animating && queue.length === 0 && !drag) resolve();
          else requestAnimationFrame(tick);
        };
        tick();
      });
    }

    function resize() {
      const { w, h } = viewSize();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      const need = requiredDistance();
      applyFitLimits(need);
      const current = camera.position.distanceTo(controls.target);
      if (current < need) {
        camera.position.sub(controls.target).setLength(need).add(controls.target);
      }
    }

    (function loop() {
      requestAnimationFrame(loop);
      controls.update();
      composer.render();
    })();

    window.addEventListener('resize', resize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', resize);
      window.visualViewport.addEventListener('scroll', resize);
    }
    // 컨테이너가 줄고 늘어나는 것(패널 열림/닫힘, 방향 전환)을 직접 관찰한다.
    // 캔버스는 absolute 라 mount 크기에 영향을 주지 않으므로 되먹임이 없다.
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => resize()).observe(mount);
    }

    function elapsedMs() {
      if (timerStart === null) return 0;
      if (timerFrozen) return frozenElapsed;
      return performance.now() - timerStart;
    }

    return {
      get n() { return N; },
      get outer() { return OUTER; },
      get colors() { return COLORS; },
      get moves() { return MOVES; },
      get busy() { return animating || queue.length > 0 || !!drag; },
      get stats() {
        return {
          moveCount,
          timerStart,
          timerFrozen,
          elapsed: elapsedMs(),
        };
      },
      doMove,
      playAlg,
      scramble,
      undo,
      reset: resetCube,
      isSolved,
      readState,
      colorAt,
      highlight,
      clearHighlight,
      rebuild() { buildCube(); resetStats(); },
      eachCubie,
      subscribe,
      whenIdle,
      resize,
      setN,
      setTheme,
      setShowNumbers,
      get showNumbers() { return showNumbers; },
    };
  }

  g.CubeEngine = { create, COLORS: COLORS_DEFAULT };
})(typeof globalThis !== 'undefined' ? globalThis : this);
