// Lista oficial dos bugs plantados (usada pelo jogo e pela revelação no telão).
window.CATEGORIAS = [
  'Funcional',
  'Cálculo / Regra de negócio',
  'Valor-limite',
  'Navegação',
  'Consistência de dados',
  'Validação de entrada',
  'Segurança / Privacidade',
  'Usabilidade / Acessibilidade',
  'Texto / Ortografia',
  'Performance / Disponibilidade',
];
window.SEVERIDADES = ['Baixa', 'Média', 'Alta', 'Crítica'];

window.PONTOS = { achou: 100, categoria: 30, severidade: 20, esperado: 20, obtido: 20, falsoPositivo: -20 };

window.BUGS = [
  { id: 'notif', titulo: 'Sino diz 4 notificações, mas a lista está vazia', onde: 'Cabeçalho → sino de notificações',
    esperado: 'O número do sino deve bater com a quantidade de notificações listadas.', obtido: 'O sino mostra 4, a tela diz "Não existem notificações".',
    cats: ['Consistência de dados', 'Funcional'], sevs: ['Baixa', 'Média'], tecnica: 'Teste exploratório + teste de integração (contador × lista vêm de fontes diferentes).', real: true },
  { id: 'freq', titulo: 'Frequência calculada errado em Engenharia de Software III', onde: 'Meu curso → Faltas',
    esperado: '18 presenças em 36 aulas = 50,0%.', obtido: 'A tela mostra 52,0%.',
    cats: ['Cálculo / Regra de negócio'], sevs: ['Alta', 'Crítica'], tecnica: 'Teste unitário da fórmula com casos conhecidos (oráculo).', real: false },
  { id: 'limite', titulo: 'Exatamente 75% aparece como "abaixo do mínimo"', onde: 'Meu curso → Faltas → Inteligência Artificial',
    esperado: 'O mínimo é 75%: com 75,0% a aluna está OK, sem alerta.', obtido: 'Aparece o ⚠ de risco com 75,0%.',
    cats: ['Valor-limite', 'Cálculo / Regra de negócio'], sevs: ['Média', 'Alta'], tecnica: 'Análise de valor-limite: testar 74,9 / 75,0 / 75,1.', real: false },
  { id: 'voltar', titulo: '"Voltar" das Notas leva para Faltas', onde: 'Meu curso → Notas → Voltar',
    esperado: 'Voltar deve levar ao Início.', obtido: 'Abre a tela de Faltas.',
    cats: ['Navegação', 'Funcional'], sevs: ['Baixa', 'Média'], tecnica: 'Teste de fluxo / teste E2E automatizado (Cypress, Playwright).', real: false },
  { id: 'cpf', titulo: 'CPF completo exposto na tela', onde: 'Avatar → Dados pessoais',
    esperado: 'CPF mascarado (ex.: ***.456.789-**), conforme a LGPD.', obtido: 'CPF aparece inteiro, em texto puro.',
    cats: ['Segurança / Privacidade'], sevs: ['Alta', 'Crítica'], tecnica: 'Revisão de requisitos de privacidade / checklist LGPD.', real: true },
  { id: 'mfa', titulo: 'Botão "Ativar MFA" não faz nada', onde: 'Avatar → Dados pessoais → MFA',
    esperado: 'Abrir o fluxo de configuração do segundo fator.', obtido: 'Nada acontece ao clicar.',
    cats: ['Funcional', 'Segurança / Privacidade'], sevs: ['Média', 'Alta'], tecnica: 'Teste funcional de cada ação da tela (caso de teste por botão).', real: false },
  { id: 'acento', titulo: '"Ausencia" sem acento', onde: 'Meu curso → Faltas',
    esperado: '"Ausência".', obtido: '"Ausencia".',
    cats: ['Texto / Ortografia'], sevs: ['Baixa'], tecnica: 'Revisão de UI / teste de aceitação visual.', real: true },
  { id: 'media', titulo: 'Média errada em Engenharia de Software III', onde: 'Meu curso → Notas',
    esperado: 'N1 8,0 e N2 6,0 com peso 1 cada → média 7,0 (aprovada).', obtido: 'Mostra média 5,0 e "Abaixo da média".',
    cats: ['Cálculo / Regra de negócio'], sevs: ['Alta', 'Crítica'], tecnica: 'Teste unitário com tabela de decisão (notas × pesos × resultado).', real: false },
  { id: 'horario', titulo: 'Aula que termina antes de começar', onde: 'Meu curso → Horário → Quinta',
    esperado: 'Horário final depois do inicial (20:50 – 22:30).', obtido: '"20:50 – 18:40".',
    cats: ['Consistência de dados', 'Validação de entrada'], sevs: ['Baixa', 'Média'], tecnica: 'Validação de dados no cadastro + teste de consistência.', real: false },
  { id: 'email', titulo: 'Aceita e-mail inválido como "maria@@gmail"', onde: 'Avatar → Dados pessoais → PESSOAL',
    esperado: 'Recusar formatos inválidos e mostrar mensagem de erro.', obtido: 'Qualquer texto é salvo com "sucesso".',
    cats: ['Validação de entrada'], sevs: ['Média', 'Alta'], tecnica: 'Particionamento de equivalência (entradas válidas × inválidas).', real: false },
  { id: 'contraste', titulo: '"Rematrícula" quase invisível', onde: 'Início → Solicitações',
    esperado: 'Contraste mínimo de 4,5:1 (WCAG).', obtido: 'Texto cinza-claro em fundo branco.',
    cats: ['Usabilidade / Acessibilidade'], sevs: ['Baixa', 'Média'], tecnica: 'Teste de acessibilidade (Lighthouse, axe).', real: false },
  { id: 'biblioteca', titulo: 'Biblioteca Digital nunca carrega', onde: 'Início → Biblioteca Digital',
    esperado: 'Abrir a biblioteca, ou mostrar um erro claro com nova tentativa que funcione.', obtido: 'Carregando infinito, e "Recarregar" não resolve.',
    cats: ['Performance / Disponibilidade', 'Funcional'], sevs: ['Média', 'Alta'], tecnica: 'Teste de integração com sistema externo + monitoramento.', real: true },
];

// Calcula a pontuação de um relato
window.pontuarRelato = function (bug, r) {
  const P = window.PONTOS;
  const det = { achou: P.achou, categoria: bug.cats.includes(r.cat) ? P.categoria : 0, severidade: bug.sevs.includes(r.sev) ? P.severidade : 0,
    esperado: (r.esperado || '').trim().length >= 10 ? P.esperado : 0, obtido: (r.obtido || '').trim().length >= 10 ? P.obtido : 0 };
  det.total = det.achou + det.categoria + det.severidade + det.esperado + det.obtido;
  return det;
};
