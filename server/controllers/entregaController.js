const prisma = require('../config/prisma');

const STATUS_ENTREGA = ['PENDENTE', 'EM_PREPARACAO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO'];

function serializeEntrega(entrega) {
  return entrega;
}

async function listarEntregas(req, res, next) {
  try {
    const entregas = await prisma.entrega.findMany({
      include: {
        cliente: true,
        pedido: { include: { itens: { include: { produto: true } } } }
      },
      orderBy: { dataEntrega: 'asc' }
    });
    return res.status(200).json({ success: true, data: entregas.map(serializeEntrega) });
  } catch (error) {
    return next(error);
  }
}

async function agendarEntrega(req, res, next) {
  try {
    const { clienteId, pedidoId, dataEntrega, horarioEntrega, endereco, observacao } = req.body;
    const normalizedAddress = typeof endereco === 'string' ? endereco.trim() : '';
    const normalizedTime = typeof horarioEntrega === 'string' ? horarioEntrega.trim() : '';
    const scheduledDate = /^\d{4}-\d{2}-\d{2}$/.test(dataEntrega || '')
      ? new Date(`${dataEntrega}T12:00:00Z`)
      : null;

    if (!clienteId || !dataEntrega || !/^([01]\d|2[0-3]):[0-5]\d$/.test(normalizedTime) || !normalizedAddress || !scheduledDate || Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ success: false, error: 'RN03: Cliente, endereço, data e horário são obrigatórios e válidos.' });
    }

    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente || !cliente.nome || !cliente.telefone || !cliente.cpfCnpj) {
      return res.status(400).json({ success: false, error: 'RN03: O cliente deve possuir nome, telefone e CPF/CNPJ cadastrados.' });
    }

    if (pedidoId) {
      const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
      if (!pedido) return res.status(400).json({ success: false, error: 'Pedido não encontrado.' });
    }

    const entrega = await prisma.entrega.create({
      data: {
        clienteId,
        pedidoId: pedidoId || null,
        dataEntrega: scheduledDate,
        horarioEntrega: normalizedTime,
        endereco: normalizedAddress,
        observacao: typeof observacao === 'string' ? observacao.trim() || null : null
      },
      include: { cliente: true, pedido: true }
    });
    return res.status(201).json({ success: true, data: entrega });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, error: 'Este pedido já possui uma entrega agendada.' });
    return next(error);
  }
}

async function atualizarStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!STATUS_ENTREGA.includes(status)) return res.status(400).json({ success: false, error: 'Status de entrega inválido.' });
    const entrega = await prisma.entrega.update({ where: { id: req.params.id }, data: { status }, include: { cliente: true, pedido: true } });
    return res.status(200).json({ success: true, data: entrega });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, error: 'Entrega não encontrada.' });
    return next(error);
  }
}

module.exports = { listarEntregas, agendarEntrega, atualizarStatus };