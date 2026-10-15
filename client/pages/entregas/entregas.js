document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('formEntrega').addEventListener('submit', salvarAgendamento);
  carregarClientes();
  carregarEntregas();
});

const getToken = () => (window.authService && authService.getToken()) || localStorage.getItem('token');
const { escapeHtml } = window.floriculturaUtils;
const statusLabels = { PENDENTE: 'Pendente', EM_PREPARACAO: 'Em preparação', SAIU_PARA_ENTREGA: 'Saiu para entrega', ENTREGUE: 'Entregue', CANCELADO: 'Cancelado' };
const allowedTransitions = {
  PENDENTE: ['EM_PREPARACAO', 'CANCELADO'],
  EM_PREPARACAO: ['SAIU_PARA_ENTREGA', 'CANCELADO'],
  SAIU_PARA_ENTREGA: ['ENTREGUE', 'CANCELADO'],
  ENTREGUE: [],
  CANCELADO: []
};

async function request(path, options = {}) {
  const response = await fetch(`/api/v1${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers || {}) } });
  const payload = await response.json();
  if (!response.ok || !payload.success) throw new Error(payload.error || payload.message || 'Não foi possível concluir a operação.');
  return payload.data;
}

async function carregarClientes() {
  const select = document.getElementById('clienteSelect');
  try {
    const clientes = await request('/clientes');
    select.innerHTML = '<option value="">Selecione o cliente</option>';
    clientes.forEach((cliente) => {
      const option = document.createElement('option');
      option.value = cliente.id;
      option.textContent = `${cliente.nome} - Tel: ${cliente.telefone || 'N/I'} (${cliente.cpfCnpj || 'Sem CPF/CNPJ'})`;
      option.disabled = !cliente.nome || !cliente.telefone || !cliente.cpfCnpj;
      select.appendChild(option);
    });
  } catch (error) {
    const feedback = document.getElementById('form-feedback');
    feedback.textContent = error.message;
    feedback.className = 'feedback is-error';
  }
}

function renderEntregas(entregas) {
  const tabela = document.getElementById('tabelaEntregasBody');
  tabela.innerHTML = entregas.map((entrega) => {
    const date = new Date(entrega.dataEntrega).toLocaleDateString('pt-BR');
    const statusOptions = Object.entries(statusLabels)
      .filter(([value]) => value === entrega.status || allowedTransitions[entrega.status].includes(value))
      .map(([value, label]) => `<option value="${value}" ${entrega.status === value ? 'selected' : ''}>${label}</option>`).join('');
    return `<tr><td data-label="Data / hora">${date} às ${escapeHtml(entrega.horarioEntrega)}</td><td data-label="Cliente"><strong>${escapeHtml(entrega.cliente?.nome)}</strong></td><td data-label="Telefone">${escapeHtml(entrega.cliente?.telefone) || '-'}</td><td data-label="Endereço">${escapeHtml(entrega.endereco)}</td><td data-label="Status"><span class="status-badge status-${entrega.status.toLowerCase()}">${statusLabels[entrega.status] || entrega.status}</span></td><td data-label="Ações"><select class="status-select" data-entrega-id="${escapeHtml(entrega.id)}" aria-label="Atualizar status de ${escapeHtml(entrega.cliente?.nome)}">${statusOptions}</select></td></tr>`;
  }).join('') || '<tr><td colspan="6" class="empty-state">Nenhuma entrega agendada.</td></tr>';
  document.getElementById('delivery-count').textContent = `${entregas.length} ${entregas.length === 1 ? 'entrega' : 'entregas'}`;
}

async function carregarEntregas() {
  const feedback = document.getElementById('list-feedback');
  try {
    feedback.textContent = 'Carregando entregas...';
    const entregas = await request('/entregas');
    renderEntregas(entregas);
    feedback.textContent = '';
  } catch (error) {
    feedback.textContent = error.message;
    feedback.className = 'feedback is-error';
  }
}

async function salvarAgendamento(event) {
  event.preventDefault();
  const form = event.target;
  const feedback = document.getElementById('form-feedback');
  const button = form.querySelector('button[type="submit"]');
  const payload = { clienteId: document.getElementById('clienteSelect').value, dataEntrega: document.getElementById('dataEntrega').value, horarioEntrega: document.getElementById('horarioEntrega').value, endereco: document.getElementById('endereco').value, observacao: document.getElementById('observacao').value };
  button.disabled = true;
  try {
    await request('/entregas', { method: 'POST', body: JSON.stringify(payload) });
    form.reset();
    feedback.textContent = 'Entrega agendada com sucesso.';
    feedback.className = 'feedback is-success';
    await carregarEntregas();
  } catch (error) {
    feedback.textContent = error.message;
    feedback.className = 'feedback is-error';
  } finally {
    button.disabled = false;
  }
}

document.getElementById('tabelaEntregasBody').addEventListener('change', async (event) => {
  if (!event.target.matches('.status-select')) return;
  try {
    await request(`/entregas/${event.target.dataset.entregaId}/status`, { method: 'PATCH', body: JSON.stringify({ status: event.target.value }) });
    await carregarEntregas();
  } catch (error) {
    document.getElementById('list-feedback').textContent = error.message;
    document.getElementById('list-feedback').className = 'feedback is-error';
  }
});
