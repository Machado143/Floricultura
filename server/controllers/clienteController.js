const prisma = require('../config/prisma');

async function listarClientes(req, res, next) {
  try {
    const clientes = await prisma.cliente.findMany({ orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ success: true, data: clientes });
  } catch (error) {
    return next(error);
  }
}

async function criarCliente(req, res, next) {
  try {
    const { nome, cpfCnpj, email, telefone, endereco } = req.body;
    const normalizedName = typeof nome === 'string' ? nome.trim() : '';

    if (!normalizedName) {
      return res.status(400).json({ success: false, error: 'O nome do cliente é obrigatório.' });
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome: normalizedName,
        cpfCnpj: cpfCnpj?.trim() || null,
        email: email?.trim() || null,
        telefone: telefone?.trim() || null,
        endereco: endereco?.trim() || null
      }
    });

    return res.status(201).json({ success: true, data: cliente });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'CPF/CNPJ já cadastrado.' });
    }
    return next(error);
  }
}

async function atualizarCliente(req, res, next) {
  try {
    const { nome, cpfCnpj, email, telefone, endereco } = req.body;
    const normalizedName = typeof nome === 'string' ? nome.trim() : '';

    if (!normalizedName) {
      return res.status(400).json({ success: false, error: 'O nome do cliente é obrigatório.' });
    }

    const cliente = await prisma.cliente.update({
      where: { id: req.params.id },
      data: {
        nome: normalizedName,
        cpfCnpj: cpfCnpj?.trim() || null,
        email: email?.trim() || null,
        telefone: telefone?.trim() || null,
        endereco: endereco?.trim() || null
      }
    });

    return res.status(200).json({ success: true, data: cliente });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'CPF/CNPJ já cadastrado.' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });
    }
    return next(error);
  }
}

async function removerCliente(req, res, next) {
  try {
    await prisma.cliente.delete({ where: { id: req.params.id } });
    return res.status(200).json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(409).json({ success: false, error: 'Este cliente possui pedidos ou entregas vinculados e não pode ser excluído.' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });
    }
    return next(error);
  }
}

module.exports = { listarClientes, criarCliente, atualizarCliente, removerCliente };