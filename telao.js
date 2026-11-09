// ================== Caça aos Bugs · telão (apresentadora) ==================
(() => {
const $ = s => document.querySelector(s);
const BUGS = window.BUGS;
const params = new URLSearchParams(location.search);

const gerarCodigo = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join('');
let sala = (params.get('sala') || localStorage.getItem('sigaqa-sala-host') || '').toUpperCase();
if (!sala) sala = gerarCodigo();
localStorage.setItem('sigaqa-sala-host', sala);

let estado = null, jogadores = {}, feed = {}, revIdx = 0, vista = '';
const desinscrever = [];

if (Store.modo === 'ensaio') $('#aviso-ensaio').classList.remove('oculto');
$('#tot-bugs').textContent = BUGS.length;

async function iniciarSala() {
  desinscrever.splice(0).forEach(f => f());
  const est = await Store.get(`salas/${sala}/estado`);
  if (!est) await Store.set(`salas/${sala}/estado`, { status: 'lobby', duracao: 420, criada: Store.timestamp() });
  const urlJog = new URL('index.html?sala=' + sala, location.href).href;
  $('#codigo').textContent = sala;
  $('#url').textContent = urlJog;
  $('#qr').innerHTML = '';
  if (window.QRCode) new QRCode($('#qr'), { text: urlJog, width: 300, height: 300, correctLevel: QRCode.CorrectLevel.M });
  else $('#qr').innerHTML = '<div style="color:#333;padding:40px;font-size:18px">QR code indisponível<br>(sem internet)</div>';
  history.replaceState(null, '', '?sala=' + sala);
  desinscrever.push(Store.on(`salas/${sala}/estado`, v => { estado = v; atualizar(); }));
  desinscrever.push(Store.on(`salas/${sala}/jogadores`, v => { jogadores = v || {}; atualizar(); }));
  desinscrever.push(Store.on(`salas/${sala}/feed`, v => { feed = v || {}; renderFeed(); }));
}

function lista() {
  return Object.entries(jogadores)
    .map(([id, j]) => ({ id, nome: j.nome || '?', pontos: j.pontos || 0, bugs: Object.keys(j.achados || {}).length, achados: j.achados || {}, ultimo: j.ultimo || Infinity }))
    // empate em pontos: fica na frente quem chegou primeiro naquela pontuação
    .sort((a, b) => b.pontos - a.pontos || a.ultimo - b.ultimo);
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = s => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

function mostrarVista(v) {
  if (vista === v) return;
  vista = v;
  ['lobby', 'jogo', 'fim', 'revela'].forEach(n => $('#v-' + n).classList.toggle('oculto', n !== v));
}

function atualizar() {
  if (!estado) return;
  const js = lista();
  if (estado.status === 'lobby') {
    mostrarVista('lobby');
    $('#qtd-jog').textContent = js.length;
    $('#chips').innerHTML = js.map(j => `<span class="chip">${esc(j.nome)}</span>`).join('');
    $('#sel-duracao').value = String(estado.duracao || 420);
  } else if (estado.status === 'jogando') {
    mostrarVista('jogo');
    $('#rank').innerHTML = rankHtml(js.slice(0, 10));
    $('#tot-relatos').textContent = js.reduce((a, j) => a + j.bugs, 0);
  } else if (estado.status === 'fim') {
    if (vista !== 'revela') mostrarVista('fim');
    const cores = ['#ffd54a', '#cfd8dc', '#d7a26a'], alturas = [220, 160, 120], ordem = [1, 0, 2];
    $('#podio').innerHTML = ordem.filter(i => js[i]).map(i => `<div class="degrau"><div class="nome">${esc(js[i].nome)}</div>
      <div class="bloco" style="height:${alturas[i]}px;background:${cores[i]}">${i + 1}º<span style="font-size:22px">${js[i].pontos} pts</span></div></div>`).join('');
    $('#rank-final').innerHTML = rankHtml(js.slice(3), 4);
    if (vista === 'revela') renderRevela();
  }
}
const rankHtml = (js, ini = 1) => js.map((j, i) =>
  `<li><span class="pos">${i + ini}º</span><span>${esc(j.nome)}</span><span class="bg">🐞 ${j.bugs}</span><span class="pts">${j.pontos}</span></li>`).join('');

function renderFeed() {
  const itens = Object.values(feed).sort((a, b) => (b.t || 0) - (a.t || 0)).slice(0, 7);
  $('#feed').innerHTML = itens.map(f => `<li>🐞 <b>${esc(f.nome)}</b> encontrou um bug! <b style="color:#4caf50">+${f.pts}</b></li>`).join('')
    || '<li style="border-color:#2a323c;color:#9aa5b1">Esperando o primeiro bug…</li>';
}

// relógio: o telão é quem encerra o jogo quando o tempo acaba
setInterval(() => {
  if (!estado || estado.status !== 'jogando') return;
  const rest = (estado.inicio + estado.duracao * 1000 - Store.agora()) / 1000;
  $('#timer').textContent = fmt(rest);
  $('#timer').classList.toggle('alerta', rest < 60);
  if (rest <= 0) Store.update(`salas/${sala}/estado`, { status: 'fim' });
}, 300);

$('#sel-duracao').onchange = e => Store.update(`salas/${sala}/estado`, { duracao: Number(e.target.value) });
$('#bt-comecar').onclick = async () => {
  await Store.set(`salas/${sala}/feed`, null);
  await Store.update(`salas/${sala}/estado`, { status: 'jogando', inicio: Store.timestamp(), duracao: Number($('#sel-duracao').value) });
};
$('#bt-encerrar').onclick = () => { $('#bt-encerrar').textContent = 'Clique de novo para confirmar'; $('#bt-encerrar').onclick = () => Store.update(`salas/${sala}/estado`, { status: 'fim' }); };
$('#bt-revelar').onclick = () => { revIdx = 0; mostrarVista('revela'); renderRevela(); };
$('#bt-ant').onclick = () => { if (revIdx > 0) { revIdx--; renderRevela(); } };
$('#bt-prox').onclick = () => { if (revIdx < BUGS.length) { revIdx++; renderRevela(); } };
document.addEventListener('keydown', e => {
  if (vista !== 'revela') return;
  if (revIdx < BUGS.length && (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown')) { e.preventDefault(); $('#bt-prox').click(); }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); $('#bt-ant').click(); }
});
$('#bt-nova-sala').onclick = () => {
  if (!confirmarDuplo($('#bt-nova-sala'), 'Confirmar nova sala?')) return;
  sala = gerarCodigo(); localStorage.setItem('sigaqa-sala-host', sala); vista = ''; iniciarSala();
};
function confirmarDuplo(btn, txt) {
  if (btn.dataset.conf) { delete btn.dataset.conf; btn.textContent = 'Nova sala'; return true; }
  btn.dataset.conf = 1; btn.textContent = txt; setTimeout(() => { delete btn.dataset.conf; btn.textContent = 'Nova sala'; }, 4000); return false;
}

function renderRevela() {
  const js = lista();
  const total = js.length || 1;
  $('#bt-ant').disabled = revIdx === 0;
  if (revIdx >= BUGS.length) {
    const taxas = BUGS.map(b => ({ b, n: js.filter(j => j.achados[b.id] !== undefined).length })).sort((x, y) => y.n - x.n);
    $('#revela').innerHTML = `<div class="num">Resumo</div><h2>O que a turma encontrou</h2>
      <div class="grid2">
        <div class="bx"><small>Mais encontrados</small>${taxas.filter(t => t.n > 0).slice(0, 3).map(t => `✅ ${esc(t.b.titulo)} <b>(${Math.round(t.n / total * 100)}%)</b>`).join('<br>') || '—'}</div>
        <div class="bx"><small>Passaram despercebidos</small>${taxas.slice(-3).reverse().map(t => `🙈 ${esc(t.b.titulo)} <b>(${Math.round(t.n / total * 100)}%)</b>`).join('<br>')}</div>
      </div>
      <div class="bx"><small>Lição</small>${js.some(j => j.bugs === BUGS.length) ? 'Teve gente que achou tudo, mas foi preciso olhar com muitas lentes diferentes.' : 'Ninguém achou tudo sozinho.'} Testar bem exige <b>técnicas diferentes</b> (valor-limite, particionamento, exploratório, acessibilidade, automação) e <b>relatos claros</b>, pra quem for corrigir.</div>`;
    $('#bt-prox').textContent = 'Nova rodada ↺';
    $('#bt-prox').onclick = novaRodada;
    return;
  }
  $('#bt-prox').textContent = 'Próximo ▶';
  $('#bt-prox').onclick = () => { if (revIdx < BUGS.length) { revIdx++; renderRevela(); } };
  const b = BUGS[revIdx];
  const n = js.filter(j => j.achados[b.id] !== undefined).length;
  const pct = js.length ? Math.round(n / js.length * 100) : 0;
  $('#revela').innerHTML = `
    <div class="num">Bug ${revIdx + 1} de ${BUGS.length}</div>
    <h2>${esc(b.titulo)}${b.real ? '<span class="real">🔎 visto no SIGA real</span>' : ''}</h2>
    <div class="onde">📍 ${esc(b.onde)}</div>
    <div class="grid2">
      <div class="bx"><small>Resultado esperado</small>${esc(b.esperado)}</div>
      <div class="bx"><small>Resultado obtido</small>${esc(b.obtido)}</div>
      <div class="bx"><small>Categoria · Severidade</small>${esc(b.cats.join(' / '))}<br><b>${esc(b.sevs.join(' ou '))}</b></div>
      <div class="bx"><small>Como o QA pegaria</small>${esc(b.tecnica)}</div>
    </div>
    <div class="bx"><small>Encontrado por</small><b>${n}</b> de ${js.length} pessoas (${pct}%)<div class="barra"><div style="width:${pct}%"></div></div></div>`;
}

async function novaRodada() {
  revIdx = 0; vista = '';
  // mantém os jogadores conectados, zera pontos
  const upd = {};
  Object.keys(jogadores).forEach(id => { upd[id] = { nome: jogadores[id].nome, pontos: 0, falsos: 0 }; });
  await Store.set(`salas/${sala}/jogadores`, Object.keys(upd).length ? upd : null);
  await Store.set(`salas/${sala}/feed`, null);
  await Store.update(`salas/${sala}/estado`, { status: 'lobby' });
}

iniciarSala();
})();
