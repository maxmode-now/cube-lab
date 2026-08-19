// Random F2L / OLL / PLL case drill. Classic script.
(function (g) {
  'use strict';

  var SETS = { f2l: 1, oll: 1, pll: 1 };
  var NEXT_MS = 700;

  function shuffle(list) {
    var a = list.slice();
    var i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function keyOf(c) {
    return c && c.id != null ? String(c.id) : '';
  }

  g.CubeDrill = {
    create: function (opts) {
      var engine = opts.engine;
      var invertAlg = opts.invertAlg;
      var casesOf = opts.casesOf;
      var titleOf = opts.titleOf;
      var t = opts.t;
      var toast = opts.toast;
      var onChange = opts.onChange || function () {};

      var active = false;
      var busy = false;
      var pendingAdvance = false;
      var setName = null;
      var current = null;
      var lastKey = null;
      var bag = [];
      var gen = 0;
      var nextTimer = 0;

      function emit() {
        onChange({
          active: active,
          busy: busy || pendingAdvance,
          set: setName,
        });
      }

      function labelOf(c) {
        var title = titleOf ? titleOf(c) : '';
        var id = c && c.id != null ? String(c.id) : '';
        if (setName === 'f2l') return '#' + id + (title ? ' · ' + title : '');
        if (setName === 'oll') return 'OLL ' + id + (title ? ' · ' + title : '');
        return id + (title ? ' · ' + title : '');
      }

      function refillBag() {
        var list = casesOf(setName) || [];
        bag = shuffle(list);
        if (bag.length > 1 && lastKey && keyOf(bag[0]) === lastKey) {
          var i = 1 + Math.floor(Math.random() * (bag.length - 1));
          var tmp = bag[0];
          bag[0] = bag[i];
          bag[i] = tmp;
        }
      }

      function setup(c) {
        var my = ++gen;
        busy = true;
        emit();
        engine.reset();
        if (c && c.alg) engine.playAlg(invertAlg(c.alg), false, true);
        return engine.whenIdle().then(function () {
          if (my !== gen) return;
          busy = false;
          emit();
        });
      }

      function nextCase() {
        pendingAdvance = false;
        if (!active || !setName) return;
        var list = casesOf(setName) || [];
        if (!list.length) {
          busy = false;
          emit();
          return;
        }
        if (!bag.length) refillBag();
        current = bag.shift();
        lastKey = keyOf(current);
        setup(current);
      }

      function start(name) {
        if (!SETS[name]) return;
        clearTimeout(nextTimer);
        active = true;
        pendingAdvance = false;
        setName = name;
        current = null;
        lastKey = null;
        bag = [];
        nextCase();
      }

      function retry() {
        if (!active || !current || busy || pendingAdvance) return;
        setup(current);
      }

      function skip() {
        if (!active || busy || pendingAdvance) return;
        nextCase();
      }

      function onSolved() {
        if (!active || !current || busy || pendingAdvance) return;
        if (!engine.isSolved() || engine.stats.moveCount <= 0) return;
        pendingAdvance = true;
        emit();
        var name = labelOf(current);
        toast(t('drillSolved')(name), 'solved');
        nextTimer = setTimeout(function () {
          nextTimer = 0;
          nextCase();
        }, NEXT_MS);
      }

      function close() {
        gen++;
        clearTimeout(nextTimer);
        nextTimer = 0;
        active = false;
        busy = false;
        pendingAdvance = false;
        setName = null;
        current = null;
        lastKey = null;
        bag = [];
        emit();
      }

      return {
        start: start,
        retry: retry,
        skip: skip,
        onSolved: onSolved,
        close: close,
        isActive: function () { return active; },
        isBusy: function () { return busy || pendingAdvance; },
        currentSet: function () { return setName; },
      };
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
