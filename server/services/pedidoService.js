const { Prisma } = require('@prisma/client');

const prisma = require('../config/prisma');

const FORMAS_PAGAMENTO = ['DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO'];

class PedidoValidationError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 400;
  }
}

class PedidoNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 404;
  }
}

function normalizeItems(items) {
  const quantities = new Map();

  for (const item of items) {
    if (!item || typeof item.produtoId !== 'string' || !Number.isInteger(item.quantidade) || item.quantidade <= 0) {
      throw new PedidoValidationError('Cada item deve informar produtoId e uma quantidade inteira positiva');
    }
    quantities.set(item.produtoId, (quantities.get(item.produtoId) || 0) + item.quantidade);
  }

  return [...quantities.entries()]
    .map(([produtoId, quantidade]) => ({ produtoId, quantidade }))
    .sort((left, right) => left.produtoId.localeCompare(right.produtoId));
}

function removeSensitiveFields(value) {
  if (Array.isArray(value)) return value.map(removeSensitiveFields);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'senha').map(([key, entry]) => [key, removeSensitiveFields(entry)]));
}

function serializePedido(pedido) {
  const safePedido = removeSensitiveFields(pedido);
  return {
    ...safePedido,
    valorTotal: safePedido.valorTotal.toString(),
    desconto: safePedido.desconto.toString(),
    troco: safePedido.troco.toString(),
    usuario: safePedido.usuario ? { id: safePedido.usuario.id, nome: safePedido.usuario.nome } : null,
    itens: safePedido.itens.map((item) => ({
      ...item,
      precoUnitario: item.precoUnitario.toString(),
      subtotal: item.subtotal.toString(),
      produto: item.produto
    }))
  };
}

function parseDecimal(value, message) {
  try {
    return new Prisma.Decimal(value);
  } catch {
    throw new PedidoValidationError(message);
  }
}

async function create({ usuarioId, clienteId, items, desconto = 0, valorRecebido, formaPagamento }) {
  if (!Array.isArray(items) || items.length === 0) throw new PedidoValidationError('O pedido deve conter ao menos um item');
  if (!FORMAS_PAGAMENTO.includes(formaPagamento)) throw new PedidoValidationError('Forma de pagamento inválida');

  const descontoDecimal = parseDecimal(desconto, 'O desconto deve ser um valor válido');
  if (descontoDecimal.isNegative()) throw new PedidoValidationError('O desconto não pode ser negativo');
  const receivedDecimal = valorRecebido === undefined || valorRecebido === null
    ? null
    : parseDecimal(valorRecebido, 'O valor recebido deve ser um valor válido');
  if (receivedDecimal?.isNegative()) throw new PedidoValidationError('O valor recebido não pode ser negativo');

  const normalizedItems = normalizeItems(items);

  const pedido = await prisma.$transaction(async (tx) => {
    const productIds = normalizedItems.map((item) => item.produtoId);
    const lockedProducts = await tx.$queryRaw`
      SELECT "id", "nome", "precoVenda", "quantidadeEstoque", "ativo"
      FROM "Produto"
      WHERE "id" IN (${Prisma.join(productIds)})
      ORDER BY "id" ASC
      FOR UPDATE
    `;
    const productsById = new Map(lockedProducts.map((product) => [product.id, product]));
    const itemRows = [];
    let total = new Prisma.Decimal(0);

    for (const item of normalizedItems) {
      const product = productsById.get(item.produtoId);
      if (!product || !product.ativo) throw new PedidoValidationError('Um dos produtos selecionados não está disponível');
      if (product.quantidadeEstoque < item.quantidade) {
        throw new PedidoValidationError(`Estoque insuficiente para ${product.nome}. Disponível: ${product.quantidadeEstoque}`);
      }

      const precoUnitario = new Prisma.Decimal(product.precoVenda);
      const subtotal = precoUnitario.mul(item.quantidade);
      total = total.add(subtotal);
      itemRows.push({ produtoId: item.produtoId, quantidade: item.quantidade, precoUnitario, subtotal });
    }

    if (descontoDecimal.greaterThan(total)) throw new PedidoValidationError('O desconto não pode ser maior que o subtotal');
    const valorTotal = total.sub(descontoDecimal);
    const recebido = receivedDecimal || valorTotal;
    if (formaPagamento === 'DINHEIRO' && recebido.lessThan(valorTotal)) {
      throw new PedidoValidationError('O valor recebido não pode ser menor que o total');
    }
    const trocoDecimal = formaPagamento === 'DINHEIRO' ? recebido.sub(valorTotal) : new Prisma.Decimal(0);

    if (clienteId) {
      const cliente = await tx.cliente.findUnique({ where: { id: clienteId }, select: { id: true } });
      if (!cliente) throw new PedidoValidationError('Cliente não encontrado');
    }

    for (const item of normalizedItems) {
      await tx.produto.update({ where: { id: item.produtoId }, data: { quantidadeEstoque: { decrement: item.quantidade } } });
    }

    return tx.pedido.create({
      data: {
        usuarioId,
        clienteId: clienteId || null,
        valorTotal,
        desconto: descontoDecimal,
        troco: trocoDecimal,
        formaPagamento,
        status: 'CONCLUIDO',
        itens: { create: itemRows }
      },
      include: {
        itens: { include: { produto: true } },
        cliente: true,
        usuario: { select: { id: true, nome: true } }
      }
    });
  });

  return serializePedido(pedido);
}

async function cancel(id) {
  const pedido = await prisma.$transaction(async (tx) => {
    const lockedOrders = await tx.$queryRaw`
      SELECT "id", "status"
      FROM "Pedido"
      WHERE "id" = ${id}
      FOR UPDATE
    `;
    const lockedOrder = lockedOrders[0];
    if (!lockedOrder) throw new PedidoNotFoundError('Pedido não encontrado');
    if (lockedOrder.status !== 'CONCLUIDO') throw new PedidoValidationError('Somente pedidos concluídos podem ser cancelados');

    const currentOrder = await tx.pedido.findUnique({ where: { id }, include: { itens: true, entrega: true } });
    for (const item of currentOrder.itens) {
      await tx.produto.update({ where: { id: item.produtoId }, data: { quantidadeEstoque: { increment: item.quantidade } } });
    }
    if (currentOrder.entrega) {
      await tx.entrega.update({ where: { id: currentOrder.entrega.id }, data: { status: 'CANCELADO' } });
    }

    return tx.pedido.update({
      where: { id },
      data: { status: 'CANCELADO' },
      include: {
        itens: { include: { produto: true } },
        cliente: true,
        usuario: { select: { id: true, nome: true } },
        entrega: true
      }
    });
  });

  return serializePedido(pedido);
}

module.exports = { FORMAS_PAGAMENTO, PedidoValidationError, PedidoNotFoundError, serializePedido, create, cancel };
