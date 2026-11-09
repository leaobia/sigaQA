// Camada de dados: Firebase Realtime Database quando configurado;
// senão, "modo ensaio" local (localStorage + BroadcastChannel entre abas).
window.Store = (() => {
  const cfg = window.FIREBASE_CONFIG || {};
  const temFirebase = typeof firebase !== 'undefined' && cfg.apiKey && cfg.apiKey !== 'COLE_AQUI' && cfg.databaseURL;

  if (temFirebase) {
    firebase.initializeApp(cfg);
    const db = firebase.database();
    let offset = 0;
    db.ref('.info/serverTimeOffset').on('value', s => { offset = s.val() || 0; });
    return {
      modo: 'firebase',
      on(path, cb) { const r = db.ref(path); const h = s => cb(s.val()); r.on('value', h); return () => r.off('value', h); },
      set: (p, v) => db.ref(p).set(v),
      update: (p, v) => db.ref(p).update(v),
      push: (p, v) => db.ref(p).push(v),
      get: p => db.ref(p).get().then(s => s.val()),
      agora: () => Date.now() + offset,
      timestamp: () => firebase.database.ServerValue.TIMESTAMP,
    };
  }

  // ---------- modo ensaio local ----------
  const KEY = 'sigaqa-ensaio-db';
  let canal = null;
  try { canal = new BroadcastChannel('sigaqa-ensaio'); } catch (e) {}
  const ler = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const gravar = t => { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch (e) {} };
  const partes = p => p.split('/').filter(Boolean);
  const pegar = (t, p) => partes(p).reduce((n, k) => (n == null ? null : (n[k] === undefined ? null : n[k])), t);
  function colocar(t, p, v) {
    const ks = partes(p); let n = t;
    for (let i = 0; i < ks.length - 1; i++) { if (typeof n[ks[i]] !== 'object' || n[ks[i]] === null) n[ks[i]] = {}; n = n[ks[i]]; }
    if (v === null || v === undefined) delete n[ks[ks.length - 1]]; else n[ks[ks.length - 1]] = v;
  }
  const ouvintes = new Set();
  function avisar() { ouvintes.forEach(o => o()); }
  if (canal) canal.onmessage = avisar;
  window.addEventListener('storage', e => { if (e.key === KEY) avisar(); });
  function mudou() { avisar(); if (canal) canal.postMessage(1); }
  const clone = v => (v == null ? null : JSON.parse(JSON.stringify(v)));
  const resolverTS = v => JSON.parse(JSON.stringify(v), (k, x) => (x && x['.sv'] === 'timestamp' ? Date.now() : x));

  return {
    modo: 'ensaio',
    on(path, cb) {
      let ult;
      const o = () => { const v = pegar(ler(), path); const s = JSON.stringify(v); if (s !== ult) { ult = s; cb(clone(v)); } };
      ouvintes.add(o); setTimeout(o, 0);
      return () => ouvintes.delete(o);
    },
    async set(p, v) { const t = ler(); colocar(t, p, resolverTS(v)); gravar(t); mudou(); },
    async update(p, v) { const t = ler(); v = resolverTS(v); Object.keys(v).forEach(k => colocar(t, p + '/' + k, v[k])); gravar(t); mudou(); },
    async push(p, v) { const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6); await this.set(p + '/' + id, v); return { key: id }; },
    async get(p) { return clone(pegar(ler(), p)); },
    agora: () => Date.now(),
    timestamp: () => ({ '.sv': 'timestamp' }),
  };
})();
