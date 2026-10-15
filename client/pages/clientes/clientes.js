document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formCliente');
  form.addEventListener('submit', salvarCliente);
  carregarClientes();
});

const getToken = () => (window.authService && authService.getToken()) || localStorage.getItem('token');
const { escapeHtml } = window.floriculturaUtils;
let clientes = [];

async function request(path, options = {}) {
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers || {}) }
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) throw new Error(payload.error || payload.message || 'Não foi possível concluir a operação.');
  return payload.data;
}

async function carregarClientes() {
  const tabela = document.getElementById('tabelaClientesBody');
  const feedback = document.getElementById('list-feedback');
  try {
    feedback.textContent = 'Carregando clientes...';
    clientes = await request('/clientes');
    tabela.innerHTML = clientes.map((cliente) => `<tr><td data-label="Nome"><strong>${escapeHtml(cliente.nome)}</strong></td><td data-label="CPF/CNPJ">${escapeHtml(cliente.cpfCnpj) || '-'}</td><td data-label="Telefone">${escapeHtml(cliente.telefone) || '-'}</td><td data-label="E-mail">${escapeHtml(cliente.email) || '-'}</td><td data-label="Ações"><button type="button" class="text-button" data-edit="${cliente.id}">Editar</button> <button type="button" class="text-button danger" data-remove="${cliente.id}">Excluir</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty-state">Nenhum cliente cadastrado.</td></tr>';
    document.getElementById('client-count').textContent = `${clientes.length} ${clientes.length === 1 ? 'cadastro' : 'cadastros'}`;
    feedback.textContent = '';
  } catch (error) {
    feedback.textContent = error.message;
    feedback.className = 'feedback is-error';
  }
}

function resetForm() {
  document.getElementById('cliente-id').value = '';
  document.getElementById('formCliente').reset();
  document.querySelector('#formCliente button[type="submit"]').textContent = 'Salvar cliente';
}

function preencherForm(cliente) {
  document.getElementById('cliente-id').value = cliente.id;
  document.getElementById('nome').value = cliente.nome || '';
  document.getElementById('cpfCnpj').value = cliente.cpfCnpj || '';
  document.getElementById('email').value = cliente.email || '';
  document.getElementById('telefone').value = cliente.telefone || '';
  document.getElementById('endereco').value = cliente.endereco || '';
  document.querySelector('#formCliente button[type="submit"]').textContent = 'Atualizar cliente';
}

document.getElementById('tabelaClientesBody').addEventListener('click', async (event) => {
  const editId = event.target.dataset.edit;
  const removeId = event.target.dataset.remove;
  if (editId) {
    const cliente = clientes.find((item) => item.id === editId);
    if (cliente) preencherForm(cliente);
  }
  if (removeId && window.confirm('Excluir este cliente?')) {
    const feedback = document.getElementById('list-feedback');
    try {
      await request(`/clientes/${removeId}`, { method: 'DELETE' });
      resetForm();
      await carregarClientes();
    } catch (error) {
      feedback.textContent = error.message;
      feedback.className = 'feedback is-error';
    }
  }
});

async function salvarCliente(event) {
  event.preventDefault();
  const feedback = document.getElementById('form-feedback');
  const button = event.target.querySelector('button[type="submit"]');
  const clienteId = document.getElementById('cliente-id').value;
  const payload = {
    nome: document.getElementById('nome').value,
    cpfCnpj: document.getElementById('cpfCnpj').value,
    email: document.getElementById('email').value,
    telefone: document.getElementById('telefone').value,
    endereco: document.getElementById('endereco').value
  };

  button.disabled = true;
  try {
    await request(clienteId ? `/clientes/${clienteId}` : '/clientes', { method: clienteId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    resetForm();
    feedback.textContent = clienteId ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.';
    feedback.className = 'feedback is-success';
    await carregarClientes();
  } catch (error) {
    feedback.textContent = error.message;
    feedback.className = 'feedback is-error';
  } finally {
    button.disabled = false;
  }
}
