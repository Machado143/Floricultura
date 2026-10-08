const test = require('node:test');
const assert = require('node:assert/strict');

const prisma = require('../config/prisma');
const pedidoService = require('./pedidoService');

test('serialização de pedido não expõe senha em nenhum nível', () => {
  const serialized = pedidoService.serializePedido({
    id: 'pedido-1',
    valorTotal: '10.00',
    desconto: '0.00',
    troco: '0.00',
    usuario: { id: 'u1', nome: 'Admin', senha: 'hash-secreto' },
    itens: [{ precoUnitario: '10.00', subtotal: '10.00', produto: { nome: 'Rosa', senha: 'não deveria existir' } }]
  });

  test('rejeita desconto inválido antes de iniciar a transação', async () => {
    await assert.rejects(
      () => pedidoService.create({
        usuarioId: 'usuario-1',
        items: [{ produtoId: 'produto-1', quantidade: 1 }],
        desconto: 'abc',
        formaPagamento: 'PIX'
      }),
      (error) => error instanceof pedidoService.PedidoValidationError && error.message === 'O desconto deve ser um valor válido'
    );
  });

  test('rejeita valor recebido menor que o total', async () => {
    const originalTransaction = prisma.$transaction;
    prisma.$transaction = async (callback) => callback({
      async $queryRaw() {
        return [{ id: 'produto-1', nome: 'Rosa', precoVenda: '10.00', quantidadeEstoque: 5, ativo: true }];
      }
    });

    await assert.rejects(
      () => pedidoService.create({
        usuarioId: 'usuario-1',
        items: [{ produtoId: 'produto-1', quantidade: 1 }],
        valorRecebido: '9.99',
        formaPagamento: 'DINHEIRO'
      }),
      (error) => error instanceof pedidoService.PedidoValidationError && error.message === 'O valor recebido não pode ser menor que o total'
    );

    prisma.$transaction = originalTransaction;
  });
  const serializedText = JSON.stringify(serialized);
  assert.doesNotMatch(serializedText, /senha/);
});

test('cancelar pedido devolve estoque e cancela entrega; segunda tentativa falha', async () => {
  const originalTransaction = prisma.$transaction;
  const state = { status: 'CONCLUIDO', estoque: 2, entrega: 'PENDENTE' };
  const fakeTx = {
    async $queryRaw() { return [{ id: 'pedido-1', status: state.status }]; },
    pedido: {
      async findUnique() { return { itens: [{ produtoId: 'produto-1', quantidade: 3 }], entrega: { id: 'entrega-1' } }; },
      async update() { state.status = 'CANCELADO'; return { id: 'pedido-1', status: state.status, valorTotal: '10.00', desconto: '0.00', troco: '0.00', itens: [], cliente: null, usuario: { id: 'u1', nome: 'Admin' }, entrega: null }; }
    },
    produto: { async update({ data }) { state.estoque += data.quantidadeEstoque.increment; } },
    entrega: { async update({ data }) { state.entrega = data.status; } }
  };
  prisma.$transaction = async (callback) => callback(fakeTx);

  const result = await pedidoService.cancel('pedido-1');
  assert.equal(result.status, 'CANCELADO');
  assert.equal(state.estoque, 5);
  assert.equal(state.entrega, 'CANCELADO');
  await assert.rejects(() => pedidoService.cancel('pedido-1'), pedidoService.PedidoValidationError);

  prisma.$transaction = originalTransaction;
});