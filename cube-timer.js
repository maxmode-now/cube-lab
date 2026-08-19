// Play 세션 기록 · WCA ao5/ao12 · 인스펙션 페널티. 계정 없음, localStorage만.
// classic script. DOM/엔진 없음.
(function (g) {
  'use strict';

  const KEY = 'cubeTimes';
  const MAX = 200;
  const SIZES = ['2', '3', '4', '5'];
  const INSPECT_MS = 15000;
  const DNF_MS = 17000;

  function emptyStore() {
    return { v: 1, inspection: true, bySize: { '2': [], '3': [], '4': [], '5': [] } };
  }

  function sizeKey(n) {
    const s = String(n);
    return SIZES.indexOf(s) >= 0 ? s : '3';
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return emptyStore();
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== 1 || !parsed.bySize) return emptyStore();
      const out = emptyStore();
      out.inspection = parsed.inspection !== false;
      for (let i = 0; i < SIZES.length; i++) {
        const k = SIZES[i];
        const arr = parsed.bySize[k];
        out.bySize[k] = Array.isArray(arr) ? arr.filter(validEntry) : [];
      }
      return out;
    } catch (e) {
      return emptyStore();
    }
  }

  function validEntry(e) {
    return e && typeof e.ms === 'number' && isFinite(e.ms) && e.ms >= 0
      && (e.penalty === 0 || e.penalty === 2 || e.penalty === 'DNF');
  }

  function save(store) {
    try { localStorage.setItem(KEY, JSON.stringify(store)); }
    catch (e) { /* quota / private mode */ }
  }

  let store = load();

  function persist() { save(store); }

  function truncMs(ms) {
    return Math.floor(Math.max(0, Number(ms) || 0) / 10) * 10;
  }

  function roundMs(ms) {
    return Math.round(Math.max(0, Number(ms) || 0) / 10) * 10;
  }

  function comparable(entry) {
    if (!entry || entry.penalty === 'DNF') return Infinity;
    return truncMs(entry.ms) + (entry.penalty === 2 ? 2000 : 0);
  }

  function formatClock(ms) {
    const t = truncMs(ms);
    const cs = Math.floor(t / 10);
    const m = Math.floor(cs / 6000);
    const s = Math.floor((cs % 6000) / 100);
    const c = cs % 100;
    const frac = (c < 10 ? '0' : '') + c;
    if (m > 0) {
      const ss = s < 10 ? '0' + s : String(s);
      return m + ':' + ss + '.' + frac;
    }
    return s + '.' + frac;
  }

  function formatEntry(entry) {
    if (!entry || entry.penalty === 'DNF') return 'DNF';
    const clock = formatClock(entry.ms);
    return entry.penalty === 2 ? clock + '+' : clock;
  }

  function formatAvg(msOrDnf) {
    if (msOrDnf == null) return '—';
    if (msOrDnf === 'DNF') return 'DNF';
    return formatClock(msOrDnf);
  }

  function averageOf(times, n) {
    if (!times || times.length < n) return null;
    const slice = times.slice(-n);
    const vals = slice.map(comparable);
    vals.sort(function (a, b) { return a - b; });
    const mid = vals.slice(1, -1);
    if (mid.some(function (v) { return v === Infinity; })) return 'DNF';
    let sum = 0;
    for (let i = 0; i < mid.length; i++) sum += mid[i];
    return roundMs(sum / mid.length);
  }

  function pbOf(times) {
    if (!times || !times.length) return null;
    let best = Infinity;
    for (let i = 0; i < times.length; i++) {
      const v = comparable(times[i]);
      if (v < best) best = v;
    }
    return best === Infinity ? null : best;
  }

  function inspectPenalty(elapsedMs) {
    if (elapsedMs > DNF_MS) return 'DNF';
    if (elapsedMs > INSPECT_MS) return 2;
    return 0;
  }

  function inspectMark(elapsedMs) {
    if (elapsedMs >= DNF_MS) return 'dnf';
    if (elapsedMs >= INSPECT_MS) return 'plus2';
    if (elapsedMs >= 12000) return 'late';
    if (elapsedMs >= 8000) return 'warn';
    return '';
  }

  function times(n) {
    return store.bySize[sizeKey(n)];
  }

  function add(n, entry) {
    const list = times(n);
    const row = {
      ms: truncMs(entry.ms),
      penalty: entry.penalty === 'DNF' ? 'DNF' : entry.penalty === 2 ? 2 : 0,
      scramble: String(entry.scramble || ''),
      at: entry.at || Date.now(),
    };
    list.push(row);
    if (list.length > MAX) list.splice(0, list.length - MAX);
    persist();
    return row;
  }

  function update(n, index, patch) {
    const list = times(n);
    const i = list.length - 1 - index;
    if (i < 0 || i >= list.length) return null;
    const cur = list[i];
    if (patch.penalty !== undefined) {
      cur.penalty = patch.penalty === 'DNF' ? 'DNF' : patch.penalty === 2 ? 2 : 0;
    }
    persist();
    return cur;
  }

  function remove(n, index) {
    const list = times(n);
    const i = list.length - 1 - index;
    if (i < 0 || i >= list.length) return false;
    list.splice(i, 1);
    persist();
    return true;
  }

  function stats(n) {
    const list = times(n);
    return {
      ao5: averageOf(list, 5),
      ao12: averageOf(list, 12),
      pb: pbOf(list),
      count: list.length,
    };
  }

  function getInspection() { return store.inspection !== false; }
  function setInspection(on) {
    store.inspection = !!on;
    persist();
  }

  g.CubeTimer = {
    INSPECT_MS, DNF_MS,
    truncMs, roundMs, comparable, formatClock, formatEntry, formatAvg,
    averageOf, pbOf, inspectPenalty, inspectMark,
    times, add, update, remove, stats,
    getInspection, setInspection,
    _test: { load, emptyStore, KEY, MAX, sizeKey },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
