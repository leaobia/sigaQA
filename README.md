**Pontuação por bug:** 100 por encontrar + 50 pela categoria certa + 40 pela severidade certa (máximo de 190). Falso positivo: −20 pontos.

## Os 12 bugs 

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
