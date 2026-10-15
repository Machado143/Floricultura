const bcrypt = require('bcryptjs');

const prisma = require('../config/prisma');

const ROLES = ['ADMIN', 'GERENTE', 'VENDEDOR'];
const publicFields = {
  id: true,
  nome: true,
  email: true,
  ativo: true,
  role: true,
  createdAt: true,
  updatedAt: true
};

function isValidRole(role) {
  return !role || ROLES.includes(role);
}

async function list() {
  return prisma.usuario.findMany({
    select: publicFields,
    orderBy: { nome: 'asc' }
  });
}

async function countActiveAdmins(tx = prisma) {
  return tx.usuario.count({ where: { role: 'ADMIN', ativo: true } });
}

async function create({ nome, email, senha, role }) {
  const senhaHash = await bcrypt.hash(senha, 10);

  return prisma.usuario.create({
    data: {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha: senhaHash,
      role: role || 'VENDEDOR'
    },
    select: publicFields
  });
}

async function update(id, data, actorId) {
  return prisma.$transaction(async (tx) => {
    const currentUser = await tx.usuario.findUnique({ where: { id }, select: { id: true, role: true, ativo: true } });

    if (!currentUser) {
      throw Object.assign(new Error('Usuário não encontrado'), { code: 'P2025' });
    }

    const updateData = {};

    if (data.nome !== undefined) updateData.nome = data.nome.trim();
    if (data.email !== undefined) updateData.email = data.email.trim().toLowerCase();
    if (data.role !== undefined) updateData.role = data.role;
    if (data.ativo !== undefined) updateData.ativo = data.ativo;
    if (data.senha) updateData.senha = await bcrypt.hash(data.senha, 10);

    const currentAdminCount = currentUser.role === 'ADMIN' && currentUser.ativo ? await countActiveAdmins(tx) : null;

    if (actorId && actorId === id && updateData.ativo === false) {
      throw new Error('Você não pode desativar sua própria conta');
    }

    if (currentUser.role === 'ADMIN' && currentUser.ativo) {
      const roleWouldRemoveAdmin = updateData.role && updateData.role !== 'ADMIN';
      const activeWouldDeactivate = updateData.ativo === false;
      if ((roleWouldRemoveAdmin || activeWouldDeactivate) && currentAdminCount <= 1) {
        throw new Error('Não é possível remover o último administrador ativo');
      }
    }

    return tx.usuario.update({
      where: { id },
      data: updateData,
      select: publicFields
    });
  });
}

async function deactivate(id, actorId) {
  return update(id, { ativo: false }, actorId);
}

module.exports = {
  ROLES,
  isValidRole,
  countActiveAdmins,
  list,
  create,
  update,
  deactivate
};
