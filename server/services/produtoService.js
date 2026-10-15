const prisma = require('../config/prisma');
const env = require('../config/env');

const CATEGORIAS = ['PLANTA', 'VASO', 'INSUMO', 'ARRANJO', 'OUTROS'];
const productSelect = {
  id: true,
  nome: true,
  sku: true,
  categoria: true,
  precoVenda: true,
  quantidadeEstoque: true,
  popular: true,
  descricao: true,
  imagemUrl: true,
  rega: true,
  iluminacao: true,
  cuidados: true,
  usos: true,
  argumentosVenda: true,
  ativo: true,
  sugestoesFeitas: {
    select: {
      sugestao: {
        select: { id: true }
      }
    }
  },
  createdAt: true,
  updatedAt: true
};

function isValidCategory(categoria) {
  return CATEGORIAS.includes(categoria);
}

function parseSuggestionIds(value) {
  return String(value || '').split(',').map((id) => id.trim()).filter(Boolean);
}

function buildSuggestionConnections(suggestionIds) {
  return suggestionIds.map((sugestaoId) => ({
    sugestao: {
      connect: { id: sugestaoId }
    }
  }));
}

async function validateSuggestionIds(value, productId) {
  if (!value) return null;
  const ids = parseSuggestionIds(value);
  if (productId && ids.includes(productId)) return 'Um produto não pode sugerir a si mesmo';
  const activeProducts = await prisma.produto.findMany({ where: { id: { in: ids }, ativo: true }, select: { id: true } });
  if (activeProducts.length !== ids.length) return 'Todas as sugestões devem existir e estar ativas';
  return null;
}

function serializeProduto(produto) {
  const { sugestoesFeitas, ...safeProduto } = produto;
  return {
    ...safeProduto,
    precoVenda: safeProduto.precoVenda.toString(),
    sugestoesIds: (sugestoesFeitas || []).map((item) => item.sugestao.id).join(', ')
  };
}

async function list({ page, pageSize, categoria, q, popular }) {
  const where = { ativo: true };
  if (categoria) where.categoria = categoria;
  if (popular === true) where.popular = true;
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
      { descricao: { contains: q, mode: 'insensitive' } }
    ];
  }

  const [items, total] = await prisma.$transaction([
    prisma.produto.findMany({
      where,
      select: productSelect,
      orderBy: { nome: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.produto.count({ where })
  ]);

  return {
    items: items.map(serializeProduto),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

async function findById(id) {
  const produto = await prisma.produto.findUnique({ where: { id }, select: productSelect });
  return produto ? serializeProduto(produto) : null;
}

async function create(data) {
  const { sugestoesIds, ...rest } = data;
  const suggestionIds = parseSuggestionIds(sugestoesIds);
  const createData = {
    ...rest,
    ...(suggestionIds.length ? { sugestoesFeitas: { create: buildSuggestionConnections(suggestionIds) } } : {})
  };
  return serializeProduto(await prisma.produto.create({ data: createData, select: productSelect }));
}

async function update(id, data) {
  const { sugestoesIds, ...rest } = data;
  const updateData = { ...rest };
  if (sugestoesIds !== undefined) {
    const suggestionIds = parseSuggestionIds(sugestoesIds);
    updateData.sugestoesFeitas = {
      deleteMany: {},
      create: buildSuggestionConnections(suggestionIds)
    };
  }

  return serializeProduto(await prisma.produto.update({ where: { id }, data: updateData, select: productSelect }));
}

async function deactivate(id) {
  return update(id, { ativo: false });
}

async function stockAlerts() {
  const products = await prisma.produto.findMany({
    where: { ativo: true, quantidadeEstoque: { lte: env.estoqueMinimo } },
    select: { id: true, nome: true, sku: true, quantidadeEstoque: true },
    orderBy: { quantidadeEstoque: 'asc' }
  });
  return {
    zerados: products.filter((product) => product.quantidadeEstoque === 0),
    baixos: products.filter((product) => product.quantidadeEstoque > 0)
  };
}

module.exports = { CATEGORIAS, isValidCategory, parseSuggestionIds, buildSuggestionConnections, validateSuggestionIds, list, findById, create, update, deactivate, stockAlerts };
