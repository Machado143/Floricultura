const usuarioService = require('../services/usuarioService');

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sendError(res, error) {
  if (error.code === 'P2002') {
    return res.status(409).json({ success: false, error: 'Este e-mail já está cadastrado' });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
  }

  return null;
}

async function list(req, res, next) {
  try {
    return res.status(200).json({ success: true, data: await usuarioService.list() });
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const { nome, email, senha, role } = req.body;

    if (typeof nome !== 'string' || !nome.trim() || !isValidEmail(email) || typeof senha !== 'string' || senha.length < 8) {
      return res.status(400).json({ success: false, error: 'Nome, e-mail válido e senha com pelo menos 8 caracteres são obrigatórios' });
    }
    if (!usuarioService.isValidRole(role)) {
      return res.status(400).json({ success: false, error: 'Perfil de usuário inválido' });
    }

    return res.status(201).json({ success: true, data: await usuarioService.create({ nome, email, senha, role }) });
  } catch (error) {
    return sendError(res, error) || next(error);
  }
}

async function update(req, res, next) {
  try {
    const { nome, email, senha, role, ativo } = req.body;

    if (email !== undefined && !isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'E-mail inválido' });
    }
    if (role !== undefined && !usuarioService.isValidRole(role)) {
      return res.status(400).json({ success: false, error: 'Perfil de usuário inválido' });
    }
    if (nome !== undefined && (typeof nome !== 'string' || !nome.trim())) {
      return res.status(400).json({ success: false, error: 'Nome não pode ficar vazio' });
    }
    if (senha !== undefined && (typeof senha !== 'string' || senha.length < 8)) {
      return res.status(400).json({ success: false, error: 'A senha deve ter pelo menos 8 caracteres' });
    }

    return res.status(200).json({
      success: true,
      data: await usuarioService.update(req.params.id, { nome, email, senha, role, ativo })
    });
  } catch (error) {
    return sendError(res, error) || next(error);
  }
}

async function remove(req, res, next) {
  try {
    return res.status(200).json({ success: true, data: await usuarioService.deactivate(req.params.id) });
  } catch (error) {
    return sendError(res, error) || next(error);
  }
}

module.exports = { list, create, update, remove };
