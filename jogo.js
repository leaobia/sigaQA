// ================== Caça aos Bugs · lado do jogador ==================
(() => {
const $ = s => document.querySelector(s);
const P = window.PONTOS;
const BUG = Object.fromEntries(window.BUGS.map(b => [b.id, b]));
const params = new URLSearchParams(location.search);

let sala = (params.get('sala') || '').toUpperCase();
let pid = sessionStorage.getItem('sigaqa-pid');
if (!pid) { pid = 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); sessionStorage.setItem('sigaqa-pid', pid); }
let nome = sessionStorage.getItem('sigaqa-nome') || '';
let achados = {};      // bugId -> pontos do relato
let falsos = 0;
let fimEm = null;      // timestamp de término
let fase = 'entrar';   // entrar | espera | jogo | fim
let cacando = false;
let pagina = 'inicio';
let emailPessoal = 'maria.teste@gmail.com';
let inscrito = false;

// ---------------- telas ----------------
function mostrar(t) {
  fase = t;
  ['entrar', 'espera', 'jogo', 'fim'].forEach(n => $('#tela-' + n).classList.toggle('oculto', n !== t));
  if (t === 'jogo') { render(pagina); atualizarHud(); }
  if (t === 'fim') {
    sairCaca(); fecharModal();
    $('#fim-pontos').textContent = pontos();
    const n = Object.keys(achados).length;
    $('#fim-resumo').textContent = `Você encontrou ${n} de ${window.BUGS.length} bugs` + (falsos ? ` e teve ${falsos} falso(s) positivo(s).` : '.');
  }
}

const pontos = () => Math.max(0, Object.values(achados).reduce((a, b) => a + b, 0) + falsos * P.falsoPositivo);
const fmt = s => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

function atualizarHud() {
  $('#hud-pontos').textContent = '🏆 ' + pontos();
  $('#hud-bugs').textContent = '🐞 ' + Object.keys(achados).length + '/' + window.BUGS.length;
}

setInterval(() => {
  if (fase !== 'jogo' || !fimEm) return;
  const rest = (fimEm - Store.agora()) / 1000;
  const el = $('#hud-tempo');
  el.textContent = '⏱ ' + fmt(rest);
  el.classList.toggle('alerta', rest < 60);
  if (rest <= 0) mostrar('fim');
}, 300);

// ---------------- entrada ----------------
$('#in-sala').value = sala;
$('#in-nome').value = nome;
if (sala) $('#in-sala').classList.add('oculto');

$('#bt-entrar').onclick = async () => {
  const s = $('#in-sala').value.trim().toUpperCase();
  const n = $('#in-nome').value.trim();
  const erro = $('#erro-entrar');
  if (!s) return (erro.textContent = 'Digite o código da sala que está no telão.');
  if (n.length < 2) return (erro.textContent = 'Escolha um apelido (mínimo 2 letras).');
  erro.textContent = 'Entrando…';
  try {
    const est = await Store.get(`salas/${s}/estado`);
    if (!est) { $('#in-sala').classList.remove('oculto'); return (erro.textContent = 'Sala não encontrada. Confira o código no telão.'); }
    sala = s; nome = n;
    sessionStorage.setItem('sigaqa-nome', nome);
    const eu = await Store.get(`salas/${sala}/jogadores/${pid}`);
    if (eu) { achados = eu.achados || {}; falsos = eu.falsos || 0; }
    await Store.update(`salas/${sala}/jogadores/${pid}`, { nome, pontos: pontos(), falsos, visto: Store.timestamp() });
    erro.textContent = '';
    $('#espera-nome').textContent = nome;
    if (!inscrito) { inscrito = true; Store.on(`salas/${sala}/estado`, aplicarEstado); }
  } catch (e) {
    console.error(e);
    erro.textContent = 'Não consegui conectar. Verifique a internet e tente de novo.';
  }
};

function aplicarEstado(est) {
  if (!est) return;
  if (est.status === 'lobby') { achados = {}; falsos = 0; pagina = 'inicio'; mostrar('espera'); }
  else if (est.status === 'jogando') {
    fimEm = est.inicio + est.duracao * 1000;
    if (Store.agora() >= fimEm) mostrar('fim'); else if (fase !== 'jogo') mostrar('jogo');
  } else if (est.status === 'fim') mostrar('fim');
}

function sincronizar(bugId, pts) {
  if (!sala) return;
  // "ultimo" = momento em que a pessoa chegou à pontuação atual (desempate: quem chegou antes vence)
  const upd = { pontos: pontos(), falsos, visto: Store.timestamp(), ultimo: Store.timestamp() };
  if (bugId) upd['achados/' + bugId] = pts;
  Store.update(`salas/${sala}/jogadores/${pid}`, upd).catch(console.error);
  if (bugId) Store.push(`salas/${sala}/feed`, { nome, pts, t: Store.timestamp() }).catch(console.error);
}

// ---------------- dados fictícios ----------------
const DISC = [
  { cod: 'HSO015', nome: 'Ética e Responsabilidade Social', doc: 'PROF. CARLOS SILVA', aulas: 40, pres: 24,
    notas: [['P1 - Prova Objetiva 1', 1, 7.5], ['P2 - Prova Objetiva 2', 1, 8.5]] },
  { cod: 'IES016', nome: 'Engenharia de Software III', doc: 'PROFª. ANA SOUZA', aulas: 36, pres: 18,
    notas: [['N1 - Projeto', 1, 8.0], ['N2 - Individual', 1, 6.0]] },
  { cod: 'IIA010', nome: 'Inteligência Artificial', doc: 'PROF. RAFAEL LIMA', aulas: 40, pres: 30,
    notas: [['P1 - Prova 1', 1, 9.0], ['P2 - Prova 2', 1, 7.0]] },
  { cod: 'ILP029', nome: 'Programação para Dispositivos Móveis', doc: 'PROFª. JULIA COSTA', aulas: 32, pres: 30,
    notas: [['P1 - Prova', 1, 6.0], ['P2 - Projeto', 2, 9.0]] },
];
const num = (v, c = 1) => v.toFixed(c).replace('.', ',');
function media(d) {
  if (d.cod === 'IES016') return 5.0; // BUG plantado: "media"
  const sp = d.notas.reduce((a, n) => a + n[1], 0);
  return d.notas.reduce((a, n) => a + n[1] * n[2], 0) / sp;
}
function freq(d) {
  if (d.cod === 'IES016') return 52.0; // BUG plantado: "freq"
  return (d.pres / d.aulas) * 100;
}
const abaixoMinimo = f => f <= 75; // BUG plantado: "limite" (deveria ser < 75)

// ---------------- páginas do clone ----------------
const voltar = (tit, sub, destino = 'inicio', bug = '') =>
  `<div class="barra-voltar"><button data-ir="${destino}" ${bug ? `data-bug="${bug}"` : ''}>‹ Voltar</button><div class="tit"><b>${tit}</b><small>${sub}</small></div></div>`;
const tile = (ic, txt, ir, extra = '') => `<button class="tile" data-ir="${ir}" ${extra}><span class="ic">${ic}</span>${txt}</button>`;

const PAGINAS = {
  inicio: () => `
    <div class="card" id="meucurso">
      <div class="card-cab"><div class="ic">🏛️</div><div><h3>Meu curso</h3><small>Notas, faltas, horário e mais</small></div></div>
      <div class="grade">
        ${tile('📝', 'Notas', 'notas')}${tile('✅', 'Faltas', 'faltas')}${tile('🕒', 'Horário', 'horario')}
        ${tile('📚', 'Disciplinas', 'disciplinas')}${tile('📜', 'Histórico', 'historico')}${tile('🎓', 'Exame Final', 'exame')}
      </div>
    </div>
    <div class="card">
      <div class="card-cab"><div class="ic">📥</div><div><h3>Solicitações</h3><small>Revisão, regime domiciliar e rematrícula</small></div></div>
      <div class="grade">
        ${tile('🔄', 'Rev. Notas/Faltas', 'revisao')}${tile('🏠', 'Regime Domiciliar', 'regime')}
        <button class="tile apagado" data-ir="rematricula" data-bug="contraste"><span class="ic">↻</span>Rematrícula</button>
      </div>
    </div>
    <div class="card">
      <div class="card-cab"><div class="ic">📂</div><div><h3>Documentos</h3><small>Declarações e outros</small></div></div>
      <div class="grade">${tile('📄', 'Documentos', 'documentos')}</div>
    </div>
    <div class="card">
      <div class="card-cab"><div class="ic">📖</div><div><h3>Biblioteca Digital</h3><small>Livros diversos</small></div></div>
      <div class="grade">${tile('📘', 'Biblioteca Digital', 'biblioteca')}</div>
    </div>
    <div class="card info-aluno">
      <div class="card-cab"><div class="avatar" style="border-color:#c8d6e5">MT</div><div><h3>MARIA TESTE</h3><small>RA 0000000000001</small></div></div>
      <div class="linhas">
        <div class="linha"><span>Status</span><b>Em Curso</b></div>
        <div class="linha"><span>Curso</span><b>Análise e Desenvolvimento de Sistemas</b></div>
        <div class="linha"><span>Turno</span><b>Noite</b></div>
        <div class="linha"><span>Unidade</span><b>Fatec Exemplo</b></div>
      </div>
      <button class="link" data-ir="indices">Ver índices e prazos</button>
    </div>`,

  notas: () => voltar('Consulta notas', 'Notas do semestre', 'faltas', 'voltar') + // BUG plantado: "voltar"
    `<p class="legenda">Média = soma(nota × peso) ÷ soma dos pesos. Média mínima para aprovação: <b>6,0</b>.</p>` +
    DISC.map(d => {
      const m = media(d);
      return `<div class="card" ${d.cod === 'IES016' ? 'data-bug="media"' : ''}>
        <div class="disc-cab"><small>${d.cod}</small><b>${d.nome}</b></div>
        <div class="linhas">
          ${d.notas.map(n => `<div class="linha"><span>${n[0]} <small style="color:#888">(peso ${n[1]})</small></span><b>${num(n[2])}</b></div>`).join('')}
          <div class="linha"><span><b>Média</b></span><b class="${m >= 6 ? 'ok' : 'ruim'}">${num(m)} · ${m >= 6 ? 'Na média' : 'Abaixo da média'}</b></div>
        </div></div>`;
    }).join(''),

  faltas: () => voltar('Faltas', 'Faltas no semestre') +
    `<p class="legenda">Frequência mínima para aprovação: <b>75%</b>. ⚠ = frequência abaixo do mínimo.</p>` +
    DISC.map(d => {
      const f = freq(d);
      const bug = d.cod === 'IES016' ? 'data-bug="freq"' : d.cod === 'IIA010' ? 'data-bug="limite"' : '';
      return `<div class="card" ${bug}>
        <div class="disc-cab"><small>${d.cod}</small><b>${d.nome}</b></div>
        <div class="docente">Docente: ${d.doc}</div>
        <div class="linhas">
          <div class="linha"><span>Aulas</span><b>${d.aulas}</b></div>
          <div class="linha"><span>Presença</span><b>${d.pres}</b></div>
          <div class="linha"><span data-bug="acento">Ausencia</span><b>${d.aulas - d.pres}</b></div>
          <div class="linha"><span>Frequência</span><b class="${abaixoMinimo(f) ? 'aviso' : 'ok'}">${abaixoMinimo(f) ? '⚠ ' : ''}${num(f)}%</b></div>
        </div></div>`;
    }).join(''),

  horario: () => voltar('Horário', 'Grade semanal') + `
    <table class="tab"><tr><th>Dia</th><th>Horário</th><th>Disciplina</th><th>Sala</th></tr>
    <tr><td>Segunda</td><td>19:00 – 20:40</td><td>HSO015</td><td>12</td></tr>
    <tr><td>Segunda</td><td>20:50 – 22:30</td><td>IES016</td><td>Lab 3</td></tr>
    <tr><td>Terça</td><td>19:00 – 20:40</td><td>IIA010</td><td>Lab 1</td></tr>
    <tr><td>Terça</td><td>20:50 – 22:30</td><td>IIA010</td><td>Lab 1</td></tr>
    <tr><td>Quarta</td><td>19:00 – 20:40</td><td>ILP029</td><td>Lab 2</td></tr>
    <tr><td>Quarta</td><td>20:50 – 22:30</td><td>ILP029</td><td>Lab 2</td></tr>
    <tr><td>Quinta</td><td>19:00 – 20:40</td><td>IES016</td><td>Lab 3</td></tr>
    <tr data-bug="horario"><td>Quinta</td><td>20:50 – 18:40</td><td>IES016</td><td>Lab 3</td></tr>
    <tr><td>Sexta</td><td>19:00 – 20:40</td><td>HSO015</td><td>12</td></tr>
    </table>`,

  disciplinas: () => voltar('Disciplinas', '5º semestre · Noite') +
    DISC.map(d => `<div class="card"><div class="disc-cab"><small>${d.cod}</small><b>${d.nome}</b></div><div class="docente" style="padding-bottom:10px">Docente: ${d.doc}</div></div>`).join(''),

  historico: () => voltar('Histórico', 'Semestres anteriores') + `
    <p class="legenda">Aprovação: média ≥ 6,0 e frequência ≥ 75%.</p>
    <table class="tab"><tr><th>Sem.</th><th>Disciplina</th><th>Média</th><th>Freq.</th><th>Situação</th></tr>
    <tr><td>2026/1</td><td>Engenharia de Software II</td><td>7,5</td><td>88%</td><td class="ok">Aprovada</td></tr>
    <tr><td>2026/1</td><td>Banco de Dados</td><td>6,0</td><td>80%</td><td class="ok">Aprovada</td></tr>
    <tr><td>2026/1</td><td>Estatística Aplicada</td><td>5,5</td><td>90%</td><td class="ruim">Reprovada</td></tr>
    <tr><td>2025/2</td><td>Programação Web</td><td>8,0</td><td>75%</td><td class="ok">Aprovada</td></tr>
    <tr><td>2025/2</td><td>Sistemas Operacionais</td><td>9,0</td><td>70%</td><td class="ruim">Reprovada</td></tr>
    </table>`,

  exame: () => voltar('Exame Final', 'Inscrições') + `<div class="vazio">Não há exames finais disponíveis para você neste semestre.</div>`,

  revisao: () => voltar('Revisão de Notas/Faltas', 'Nova solicitação') + `
    <div class="dados-box">
      <label><b>Disciplina</b></label>
      <select id="rev-disc" style="width:100%;padding:8px;margin:6px 0 10px">${DISC.map(d => `<option>${d.cod} - ${d.nome}</option>`).join('')}</select>
      <label><b>Motivo</b></label>
      <textarea id="rev-motivo" style="width:100%;min-height:70px;padding:8px;margin-top:6px"></textarea>
      <button class="btn" style="margin-top:10px" data-acao="enviar-revisao">Enviar</button>
      <div id="rev-msg"></div>
    </div>`,

  regime: () => voltar('Regime Domiciliar', 'Informações') + `<div class="vazio">O pedido de regime domiciliar deve ser feito na secretaria, com atestado médico, em até 5 dias úteis.</div>`,
  rematricula: () => voltar('Rematrícula', 'Prazos') + `<div class="vazio">A rematrícula estará disponível de <b>01/12</b> a <b>10/12</b>. Volte nesse período.</div>`,

  documentos: () => voltar('Documentos', 'Declarações') + `
    <div class="dados-box"><div class="linha" style="align-items:center"><span>Declaração de matrícula</span><button class="btn" data-acao="gerar-doc">Gerar</button></div><div id="doc-msg"></div></div>`,

  biblioteca: () => voltar('Acessar', 'Biblioteca Digital') + `
    <div data-bug="biblioteca" style="text-align:center;background:#fff;border:1px solid #e1e4e8;border-radius:8px;padding:18px">
      <div style="font-weight:800;font-size:20px;color:#b71c1c">📚 BIBLIOTECA DIGITAL</div>
      <div class="spinner"></div>
      <div style="color:#555">Conectando à Minha Biblioteca…</div>
      <button class="link" data-acao="recarregar">↻ Recarregar</button>
      <div style="color:#c62828;font-size:13px">Caso <b>não carregue</b>, volte ao início e clique novamente no botão para <b>recarregar o acesso!</b></div>
    </div>`,

  notificacoes: () => voltar('Notificações', 'Avisos da secretaria') + `<div class="vazio" data-bug="notif">Não existem notificações a serem apresentadas</div>`,

  indices: () => voltar('Índices e prazos', 'Situação acadêmica') + `
    <div class="card"><div class="linhas">
      <div class="linha"><span>Percentual de progressão</span><b>45,0%</b></div>
      <div class="linha"><span>Percentual de rendimento</span><b>7,8</b></div>
      <div class="linha"><span>Semestre atual</span><b>5</b></div>
      <div class="linha"><span>Prazo máximo (semestres)</span><b>10</b></div>
      <div class="linha"><span>Prazo mínimo (semestres)</span><b>6</b></div>
      <div class="linha"><span>Semestres cursados</span><b>4</b></div>
    </div></div>`,

  dados: (aba = 'MFA') => `
    <div class="abas">${['MFA', 'PESSOAL', 'CPF', 'FOTO'].map(a => `<button class="${a === aba ? 'ativa' : ''}" data-aba="${a}">${a}</button>`).join('')}</div>
    <div class="dados-box">
      <div style="font-weight:700;margin-bottom:6px">MARIA TESTE</div>
      <div class="l" data-bug="cpf"><b>CPF:</b><span>12345678909</span></div>
      <div class="l"><b>E-mail:</b><span>maria.teste@fatec.exemplo</span></div>
      <div class="l"><b>E-mail pessoal:</b><span id="email-atual">${esc(emailPessoal)}</span></div>
    </div>
    <div class="dados-box" id="aba-conteudo">${ABAS[aba]()}</div>`,
};

const ABAS = {
  MFA: () => `<b>Autenticação em dois fatores (MFA)</b><p>Situação: <span class="ruim">Desativada</span></p>
    <button class="btn" data-bug="mfa" data-acao="nada">Ativar MFA</button>`,
  PESSOAL: () => `<div data-bug="email"><b>Alterar e-mail pessoal</b>
    <div class="form-linha"><input id="in-email" value="${esc(emailPessoal)}" inputmode="email"><button class="btn" data-acao="salvar-email">Salvar</button></div>
    <div id="email-msg"></div></div>`,
  CPF: () => `<p style="margin:0">(1) Informe a secretaria caso o CPF exibido não lhe pertença.</p><p style="margin:8px 0 0">(2) Mantenha seu e-mail pessoal atualizado para continuar vinculado(a) após concluir o curso.</p>`,
  FOTO: () => `<b>Foto 3x4</b><p style="font-size:13px;color:#555">Envie uma foto de rosto, fundo claro.</p><input type="file" accept="image/*" id="in-foto"><div id="foto-prev" style="margin-top:10px"></div>`,
};

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function render(p, arg) {
  pagina = p;
  $('#app').innerHTML = PAGINAS[p](arg);
  window.scrollTo(0, 0);
}

// ---------------- navegação e ações (modo normal) ----------------
document.addEventListener('click', e => {
  if (fase !== 'jogo' || cacando) return;
  const ir = e.target.closest('[data-ir]');
  if (ir) {
    render(ir.dataset.ir);
    if (ir.dataset.rolar) { const el = document.getElementById(ir.dataset.rolar); if (el) el.scrollIntoView(); }
    return;
  }
  const aba = e.target.closest('[data-aba]');
  if (aba) { render('dados', aba.dataset.aba); return; }
  const ac = e.target.closest('[data-acao]');
  if (!ac) return;
  const a = ac.dataset.acao;
  if (a === 'sair') toast('Durante a caça não dá pra sair 😉');
  else if (a === 'nada') { /* BUG plantado: "mfa" — o botão não faz nada */ }
  else if (a === 'salvar-email') {
    const v = $('#in-email').value.trim();
    const msg = $('#email-msg');
    if (!v) { msg.className = 'msg-erro'; msg.textContent = 'Informe um e-mail.'; return; }
    // BUG plantado: "email" — não valida o formato
    emailPessoal = v; $('#email-atual').textContent = v;
    msg.className = 'msg-ok'; msg.textContent = '✓ E-mail salvo com sucesso!';
  } else if (a === 'recarregar') render('biblioteca'); // BUG plantado: "biblioteca" — continua sem carregar
  else if (a === 'gerar-doc') { $('#doc-msg').className = 'msg-ok'; $('#doc-msg').textContent = '✓ Declaração gerada (simulação de treino).'; }
  else if (a === 'enviar-revisao') {
    const m = $('#rev-motivo').value.trim(); const msg = $('#rev-msg');
    if (m.length < 5) { msg.className = 'msg-erro'; msg.textContent = 'Descreva o motivo da solicitação.'; return; }
    msg.className = 'msg-ok'; msg.textContent = '✓ Solicitação enviada! Protocolo 2026-' + String(Math.floor(Math.random() * 90000) + 10000);
    $('#rev-motivo').value = '';
  }
});
document.addEventListener('change', e => {
  if (e.target.id !== 'in-foto' || !e.target.files[0]) return;
  const r = new FileReader();
  r.onload = () => { $('#foto-prev').innerHTML = `<img src="${r.result}" style="width:90px;height:120px;object-fit:cover;border-radius:6px;border:1px solid #ccc"><div class="msg-ok">✓ Foto enviada para análise.</div>`; };
  r.readAsDataURL(e.target.files[0]);
});

// ---------------- modo caça ----------------
$('#fab').onclick = e => { e.stopPropagation(); cacando ? sairCaca() : entrarCaca(); };
function entrarCaca() {
  cacando = true; document.body.classList.add('cacando');
  $('#fab').textContent = '✕ Cancelar';
  const b = document.createElement('div'); b.className = 'banner-caca'; b.id = 'banner-caca';
  b.textContent = '🎯 Toque exatamente onde está o bug'; document.body.appendChild(b);
}
function sairCaca() {
  cacando = false; document.body.classList.remove('cacando');
  $('#fab').textContent = '🐞 Achei um bug!';
  const b = $('#banner-caca'); if (b) b.remove();
}
document.addEventListener('click', e => {
  if (!cacando || fase !== 'jogo') return;
  if (e.target.closest('#fab, #banner-caca, .hud, .modal-fundo')) return;
  e.preventDefault(); e.stopPropagation();
  const alvo = e.target.closest('[data-bug]');
  sairCaca();
  if (alvo) abrirRelato(alvo.dataset.bug);
  else {
    falsos++; atualizarHud(); sincronizar();
    toast(`Falso positivo! Isso está funcionando como esperado (${P.falsoPositivo} pts)`, 'ruim');
  }
}, true);
// impede que o teclado/inputs reajam durante a caça
document.addEventListener('focusin', e => { if (cacando && !e.target.closest('.modal-fundo')) e.target.blur(); });

function abrirRelato(id) {
  if (achados[id] !== undefined) return toast('Você já reportou esse bug 😉');
  const bug = BUG[id];
  const fundo = document.createElement('div'); fundo.className = 'modal-fundo'; fundo.id = 'modal';
  fundo.innerHTML = `<div class="modal">
    <h2>🎯 Bug encontrado!</h2>
    <div class="dica">Escolha a categoria e a severidade para ganhar até ${P.categoria + P.severidade} pontos a mais.</div>
    <label>Categoria</label>
    <select id="r-cat"><option value="">Escolha…</option>${window.CATEGORIAS.map(c => `<option>${c}</option>`).join('')}</select>
    <label>Severidade</label>
    <select id="r-sev"><option value="">Escolha…</option>${window.SEVERIDADES.map(c => `<option>${c}</option>`).join('')}</select>
    <div class="erro-txt" id="r-erro"></div>
    <div class="acoes"><button class="btn sec" id="r-cancelar">Cancelar</button><button class="btn" id="r-enviar">Enviar relato</button></div>
  </div>`;
  document.body.appendChild(fundo);
  $('#r-cancelar').onclick = fecharModal;
  $('#r-enviar').onclick = () => {
    if (fase !== 'jogo') return fecharModal();
    const r = { cat: $('#r-cat').value, sev: $('#r-sev').value };
    if (!r.cat || !r.sev) return ($('#r-erro').textContent = 'Escolha a categoria e a severidade.');
    const det = window.pontuarRelato(bug, r);
    achados[id] = det.total; atualizarHud(); sincronizar(id, det.total);
    const item = (ok, txt, pts) => `<li>${ok ? '✅' : '❌'} ${txt}${ok ? ` <b>+${pts}</b>` : ''}</li>`;
    fundo.querySelector('.modal').innerHTML = `
      <h2>+${det.total} pontos!</h2>
      <div class="dica">${esc(bug.titulo)}</div>
      <ul class="resultado">
        ${item(true, 'Bug encontrado', det.achou)}
        ${item(det.categoria, det.categoria ? 'Categoria certa' : 'Categoria — esperado: ' + bug.cats.join(' ou '), det.categoria)}
        ${item(det.severidade, det.severidade ? 'Severidade certa' : 'Severidade — esperado: ' + bug.sevs.join(' ou '), det.severidade)}
      </ul>
      <div class="acoes"><button class="btn" id="r-ok">Continuar caçando</button></div>`;
    $('#r-ok').onclick = fecharModal;
  };
}
function fecharModal() { const m = $('#modal'); if (m) m.remove(); }

let toastTimer;
function toast(txt, tipo = '') {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.className = 'toast ' + tipo; t.textContent = txt; t.classList.remove('oculto');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('oculto'), 2600);
}

// reconexão automática se a página recarregar no meio do jogo
if (sala && nome) $('#bt-entrar').click();
})();
