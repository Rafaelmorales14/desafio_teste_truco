# Truco paulista para duas duplas

## Especificação

Quatro jogadores formam duas duplas. Os jogadores `0` e `2` são da dupla `0`. Os jogadores `1` e `3` são da dupla `1`. A partida vai até pelo menos 12 pontos. Cada mão tem até três rodadas e começa valendo um ponto, com aumentos para 3, 6, 9 e 12. [Regulamento de Truco Paulista da UFFS](https://site-antigo-2025.uffs.edu.br/pastas-ocultas/bd/pro-reitoria-de-assuntos-estudantis/arquivos/regulamento-truco-paulista/%40%40download/file)

O baralho tem 40 cartas. A ordem crescente dos valores comuns é `4, 5, 6, 7, Q, J, K, A, 2, 3`. O valor seguinte ao da vira define as manilhas. Depois do `3`, volta para o `4`. Toda manilha bate qualquer carta comum. Entre manilhas, a força cresce de ouros para espadas, copas e paus. Cartas comuns do mesmo valor empatam. [Regras de manilha e empate](https://s3.amazonaws.com/static.jogatina.com/downloads/truco-paulista/regras-truco-paulista.pdf)

## Contrato para a implementação

Em `src/jogo.js`, exporte as funções síncronas abaixo. Uma carta é `{ valor, naipe }`, com os valores acima como strings e os naipes `ouros`, `espadas`, `copas` ou `paus`. Um placar é um par `[pontosDaDupla0, pontosDaDupla1]`.

- `distribuir(baralho)` recebe 40 cartas em ordem fixa, sem embaralhar. Distribua uma carta por vez aos jogadores de `0` a `3`, por três voltas. Retorne `{ maos, vira }`. As mãos seguem a ordem dos jogadores e a 13ª carta é a vira.
- `compararCartas(a, b, vira)` devolve `1` se `a` for mais forte, `-1` se `b` for mais forte e `0` no empate.
- `vencedorRodada(jogadas, vira)` recebe quatro cartas na ordem dos jogadores. Retorna a dupla da carta mais forte. Se a força máxima ocorrer nas duas duplas, retorna `null`.
- `resolverMao(rodadas)` recebe até três resultados de rodada, `0`, `1` ou `null` para empate. Devolve `{ status, vencedor }`. Duas vitórias encerram a mão. Se a primeira empatar, quem ganhar a segunda vence a mão. Se a segunda empatar, a vencedora da primeira leva a mão. Com as duas primeiras empatadas, a terceira decide. Se cada dupla ganhou uma rodada e a terceira empatar, vence quem ganhou a primeira. Três empates encerram sem vencedora. Use `em_andamento` com `vencedor: null` até o resultado ficar definido, e `encerrada` ao terminar.
- `resolverAposta({ placar, valorAtual, dupla, acao })` devolve `{ valor, encerrada, vencedor, cartas }`. Numa mão comum, `dupla` é a proponente do aumento. `aceitar` sobe para o próximo valor e continua a mão. `recusar` encerra a mão e paga o valor anterior à proponente. Use `cartas: 'normal'`.
- Em mão de onze, apenas a dupla com 11 pode usar `jogar_mao_de_onze` ou `correr_mao_de_onze`. Jogar continua a mão por 3. Correr encerra e paga 1 à outra dupla. Em ambas, use `cartas: 'parceiros'` para representar que a dupla pode ver as cartas dos parceiros. Em `11 × 11`, `iniciar_mao_de_ferro` continua a mão por 1 com `cartas: 'fechadas'`. Ao continuar uma mão, use `encerrada: false` e `vencedor: null`.
- Lance `RangeError` para ações de aposta incompatíveis com o placar ou sem um próximo valor. Mão de onze e mão de ferro bloqueiam aumentos.
- `vencedorPartida(placar)` retorna `0` ou `1` para a dupla que atingiu pelo menos 12, ou `null` enquanto a partida estiver em andamento. Os testes usam placares alcançáveis com apenas uma vencedora.

## Casos de teste

- **T01** verifica mãos dos quatro jogadores e a vira com baralho em ordem fixa.
- **T02–T03** verificam hierarquia comum, empate entre cartas comuns, mudança da manilha, ordem dos naipes e volta do `3` para o `4`.
- **T04** distingue vitória por dupla, empate entre adversários e forças iguais dentro da mesma dupla.
- **T05** cobre mão em andamento, vitória em duas ou três rodadas, os desempates e a mão sem vencedora.
- **T06** cobre os quatro aumentos, o valor anterior em cada recusa e o limite de 12.
- **T07–T08** cobrem mão de onze aceita e corrida, mão de ferro e bloqueio de aumentos.
- **T09** verifica placares abaixo da meta, de exatamente 12 e acima de 12.

## Execução

Com Node.js 24, rode `npm test` na raiz. A entrega registra a etapa **Red** do TDD. Sem `src/jogo.js`, a suíte retorna código 1 com `ERR_MODULE_NOT_FOUND`. Crie esse módulo com o contrato acima e repita `npm test` para executar as asserções.

## Colaborador

Rafael Blasques Morales ([Rafaelmorales14](https://github.com/Rafaelmorales14)).
