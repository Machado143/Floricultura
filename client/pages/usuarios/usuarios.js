(function () {
  const { escapeHtml } = window.floriculturaUtils;
  const currentUser = authService.getUser();
  const isAdmin = currentUser && currentUser.role === 'ADMIN';
  const table = document.querySelector('#users-table');
  const count = document.querySelector('#user-count');
  const pageFeedback = document.querySelector('#page-feedback');
  const modalFeedback = document.querySelector('#modal-feedback');
  const modal = document.querySelector('#user-modal');
  const form = document.querySelector('#user-form');
  const newUserButton = document.querySelector('#new-user');
  let users = [];

  document.querySelector('#current-user').textContent = currentUser ? `${currentUser.nome} · ${formatRole(currentUser.role)}` : 'Sessão não identificada';
  newUserButton.disabled = !isAdmin;
  newUserButton.title = isAdmin ? 'Criar novo usuário' : 'Apenas administradores podem criar usuários';

  function formatRole(role) {
    return { ADMIN: 'Administrador', GERENTE: 'Gerente', VENDEDOR: 'Vendedor' }[role] || role;
  }

  function render() {
    count.textContent = `${users.length} ${users.length === 1 ? 'pessoa' : 'pessoas'}`;
    table.innerHTML = users.map((user) => `
      <tr class="${user.ativo ? '' : 'is-inactive'}">
        <td data-label="Nome"><strong>${escapeHtml(user.nome)}</strong></td>
        <td data-label="E-mail">${escapeHtml(user.email)}</td>
        <td data-label="Perfil"><span class="role-badge role-${user.role.toLowerCase()}">${formatRole(user.role)}</span></td>
        <td data-label="Status"><span class="status-badge">${user.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td class="row-actions">${isAdmin ? `<button class="text-button" data-edit="${user.id}" type="button">Editar</button>${user.ativo && user.id !== currentUser?.id ? `<button class="text-button danger" data-remove="${user.id}" type="button">Inativar</button>` : ''}` : '<span class="muted-action">Somente leitura</span>'}</td>
      </tr>`).join('');
  }

  async function loadUsers() {
    try {
      users = await usuariosService.list();
      render();
    } catch (error) {
      pageFeedback.textContent = error.message;
      pageFeedback.classList.add('is-error');
    }
  }

  function openModal(user) {
    form.reset();
    modalFeedback.textContent = '';
    document.querySelector('#user-id').value = user ? user.id : '';
    document.querySelector('#modal-title').textContent = user ? 'Editar usuário' : 'Novo usuário';
    document.querySelector('#user-name').value = user ? user.nome : '';
    document.querySelector('#user-email').value = user ? user.email : '';
    document.querySelector('#user-role').value = user ? user.role : 'VENDEDOR';
    document.querySelector('#password-hint').textContent = user ? '(deixe em branco para manter)' : '(obrigatória)';
    modal.hidden = false;
    document.querySelector('#user-name').focus();
  }

  function closeModal() { modal.hidden = true; }

  newUserButton.addEventListener('click', () => { if (isAdmin) openModal(); });
  document.querySelector('#close-modal').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });

  table.addEventListener('click', async (event) => {
    const editId = event.target.dataset.edit;
    const removeId = event.target.dataset.remove;
    if (editId) openModal(users.find((user) => user.id === editId));
    if (removeId && window.confirm('Inativar este usuário?')) {
      try { await usuariosService.remove(removeId); await loadUsers(); } catch (error) { pageFeedback.textContent = error.message; pageFeedback.classList.add('is-error'); }
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    modalFeedback.textContent = '';
    const id = document.querySelector('#user-id').value;
    const data = { nome: document.querySelector('#user-name').value.trim(), email: document.querySelector('#user-email').value.trim(), role: document.querySelector('#user-role').value, senha: document.querySelector('#user-password').value };
    if (!id && !data.senha) { modalFeedback.textContent = 'Informe uma senha para o novo usuário.'; modalFeedback.classList.add('is-error'); return; }
    try { if (id) await usuariosService.update(id, data); else await usuariosService.create(data); closeModal(); await loadUsers(); } catch (error) { modalFeedback.textContent = error.message; modalFeedback.classList.add('is-error'); }
  });

  loadUsers();
})();
