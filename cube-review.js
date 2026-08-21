// Case review queue (SM-2-lite). Classic script. No DOM.
(function (g) {
  'use strict';

  var KEY = 'cubeReview';
  var DAY = 86400000;

  function emptyStore() {
    return { v: 1, cards: {} };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return emptyStore();
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== 1 || !parsed.cards || typeof parsed.cards !== 'object') {
        return emptyStore();
      }
      return { v: 1, cards: parsed.cards };
    } catch (e) {
      return emptyStore();
    }
  }

  function save(store) {
    try { localStorage.setItem(KEY, JSON.stringify(store)); }
    catch (e) { /* quota / private mode */ }
  }

  var store = load();

  function cardKey(set, id) {
    return String(set) + ':' + String(id);
  }

  function getCard(set, id) {
    return store.cards[cardKey(set, id)] || null;
  }

  function persistCard(set, id, card) {
    store.cards[cardKey(set, id)] = card;
    save(store);
  }

  // ok=true → schedule later; ok=false → due again immediately
  function record(set, id, ok) {
    if (set == null || id == null || id === '') return null;
    var now = Date.now();
    var card = getCard(set, id) || {
      ease: 2.5,
      interval: 0,
      due: now,
      reps: 0,
      lapses: 0,
    };
    if (ok) {
      if (card.reps === 0) card.interval = 1;
      else if (card.reps === 1) card.interval = 3;
      else card.interval = Math.max(1, Math.round(card.interval * card.ease));
      card.reps += 1;
      card.ease = Math.min(3.0, (card.ease || 2.5) + 0.05);
      card.due = now + card.interval * DAY;
    } else {
      card.reps = 0;
      card.interval = 0;
      card.due = now;
      card.ease = Math.max(1.3, (card.ease || 2.5) - 0.2);
      card.lapses = (card.lapses || 0) + 1;
    }
    persistCard(set, id, card);
    return card;
  }

  function isDue(card, now) {
    if (!card) return false;
    return (card.due || 0) <= (now || Date.now());
  }

  function dueCases(set, allCases) {
    var now = Date.now();
    var list = allCases || [];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (!c || c.id == null) continue;
      var card = getCard(set, c.id);
      if (card && isDue(card, now)) out.push(c);
    }
    return out;
  }

  function countDue(set, allCases) {
    return dueCases(set, allCases).length;
  }

  function countTracked(set) {
    var prefix = String(set) + ':';
    var n = 0;
    var keys = Object.keys(store.cards);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf(prefix) === 0) n++;
    }
    return n;
  }

  g.CubeReview = {
    record: record,
    getCard: getCard,
    dueCases: dueCases,
    countDue: countDue,
    countTracked: countTracked,
    isDue: isDue,
    _test: { KEY: KEY, load: load, emptyStore: emptyStore, cardKey: cardKey },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
