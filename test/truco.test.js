import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    distribuir, compararCartas, vencedorRodada, resolverMao, resolverAposta, vencedorPartida,
} from '../src/jogo.js';

const valores = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
const naipes = ['ouros', 'espadas', 'copas', 'paus'];
const carta = (valor, naipe) => ({ valor, naipe });
const baralho = valores.flatMap(valor => naipes.map(naipe => carta(valor, naipe)));

test('T01 distribui 3 cartas a cada um dos 4 jogadores e separa a vira', () => {
    const { maos, vira } = distribuir(structuredClone(baralho));
    assert.deepEqual(maos, [
        [carta('4', 'ouros'), carta('5', 'ouros'), carta('6', 'ouros')],
        [carta('4', 'espadas'), carta('5', 'espadas'), carta('6', 'espadas')],
        [carta('4', 'copas'), carta('5', 'copas'), carta('6', 'copas')],
        [carta('4', 'paus'), carta('5', 'paus'), carta('6', 'paus')],
    ]);
    assert.deepEqual(vira, carta('7', 'ouros'));
});

test('T02 segue a hierarquia das cartas comuns sem desempatar por naipe', () => {
    const vira = carta('7', 'ouros'); // Q é manilha nesta mão.
    const comuns = valores.filter(valor => valor !== 'Q');

    for (let i = 1; i < comuns.length; i += 1) {
        const maior = carta(comuns[i], 'ouros');
        const menor = carta(comuns[i - 1], 'paus');
        assert.equal(compararCartas(maior, menor, vira), 1);
        assert.equal(compararCartas(menor, maior, vira), -1);
    }
    assert.equal(compararCartas(carta('3', 'paus'), carta('3', 'ouros'), vira), 0);
});

test('T03 manilha acompanha a vira e naipes ordenam cartas de manilha', () => {
    const vira = carta('J', 'espadas');
    const tres = carta('3', 'paus');
    assert.equal(compararCartas(carta('K', 'ouros'), tres, vira), 1);

    for (let i = 1; i < naipes.length; i += 1) {
        assert.equal(compararCartas(carta('K', naipes[i]), carta('K', naipes[i - 1]), vira), 1);
    }

    const quatro = carta('4', 'ouros');
    assert.equal(compararCartas(quatro, tres, vira), -1);
    assert.equal(compararCartas(quatro, tres, carta('3', 'copas')), 1);
});

test('T04 decide a rodada por dupla e empata apenas entre duplas adversárias', () => {
    const vira = carta('5', 'ouros');
    const forteA = carta('3', 'ouros');
    const forteB = carta('3', 'espadas');
    const fracaA = carta('4', 'copas');
    const fracaB = carta('4', 'paus');

    assert.equal(vencedorRodada([forteA, fracaA, forteB, fracaB], vira), 0);
    assert.equal(vencedorRodada([fracaA, forteA, fracaB, forteB], vira), 1);
    assert.equal(vencedorRodada([forteA, forteB, fracaA, fracaB], vira), null);
});

const encerrada = vencedor => ({ status: 'encerrada', vencedor });

test('T05 resolve melhor de três e os diferentes empates de rodada', () => {
    assert.deepEqual(resolverMao([0]), { status: 'em_andamento', vencedor: null });
    assert.deepEqual(resolverMao([0, 1]), { status: 'em_andamento', vencedor: null });

    const cenarios = [
        [[0, 0], 0],
        [[1, 0, 0], 0],
        [[null, 1], 1],
        [[0, null], 0],
        [[null, null, 1], 1],
        [[1, 0, null], 1],
        [[null, null, null], null],
    ];
    for (const [rodadas, vencedor] of cenarios) {
        assert.deepEqual(resolverMao(rodadas), encerrada(vencedor));
    }
});

const aposta = (placar, valorAtual, dupla, acao) => resolverAposta({ placar, valorAtual, dupla, acao });

test('T06 aceita aumentos até 12 e, na recusa, paga o valor anterior à dupla proponente', () => {
    for (const [atual, proximo] of [[1, 3], [3, 6], [6, 9], [9, 12]]) {
        assert.deepEqual(aposta([2, 4], atual, 0, 'aceitar'), {
            valor: proximo, encerrada: false, vencedor: null, cartas: 'normal',
        });
        assert.deepEqual(aposta([2, 4], atual, 1, 'recusar'), {
            valor: atual, encerrada: true, vencedor: 1, cartas: 'normal',
        });
    }
    assert.throws(() => aposta([2, 4], 12, 0, 'aceitar'), RangeError);
});

test('T07 mão de onze aceita vale 3 e corrida dá 1 ponto ao adversário', () => {
    assert.deepEqual(aposta([11, 7], 1, 0, 'jogar_mao_de_onze'), {
        valor: 3, encerrada: false, vencedor: null, cartas: 'parceiros',
    });
    assert.deepEqual(aposta([7, 11], 1, 1, 'correr_mao_de_onze'), {
        valor: 1, encerrada: true, vencedor: 0, cartas: 'parceiros',
    });
    assert.throws(() => aposta([11, 7], 1, 1, 'jogar_mao_de_onze'), RangeError);
    assert.throws(() => aposta([11, 7], 3, 0, 'aceitar'), RangeError);
    assert.throws(() => aposta([7, 11], 3, 1, 'recusar'), RangeError);
});

test('T08 mão de ferro vale um ponto com cartas fechadas e sem aumento', () => {
    assert.deepEqual(aposta([11, 11], 1, 0, 'iniciar_mao_de_ferro'), {
        valor: 1, encerrada: false, vencedor: null, cartas: 'fechadas',
    });
    assert.throws(() => aposta([11, 11], 1, 1, 'aceitar'), RangeError);
    assert.throws(() => aposta([11, 11], 1, 0, 'correr_mao_de_onze'), RangeError);
});

test('T09 vence a partida quem chega a 12 pontos ou ultrapassa a meta', () => {
    assert.equal(vencedorPartida([11, 11]), null);
    assert.equal(vencedorPartida([12, 11]), 0);
    assert.equal(vencedorPartida([8, 14]), 1);
});
