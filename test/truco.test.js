import { test, expect } from '@jest/globals';
import {
    distribuir, compararCartas, vencedorRodada, resolverMao, resolverAposta, vencedorPartida,
} from '../src/jogo.js';

const valores = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
const naipes = ['ouros', 'espadas', 'copas', 'paus'];
const carta = (valor, naipe) => ({ valor, naipe });
const baralho = valores.flatMap(valor => naipes.map(naipe => carta(valor, naipe)));

test('T01 distribui 3 cartas a cada um dos 4 jogadores e separa a vira', () => {
    const { maos, vira } = distribuir(structuredClone(baralho));
    expect(maos).toEqual([
        [carta('4', 'ouros'), carta('5', 'ouros'), carta('6', 'ouros')],
        [carta('4', 'espadas'), carta('5', 'espadas'), carta('6', 'espadas')],
        [carta('4', 'copas'), carta('5', 'copas'), carta('6', 'copas')],
        [carta('4', 'paus'), carta('5', 'paus'), carta('6', 'paus')],
    ]);
    expect(vira).toEqual(carta('7', 'ouros'));
});

test('T02 segue a hierarquia das cartas comuns sem desempatar por naipe', () => {
    const vira = carta('7', 'ouros'); // Q é manilha nesta mão.
    const comuns = valores.filter(valor => valor !== 'Q');

    for (let i = 1; i < comuns.length; i += 1) {
        const maior = carta(comuns[i], 'ouros');
        const menor = carta(comuns[i - 1], 'paus');
        expect(compararCartas(maior, menor, vira)).toBe(1);
        expect(compararCartas(menor, maior, vira)).toBe(-1);
    }
    expect(compararCartas(carta('3', 'paus'), carta('3', 'ouros'), vira)).toBe(0);
});

test('T03 manilha acompanha a vira e naipes ordenam cartas de manilha', () => {
    const vira = carta('J', 'espadas');
    const tres = carta('3', 'paus');
    expect(compararCartas(carta('K', 'ouros'), tres, vira)).toBe(1);

    for (let i = 1; i < naipes.length; i += 1) {
        expect(compararCartas(carta('K', naipes[i]), carta('K', naipes[i - 1]), vira)).toBe(1);
    }

    const quatro = carta('4', 'ouros');
    expect(compararCartas(quatro, tres, vira)).toBe(-1);
    expect(compararCartas(quatro, tres, carta('3', 'copas'))).toBe(1);
});

test('T04 decide a rodada por dupla e empata apenas entre duplas adversárias', () => {
    const vira = carta('5', 'ouros');
    const forteA = carta('3', 'ouros');
    const forteB = carta('3', 'espadas');
    const fracaA = carta('4', 'copas');
    const fracaB = carta('4', 'paus');

    expect(vencedorRodada([forteA, fracaA, forteB, fracaB], vira)).toBe(0);
    expect(vencedorRodada([fracaA, forteA, fracaB, forteB], vira)).toBe(1);
    expect(vencedorRodada([forteA, forteB, fracaA, fracaB], vira)).toBe(null);
});

const encerrada = vencedor => ({ status: 'encerrada', vencedor });

test('T05 resolve melhor de três e os diferentes empates de rodada', () => {
    expect(resolverMao([0])).toEqual({ status: 'em_andamento', vencedor: null });
    expect(resolverMao([0, 1])).toEqual({ status: 'em_andamento', vencedor: null });

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
        expect(resolverMao(rodadas)).toEqual(encerrada(vencedor));
    }
});

const aposta = (placar, valorAtual, dupla, acao) => resolverAposta({ placar, valorAtual, dupla, acao });

test('T06 aceita aumentos até 12 e, na recusa, paga o valor anterior à dupla proponente', () => {
    for (const [atual, proximo] of [[1, 3], [3, 6], [6, 9], [9, 12]]) {
        expect(aposta([2, 4], atual, 0, 'aceitar')).toEqual({
            valor: proximo, encerrada: false, vencedor: null, cartas: 'normal',
        });
        expect(aposta([2, 4], atual, 1, 'recusar')).toEqual({
            valor: atual, encerrada: true, vencedor: 1, cartas: 'normal',
        });
    }
    expect(() => aposta([2, 4], 12, 0, 'aceitar')).toThrow(RangeError);
});

test('T07 mão de onze aceita vale 3 e corrida dá 1 ponto ao adversário', () => {
    expect(aposta([11, 7], 1, 0, 'jogar_mao_de_onze')).toEqual({
        valor: 3, encerrada: false, vencedor: null, cartas: 'parceiros',
    });
    expect(aposta([7, 11], 1, 1, 'correr_mao_de_onze')).toEqual({
        valor: 1, encerrada: true, vencedor: 0, cartas: 'parceiros',
    });
    expect(() => aposta([11, 7], 1, 1, 'jogar_mao_de_onze')).toThrow(RangeError);
    expect(() => aposta([11, 7], 3, 0, 'aceitar')).toThrow(RangeError);
    expect(() => aposta([7, 11], 3, 1, 'recusar')).toThrow(RangeError);
});

test('T08 mão de ferro vale um ponto com cartas fechadas e sem aumento', () => {
    expect(aposta([11, 11], 1, 0, 'iniciar_mao_de_ferro')).toEqual({
        valor: 1, encerrada: false, vencedor: null, cartas: 'fechadas',
    });
    expect(() => aposta([11, 11], 1, 1, 'aceitar')).toThrow(RangeError);
    expect(() => aposta([11, 11], 1, 0, 'correr_mao_de_onze')).toThrow(RangeError);
});

test('T09 vence a partida quem chega a 12 pontos ou ultrapassa a meta', () => {
    expect(vencedorPartida([11, 11])).toBe(null);
    expect(vencedorPartida([12, 11])).toBe(0);
    expect(vencedorPartida([8, 14])).toBe(1);
});

test('T10 um 3 comum nunca vence uma manilha, independentemente do naipe ou da dupla', () => {
    for (const valorVira of valores) {
        const valorManilha = valores[(valores.indexOf(valorVira) + 1) % valores.length];
        if (valorManilha === '3') continue; // Com vira 2, o próprio 3 é manilha.

        const vira = carta(valorVira, 'copas');
        const [comumA, comumB] = valores.filter(valor => valor !== '3' && valor !== valorManilha);
        for (const naipe of naipes) {
            const manilha = carta(valorManilha, naipe);
            const tres = carta('3', 'paus');
            expect(compararCartas(manilha, tres, vira)).toBe(1);
            expect(compararCartas(tres, manilha, vira)).toBe(-1);
            expect(vencedorRodada([manilha, tres, carta(comumA, 'ouros'), carta(comumB, 'espadas')], vira)).toBe(0);
            expect(vencedorRodada([tres, manilha, carta(comumA, 'ouros'), carta(comumB, 'espadas')], vira)).toBe(1);
        }
    }

    expect(compararCartas(carta('3', 'ouros'), carta('2', 'paus'), carta('2', 'copas'))).toBe(1);
});
