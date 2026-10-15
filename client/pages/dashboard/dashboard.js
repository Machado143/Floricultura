(function () {
  const feedback = document.querySelector('#dashboard-feedback');
  const paymentLabels = { DINHEIRO: 'Dinheiro', PIX: 'PIX', CARTAO_CREDITO: 'Cartão de crédito', CARTAO_DEBITO: 'Cartão de débito' };
  const orderStatusLabels = { CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado' };
  const { escapeHtml, formatCurrency: currency } = window.floriculturaUtils;

  function ensureRecentOrdersPanel() {
    const existingPanel = document.querySelector('#recent-orders-panel');
    if (existingPanel) return existingPanel;

    const panel = document.createElement('section');
    panel.id = 'recent-orders-panel';
    panel.className = 'dashboard-panel recent-orders-panel';
    panel.style.gridColumn = '1 / -1';
    panel.innerHTML = '<div class="panel-heading"><div><p class="eyebrow">Histórico</p><h2>Pedidos recentes</h2></div><span class="panel-note">Últimos 5 lançamentos</span></div><div class="urgent-table-wrap"><table><thead><tr><th>Data</th><th>Pedido</th><th>Cliente</th><th>Total</th><th>Status</th></tr></thead><tbody id="recent-orders"></tbody></table></div>';
    document.querySelector('.dashboard-grid').appendChild(panel);
    return panel;
  }

  function renderPayments(items) {
    const maximum = Math.max(...items.map((item) => Number(item.faturamento)), 1);
    document.querySelector('#payment-list').innerHTML = items.map((item) => `<div class="payment-row"><div class="payment-meta"><span>${paymentLabels[item.formaPagamento]}</span><strong>${currency(item.faturamento)}</strong></div><div class="payment-bar"><span style="width: ${Math.round((Number(item.faturamento) / maximum) * 100)}%"></span></div><small>${item.quantidadeVendas} ${item.quantidadeVendas === 1 ? 'venda' : 'vendas'}</small></div>`).join('');
  }

  function renderRecentOrders(items) {
    document.querySelector('#recent-orders').innerHTML = items.map((item) => {
      const statusLabel = orderStatusLabels[item.status] || item.status;
      const statusTone = item.status === 'CANCELADO' ? 'style="background:#f3e0dc;color:#8c4a3a;"' : 'style="background:#e3efe4;color:#285540;"';
      return `<tr><td data-label="Data">${new Date(item.createdAt).toLocaleString('pt-BR')}</td><td data-label="Pedido"><strong>${escapeHtml(item.id.slice(0, 8))}</strong></td><td data-label="Cliente">${escapeHtml(item.cliente?.nome || 'Consumidor final')}</td><td data-label="Total">${currency(item.valorTotal)}</td><td data-label="Status"><span class="critical-stock" ${statusTone}>${escapeHtml(statusLabel)}</span></td></tr>`;
    }).join('') || '<tr><td colspan="5" class="empty-state">Nenhum pedido encontrado.</td></tr>';
  }

  function renderCriticalProducts(products) {
    document.querySelector('#critical-products').innerHTML = products.map((product) => `<tr><td data-label="Produto"><strong>${escapeHtml(product.nome)}</strong><span>${escapeHtml(product.categoria)}</span></td><td data-label="SKU">${escapeHtml(product.sku)}</td><td data-label="Saldo"><span class="critical-stock ${product.nivelEstoque === 'ZERADO' ? 'is-empty' : ''}">${product.nivelEstoque === 'ZERADO' ? 'Esgotado' : 'Estoque baixo'} · ${product.quantidadeEstoque} un.</span></td></tr>`).join('') || '<tr><td colspan="3" class="empty-state">Nenhum produto em nível crítico.</td></tr>';
  }

  async function loadDashboard() {
    ensureRecentOrdersPanel();
    feedback.textContent = 'Atualizando indicadores...';
    feedback.className = 'feedback';
    try {
      const [kpis, payments, recentOrdersResponse] = await Promise.all([
        dashboardService.getKpis(),
        dashboardService.getSalesByPayment(),
        fetch(`${window.API_BASE_URL}/pedidos?page=1&pageSize=5`, { headers: { Authorization: `Bearer ${authService.getToken()}` } })
      ]);
      const recentOrdersPayload = await recentOrdersResponse.json();

      if (!recentOrdersResponse.ok || !recentOrdersPayload.success) {
        throw new Error(recentOrdersPayload.error || 'Não foi possível carregar os pedidos recentes.');
      }

      document.querySelector('#revenue-kpi').textContent = currency(kpis.faturamentoDia);
      document.querySelector('#sales-kpi').textContent = kpis.vendasHoje;
      document.querySelector('#loss-kpi').textContent = kpis.perdasNoMes.quantidade;
      document.querySelector('#alert-kpi').textContent = kpis.produtosEmAlerta;
      renderPayments(payments);
      renderCriticalProducts(kpis.produtosCriticos);
      renderRecentOrders(recentOrdersPayload.data.items || []);
      feedback.textContent = `Atualizado às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch (error) {
      feedback.textContent = error.message;
      feedback.className = 'feedback is-error';
    }
  }

  document.querySelector('#refresh-dashboard').addEventListener('click', loadDashboard);
  loadDashboard();
  window.setInterval(loadDashboard, 60 * 1000);
})();
