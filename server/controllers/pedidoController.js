const pedidoService = require('../services/pedidoService');

const STATUS_PEDIDO = ['CONCLUIDO', 'CANCELADO'];

async function list(req, res, next) {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(Number.parseInt(req.query.pageSize, 10) || 10, 1), 50);
    const { status, userId } = req.query;

    if (status && !STATUS_PEDIDO.includes(status)) {
      return res.status(400).json({ success: false, error: 'Status de pedido inválido' });
    }

    return res.status(200).json({
      success: true,
      data: await pedidoService.list({
        page,
        pageSize,
        status,
        userId: req.user.role === 'VENDEDOR' ? req.user.id : userId
      })
    });
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const { clienteId, items, desconto, valorRecebido, formaPagamento } = req.body;
    const data = await pedidoService.create({
      usuarioId: req.user.id,
      clienteId,
      items,
      desconto,
      valorRecebido,
      formaPagamento
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof pedidoService.PedidoValidationError) {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ success: false, error: 'Cliente não encontrado.' });
    }
    return next(error);
  }
}

async function cancel(req, res, next) {
  try {
    return res.status(200).json({ success: true, data: await pedidoService.cancel(req.params.id) });
  } catch (error) {
    if (error instanceof pedidoService.PedidoValidationError || error instanceof pedidoService.PedidoNotFoundError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    return next(error);
  }
}

module.exports = { list, create, cancel };
