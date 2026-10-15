const test = require('node:test');
const assert = require('node:assert/strict');

const { Prisma } = require('@prisma/client');

const prisma = require('../config/prisma');
const pedidoService = require('./pedidoService');

test('lista pedidos com paginação e serializa campos sensíveis', async () => {
  const originalTransaction = prisma.$transaction;
  const calls = { findMany: null, count: null };

  prisma.$transaction = async (operations) => {
    if (Array.isArray(operations)) {
      const [findManyResult, countResult] = await Promise.all(operations);
      return [findManyResult, countResult];
    }

    return operations({
      pedido: {
        findMany: async (query) => {
          calls.findMany = query;
          return [{
            id: 'pedido-1',
            createdAt: new Date('2026-01-01T10:00:00.000Z'),
            valorTotal: new Prisma.Decimal('15.50'),
            desconto: new Prisma.Decimal('1.00'),
            troco: new Prisma.Decimal('0.00'),
            formaPagamento: 'PIX',
            status: 'CONCLUIDO',
            cliente: { id: 'cliente-1', nome: 'Maria' },
            usuario: { id: 'usuario-1', nome: 'Ana', senha: 'hash-secreto' },
            itens: [{
              quantidade: 1,
              precoUnitario: new Prisma.Decimal('15.50'),
              subtotal: new Prisma.Decimal('15.50'),
              produto: { id: 'produto-1', nome: 'Rosa', senha: 'não deve aparecer' }
            }]
          }];
        }
      },
      count: async (query) => {
        calls.count = query;
        return 1;
      }
    });
  };

  const result = await pedidoService.list({ page: 2, pageSize: 5, status: 'CONCLUIDO', userId: 'usuario-1' });

  assert.deepEqual(calls.findMany.where, { status: 'CONCLUIDO', usuarioId: 'usuario-1' });
  assert.equal(calls.findMany.skip, 5);
  assert.equal(calls.findMany.take, 5);
  assert.deepEqual(calls.count.where, { status: 'CONCLUIDO', usuarioId: 'usuario-1' });
  assert.equal(result.pagination.page, 2);
  assert.equal(result.pagination.pageSize, 5);
  assert.equal(result.pagination.total, 1);
  assert.equal(result.pagination.totalPages, 1);
  assert.equal(result.items[0].createdAt, '2026-01-01T10:00:00.000Z');
  assert.equal(result.items[0].usuario.nome, 'Ana');
  assert.equal(JSON.stringify(result).includes('senha'), false);

  prisma.$transaction = originalTransaction;
});