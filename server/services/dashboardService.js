const prisma = require('../config/prisma');
const env = require('../config/env');

const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;

const PAYMENT_METHODS = ['DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO'];

function startOfToday() {
  const local = new Date(Date.now() - BRT_OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() + BRT_OFFSET_MS);
}

function startOfMonth() {
  const local = new Date(startOfToday().getTime() - BRT_OFFSET_MS);
  local.setUTCDate(1);
  return new Date(local.getTime() + BRT_OFFSET_MS);
}

function serializeMoney(value) {
  return value ? value.toString() : '0.00';
}

function classifyStock(quantity) {
  if (quantity === 0) return 'ZERADO';
  if (quantity <= env.estoqueMinimo) return 'BAIXO';
  return 'NORMAL';
}

async function getKpis() {
  const today = startOfToday();
  const month = startOfMonth();

  const [billing, salesToday, lossesThisMonth, criticalCount, emptyCount, lowCount, criticalProducts] = await prisma.$transaction([
    prisma.pedido.aggregate({
      where: { status: 'CONCLUIDO', createdAt: { gte: today } },
      _sum: { valorTotal: true }
    }),
    prisma.pedido.count({ where: { status: 'CONCLUIDO', createdAt: { gte: today } } }),
    prisma.perda.aggregate({ where: { createdAt: { gte: month } }, _sum: { quantidade: true } }),
    prisma.produto.count({ where: { ativo: true, quantidadeEstoque: { lte: env.estoqueMinimo } } }),
    prisma.produto.count({ where: { ativo: true, quantidadeEstoque: 0 } }),
    prisma.produto.count({ where: { ativo: true, quantidadeEstoque: { gt: 0, lte: env.estoqueMinimo } } }),
    prisma.produto.findMany({
      where: { ativo: true, quantidadeEstoque: { lte: env.estoqueMinimo } },
      select: { id: true, nome: true, sku: true, categoria: true, quantidadeEstoque: true },
      orderBy: { quantidadeEstoque: 'asc' },
      take: 10
    })
  ]);

  return {
    faturamentoDia: serializeMoney(billing._sum.valorTotal),
    vendasHoje: salesToday,
    perdasNoMes: { quantidade: lossesThisMonth._sum.quantidade || 0 },
    produtosEmAlerta: criticalCount,
    produtosEsgotados: emptyCount,
    produtosEstoqueBaixo: lowCount,
    produtosCriticos: criticalProducts.map((product) => ({ ...product, nivelEstoque: classifyStock(product.quantidadeEstoque) }))
  };
}

async function getSalesByPayment() {
  const today = startOfToday();
  const grouped = await prisma.pedido.groupBy({
    by: ['formaPagamento'],
    where: { status: 'CONCLUIDO', createdAt: { gte: today } },
    _sum: { valorTotal: true },
    _count: { _all: true }
  });
  const groupedByMethod = new Map(grouped.map((item) => [item.formaPagamento, item]));

  return PAYMENT_METHODS.map((formaPagamento) => {
    const item = groupedByMethod.get(formaPagamento);
    return {
      formaPagamento,
      faturamento: serializeMoney(item && item._sum.valorTotal),
      quantidadeVendas: item ? item._count._all : 0
    };
  });
}

module.exports = { classifyStock, getKpis, getSalesByPayment, startOfToday, startOfMonth };
