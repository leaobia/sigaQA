# 🐞 Caça aos Bugs · SIGA-QA

Jogo para a apresentação de Quality Assurance: um clone de treino do SIGA com **12 bugs plantados**.
A turma joga pelo celular (QR code) e o telão mostra o ranking ao vivo, estilo Gartic.

- `telao.html`: abra no notebook ligado ao projetor (sala, QR code, cronômetro, ranking e revelação dos bugs)
- `index.html`: o que a turma abre no celular (o QR code já leva pra cá com o código da sala)

---

## 1. Criar o Firebase (≈10 min, grátis)

1. Acesse https://console.firebase.google.com e clique em **Adicionar projeto** (pode desativar o Google Analytics).
2. No menu da esquerda: **Criação → Realtime Database → Criar banco de dados**.
   - Local: `United States (us-central1)` mesmo.
   - Modo: **Iniciar no modo bloqueado** (a gente troca as regras já já).
3. Na aba **Regras** do Realtime Database, apague tudo, cole o conteúdo de `database.rules.json` e clique em **Publicar**.
4. Volte à página inicial do projeto, clique no ícone **`</>` (Web)**, dê um nome (ex.: `siga-qa`) e **registre o app** (sem marcar Hosting).
5. O Firebase mostra um bloco `const firebaseConfig = { ... }`. Copie os valores para o arquivo **`firebase-config.js`**, substituindo o `COLE_AQUI`.
   - Confira se o `databaseURL` veio preenchido (algo como `https://siga-qa-xxxx-default-rtdb.firebaseio.com`). Se não vier, copie a URL que aparece no topo da página do Realtime Database.

> A chave `apiKey` do Firebase não é secreta: ela fica visível em qualquer site que usa Firebase. Quem protege os dados são as regras do passo 3.

## 2. Publicar no GitHub Pages

1. Crie um repositório público, ex.: `leaobia/siga-qa`.
2. Suba **todos os arquivos desta pasta** (pode arrastar pelo site do GitHub em *Add file → Upload files*).
3. Em **Settings → Pages**: *Source* = `Deploy from a branch`, *Branch* = `main` / `(root)` → **Save**.
4. Depois de 1 ou 2 minutos, o site fica no ar em:
   - Telão: `https://leaobia.github.io/siga-qa/telao.html`
   - Jogadores: o QR code do telão já aponta para `.../index.html?sala=CÓDIGO`

## 3. No dia da apresentação (bloco de 15 min)

| Tempo | O que acontece |
|---|---|
| 2 min | Abra o `telao.html`. A turma escaneia o QR code e digita o apelido. |
| 7 min | **Começar a caça.** Ranking e feed atualizam ao vivo. Quando o tempo acaba, o jogo encerra sozinho. |
| 6 min | Pódio → **Revelar os bugs** (setas ← → do teclado ou do passador de slides) → resumo com o que a turma achou e o que passou batido. |

**Pontuação por bug:** 100 por achar + 30 pela categoria certa + 20 pela severidade certa + 20 por descrever o resultado esperado + 20 pelo obtido (máx. 190).
**Empate:** fica na frente quem chegou primeiro naquela pontuação.
**Falso positivo** (tocar onde não tem bug): −20. É o gancho pra falar do custo de relatos ruins.

- **Nova rodada** (no fim da revelação) zera os pontos e mantém a turma na sala.
- **Nova sala** (canto superior) gera outro código.

## Ensaio e plano B

- **Sem configurar o Firebase**, o jogo roda em *modo ensaio*: abra o `telao.html` e, **no mesmo navegador**, abra o link do jogador em outras abas. Assim você treina o roteiro inteiro sozinha.
- Se a internet da sala cair no dia, os celulares ainda podem jogar no 4G. Em último caso, cada pessoa abre o `index.html` e toca em **"treinar sozinho(a)"**: sem placar ao vivo, mas cada um vê a própria pontuação no fim.
- Ensaie com 2 ou 3 celulares de amigos pelo menos uma vez antes, com o Firebase já configurado.

## Os 12 bugs (cola para a apresentadora 🤫)

| # | Bug | Onde | Categoria |
|---|---|---|---|
| 1 | Sino mostra 4, a lista está vazia *(existe no SIGA real)* | Sino | Consistência de dados |
| 2 | 18/36 aulas mostra 52% | Faltas · Eng. Software III | Cálculo |
| 3 | 75,0% aparece com ⚠ | Faltas · IA | Valor-limite |
| 4 | "Voltar" das Notas abre Faltas | Notas | Navegação |
| 5 | CPF completo na tela *(existe no SIGA real)* | Dados pessoais | Segurança/LGPD |
| 6 | "Ativar MFA" não faz nada | Dados → MFA | Funcional |
| 7 | "Ausencia" sem acento *(existe no SIGA real)* | Faltas | Texto |
| 8 | Média 8,0 e 6,0 resulta em 5,0 | Notas · Eng. Software III | Cálculo |
| 9 | Aula de 20:50 às 18:40 | Horário · Quinta | Consistência de dados |
| 10 | Aceita "maria@@gmail" | Dados → PESSOAL | Validação de entrada |
| 11 | "Rematrícula" quase invisível | Início · Solicitações | Acessibilidade |
| 12 | Biblioteca nunca carrega *(existe no SIGA real)* | Biblioteca Digital | Disponibilidade |

**Pegadinhas que NÃO são bug** (boas pra discutir):
- Programação Mobile: P1 6,0 (peso 1) + P2 9,0 (peso 2) = **8,0**. Quem faz a média simples acha 7,5 e reporta errado. *Leia o requisito!*
- Histórico: Banco de Dados com média **6,0** está aprovada (≥ 6,0), e Programação Web com **75%** também.
- Ética com 60% **deve** ter o ⚠.

Para mudar bugs, textos ou pontuação: `js/bugs.js` (lista e pontos) e `js/jogo.js` (telas do clone; procure por `BUG plantado`).
