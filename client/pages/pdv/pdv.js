(function () {
  const CART_KEY = 'floricultura_pdv_carrinho';
  const productGrid = document.querySelector('#product-grid');
  const productFeedback = document.querySelector('#product-feedback');
  const productsCount = document.querySelector('#products-count');
  const cartItems = document.querySelector('#cart-items');
  const discountInput = document.querySelector('#discount');
  const clearCartButton = document.querySelector('#clear-cart');
  const continueButton = document.querySelector('#continue-sale');
  const checkoutModal = document.querySelector('#checkout-modal');
  const checkoutForm = document.querySelector('#checkout-form');
  const paymentMethod = document.querySelector('#payment-method');
  const cashFields = document.querySelector('#cash-fields');
  const amountReceived = document.querySelector('#amount-received');
  const changeValue = document.querySelector('#change-value');
  const checkoutFeedback = document.querySelector('#checkout-feedback');
  const confirmSaleButton = document.querySelector('#confirm-sale');
  const clienteSelect = document.querySelector('#clienteId');
  const receiptModal = document.querySelector('#modalComprovante');
  const whatsappButton = document.querySelector('#btnEnviarWhatsapp');
  const botanicalModal = document.querySelector('#modalFichaBotanica');
  const catalogFilters = document.querySelector('.catalog-filters');
  const globalSearchInput = document.querySelector('#global-search-input');
  const globalResults = document.querySelector('#global-results');
  const stockAlert = document.querySelector('#stock-alert');
  const { escapeHtml, formatCurrency: currency, normalizeWhatsappPhone, buildCareGuideMessage } = window.floriculturaUtils;
  let products = [];
  let catalogProducts = [];
  let cart = loadCart();
  let discount = 0;
  let activeCatalogFilter = 'TODOS';
  let pedidoAtualComprovante = null;

  async function carregarClientesSelect() {
    try {
      const response = await fetch('/api/v1/clientes', { headers: { Authorization: `Bearer ${authService.getToken()}` } });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Não foi possível carregar os clientes.');
      clienteSelect.innerHTML = '<option value="">Consumidor Final (Não identificado)</option>';
      (payload.data || []).forEach((cliente) => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = `${cliente.nome}${cliente.cpfCnpj ? ` (${cliente.cpfCnpj})` : ''}`;
        clienteSelect.appendChild(option);
      });
    } catch (error) {
      checkoutFeedback.textContent = error.message;
      checkoutFeedback.className = 'checkout-feedback is-error';
    }
  }

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(saved) ? saved.filter((item) => item && item.id && item.quantity > 0) : [];
    } catch (error) {
      return [];
    }
  }

  function persistCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function calculateSubtotal() {
    return cart.reduce((total, item) => total + Number(item.precoVenda) * item.quantity, 0);
  }

  function stockLabel(quantity) {
    if (quantity === 0) return '<span class="stock-warning">Esgotado</span>';
    if (quantity <= 5) return `<span class="stock-warning">Estoque baixo: ${quantity}</span>`;
    return `<span>${quantity} disponíveis</span>`;
  }

  function renderProducts(filteredProducts) {
    productsCount.textContent = `${filteredProducts.length} ${filteredProducts.length === 1 ? 'item disponível' : 'itens disponíveis'}`;
    productGrid.innerHTML = filteredProducts.map((product) => `<article class="product-card"><button class="product-details-button" data-details="${product.id}" type="button">Ficha botânica</button><div class="product-image">${product.imagemUrl ? `<img src="${escapeHtml(product.imagemUrl)}" alt="" />` : '<span aria-hidden="true">✿</span>'}</div><div class="product-card-body"><span class="product-category">${escapeHtml(product.categoria)}</span><h3>${escapeHtml(product.nome)}</h3><p class="product-sku">${escapeHtml(product.sku)}</p><div class="product-card-footer"><div><strong>${currency(product.precoVenda)}</strong>${stockLabel(product.quantidadeEstoque)}</div><button class="add-button" data-add="${product.id}" type="button" aria-label="Adicionar ${escapeHtml(product.nome)}" ${product.quantidadeEstoque === 0 ? 'disabled' : ''}>+</button></div></div></article>`).join('') || '<div class="empty-products">Nenhum produto disponível para seleção.</div>';
  }

  function filterCatalogProducts() {
    const term = document.querySelector('#quick-search').value.trim().toLowerCase();
    const filtered = catalogProducts.filter((product) => {
      const matchesCategory = activeCatalogFilter === 'TODOS' || (activeCatalogFilter === 'PLANTAS' && product.categoria === 'PLANTA') || (activeCatalogFilter === 'INSUMOS' && ['INSUMO', 'VASO'].includes(product.categoria));
      return matchesCategory && `${product.nome} ${product.sku}`.toLowerCase().includes(term);
    });
    products = filtered;
    renderProducts(filtered);
  }

  async function setCatalogFilter(filter) {
    activeCatalogFilter = filter;
    document.querySelectorAll('[data-catalog-filter]').forEach((button) => button.classList.toggle('is-active', button.dataset.catalogFilter === filter));
    try {
      const result = await produtosService.list(1, 100, '', '', filter === 'POPULARES');
      catalogProducts = result.items.filter((product) => product.ativo);
      reconcileCart();
      filterCatalogProducts();
    } catch (error) {
      showFeedback(error.message, true);
    }
  }

  function openBotanicalSheet(id) {
    const product = catalogProducts.find((entry) => entry.id === id);
    if (!product) return;
    document.querySelector('#fbNome').textContent = product.nome;
    document.querySelector('#fbSku').textContent = product.sku;
    document.querySelector('#fbPreco').textContent = currency(product.precoVenda);
    document.querySelector('#fbRega').textContent = product.rega || 'Não informada';
    document.querySelector('#fbIluminacao').textContent = product.iluminacao || 'Não informada';
    document.querySelector('#fbCuidados').textContent = product.cuidados || 'Não informado';
    document.querySelector('#fbUsos').textContent = product.usos || 'Não informado';
    document.querySelector('#fbArgumentos').textContent = product.argumentosVenda || 'Planta de alta durabilidade e excelente opção para presente.';

    const suggestedIds = (product.sugestoesIds || '').split(',').map((suggestionId) => suggestionId.trim()).filter(Boolean);
    const suggested = suggestedIds.map((suggestionId) => catalogProducts.find((entry) => entry.id === suggestionId)).filter((entry) => entry && entry.quantidadeEstoque > 0);
    const fallback = catalogProducts.filter((entry) => entry.id !== product.id && entry.quantidadeEstoque > 0 && ['INSUMO', 'VASO'].includes(entry.categoria));
    const suggestions = [...suggested, ...fallback.filter((entry) => !suggested.some((item) => item.id === entry.id))].slice(0, 3);
    document.querySelector('#containerVendaCasada').innerHTML = suggestions.map((suggestion) => `<article class="suggestion-card"><strong>${escapeHtml(suggestion.nome)}</strong><span>${currency(suggestion.precoVenda)}</span><button class="suggestion-add-button" data-suggestion-add="${suggestion.id}" type="button">Adicionar</button></article>`).join('') || '<p class="empty-suggestions">Nenhum item sugerido disponível.</p>';
    botanicalModal.hidden = false;
  }

  function closeBotanicalSheet() {
    botanicalModal.hidden = true;
  }

  function reconcileCart() {
    cart = cart.map((item) => {
      const product = catalogProducts.find((entry) => entry.id === item.id);
      if (!product || product.quantidadeEstoque <= 0) return null;
      return { ...product, quantity: Math.min(item.quantity, product.quantidadeEstoque) };
    }).filter(Boolean);
    persistCart();
  }

  function renderCart() {
    if (!cart.length) {
      cartItems.innerHTML = '<div class="empty-cart"><span aria-hidden="true">＋</span><strong>Seu carrinho está vazio</strong><p>Selecione um produto ao lado para começar.</p></div>';
    } else {
      cartItems.innerHTML = cart.map((item) => `<article class="cart-item"><div class="cart-item-info"><strong>${escapeHtml(item.nome)}</strong><span>${currency(item.precoVenda)} cada</span></div><div class="cart-item-actions"><div class="quantity-control"><button data-decrease="${item.id}" type="button" aria-label="Diminuir quantidade">−</button><strong>${item.quantity}</strong><button data-increase="${item.id}" type="button" aria-label="Aumentar quantidade" ${item.quantity >= item.quantidadeEstoque ? 'disabled' : ''}>+</button></div><strong class="item-subtotal">${currency(Number(item.precoVenda) * item.quantity)}</strong><button class="remove-button" data-remove="${item.id}" type="button" aria-label="Remover item">×</button></div></article>`).join('');
    }

    const subtotal = calculateSubtotal();
    discount = Math.min(Math.max(discount, 0), subtotal);
    discountInput.value = discount.toFixed(2);
    document.querySelector('#subtotal').textContent = currency(subtotal);
    document.querySelector('#discount-total').textContent = `- ${currency(discount)}`;
    document.querySelector('#grand-total').textContent = currency(subtotal - discount);
    continueButton.disabled = cart.length === 0;
    clearCartButton.disabled = cart.length === 0;
    document.querySelector('#checkout-total').textContent = currency(subtotal - discount);
    persistCart();
  }

  function updateCashFields() {
    const isCash = paymentMethod.value === 'DINHEIRO';
    cashFields.hidden = !isCash;
    if (!isCash) return;
    const received = Number(amountReceived.value) || 0;
    changeValue.textContent = currency(Math.max(received - (calculateSubtotal() - discount), 0));
  }

  function openCheckout() {
    if (!cart.length) return;
    checkoutFeedback.textContent = '';
    paymentMethod.value = 'DINHEIRO';
    amountReceived.value = '';
    updateCashFields();
    checkoutModal.hidden = false;
    paymentMethod.focus();
  }

  function closeCheckout() {
    checkoutModal.hidden = true;
  }

  function exibirComprovante(pedido) {
    pedidoAtualComprovante = pedido;
    document.querySelector('#reciboId').textContent = pedido.id;
    document.querySelector('#reciboData').textContent = new Date(pedido.createdAt).toLocaleString('pt-BR');
    document.querySelector('#reciboAtendente').textContent = pedido.usuario?.nome || 'Atendente';
    document.querySelector('#reciboCliente').textContent = pedido.cliente ? `${pedido.cliente.nome}${pedido.cliente.cpfCnpj ? ` (${pedido.cliente.cpfCnpj})` : ''}` : 'Consumidor Final';
    document.querySelector('#reciboItensList').innerHTML = (pedido.itens || []).map((item) => `<li>${item.quantidade}x ${escapeHtml(item.produto?.nome || 'Produto')} - ${currency(Number(item.subtotal || Number(item.precoUnitario) * item.quantidade))}</li>`).join('');
    document.querySelector('#reciboDesconto').textContent = currency(Number(pedido.desconto || 0));
    document.querySelector('#reciboFormaPgto').textContent = pedido.formaPagamento;
    document.querySelector('#reciboTotal').textContent = currency(Number(pedido.valorTotal || 0));
    document.querySelector('#reciboTroco').textContent = currency(Number(pedido.troco || 0));
    whatsappButton.hidden = !pedido.cliente?.telefone;
    receiptModal.hidden = false;
  }

  function enviarGuiaWhatsapp() {
    if (!pedidoAtualComprovante?.cliente?.telefone) {
      showFeedback('Este pedido não possui cliente com telefone cadastrado.', true);
      return;
    }

    const { cliente, itens = [] } = pedidoAtualComprovante;
    const telefone = normalizeWhatsappPhone(cliente.telefone);
    if (!telefone) {
      showFeedback('O telefone do cliente é inválido para WhatsApp.', true);
      return;
    }
    const mensagem = buildCareGuideMessage(cliente, itens);
    window.open(`https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener,noreferrer');
  }

  function fecharComprovante() {
    receiptModal.hidden = true;
  }

  function showFeedback(message, isError = false) {
    productFeedback.textContent = message;
    productFeedback.className = isError ? 'feedback is-error' : 'feedback';
    if (message) window.setTimeout(() => { productFeedback.textContent = ''; }, 2600);
  }

  function addToCart(id) {
    const product = catalogProducts.find((entry) => entry.id === id);
    if (!product || product.quantidadeEstoque <= 0) return;
    const item = cart.find((entry) => entry.id === id);
    if (item && item.quantity >= product.quantidadeEstoque) {
      showFeedback(`Estoque máximo atingido para ${product.nome}.`, true);
      return;
    }
    if (item) item.quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    renderCart();
  }

  function updateQuantity(id, amount) {
    const item = cart.find((entry) => entry.id === id);
    if (!item) return;
    const nextQuantity = item.quantity + amount;
    if (nextQuantity > item.quantidadeEstoque) {
      showFeedback(`Não há mais unidades disponíveis de ${item.nome}.`, true);
      return;
    }
    if (nextQuantity <= 0) cart = cart.filter((entry) => entry.id !== id);
    else item.quantity = nextQuantity;
    renderCart();
  }

  function filterProducts() { filterCatalogProducts(); }

  productGrid.addEventListener('click', (event) => {
    if (event.target.dataset.add) addToCart(event.target.dataset.add);
    if (event.target.dataset.details) openBotanicalSheet(event.target.dataset.details);
  });
  document.querySelector('#containerVendaCasada').addEventListener('click', (event) => { if (event.target.dataset.suggestionAdd) addToCart(event.target.dataset.suggestionAdd); });
  catalogFilters.addEventListener('click', (event) => { if (event.target.dataset.catalogFilter) setCatalogFilter(event.target.dataset.catalogFilter); });
  cartItems.addEventListener('click', (event) => {
    if (event.target.dataset.increase) updateQuantity(event.target.dataset.increase, 1);
    if (event.target.dataset.decrease) updateQuantity(event.target.dataset.decrease, -1);
    if (event.target.dataset.remove) { cart = cart.filter((item) => item.id !== event.target.dataset.remove); renderCart(); }
  });
  document.querySelector('#quick-search').addEventListener('input', filterProducts);
  globalSearchInput.addEventListener('input', async () => {
    const query = globalSearchInput.value.trim();
    if (query.length < 2) { globalResults.hidden = true; return; }
    try {
      const response = await fetch(`${window.API_BASE_URL}/busca?q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${authService.getToken()}` } });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Não foi possível pesquisar.');
      const data = payload.data;
      globalResults.innerHTML = `<strong>Produtos</strong>${data.produtos.map((item) => `<button type="button" data-global-product="${escapeHtml(item.id)}">${escapeHtml(item.nome)} · ${escapeHtml(item.sku)}</button>`).join('') || '<span>Nenhum produto encontrado.</span>'}<strong>Clientes</strong>${data.clientes.map((item) => `<span>${escapeHtml(item.nome)}${item.telefone ? ` · ${escapeHtml(item.telefone)}` : ''}</span>`).join('') || '<span>Nenhum cliente encontrado.</span>'}`;
      globalResults.hidden = false;
    } catch (error) { showFeedback(error.message, true); }
  });
  globalResults.addEventListener('click', (event) => { if (event.target.dataset.globalProduct) { globalSearchInput.value = ''; globalResults.hidden = true; openBotanicalSheet(event.target.dataset.globalProduct); } });
  document.querySelector('#web-search').addEventListener('click', () => { const query = globalSearchInput.value.trim(); if (query) window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer'); });
  discountInput.addEventListener('input', () => { discount = Number(discountInput.value) || 0; renderCart(); });
  clearCartButton.addEventListener('click', () => { cart = []; renderCart(); });
  continueButton.addEventListener('click', openCheckout);
  document.querySelector('#close-checkout').addEventListener('click', closeCheckout);
  checkoutModal.addEventListener('click', (event) => { if (event.target === checkoutModal) closeCheckout(); });
  paymentMethod.addEventListener('change', updateCashFields);
  amountReceived.addEventListener('input', updateCashFields);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeCheckout(); });
  document.querySelector('#close-receipt').addEventListener('click', fecharComprovante);
  document.querySelector('#print-receipt').addEventListener('click', () => window.print());
  whatsappButton.addEventListener('click', enviarGuiaWhatsapp);
  receiptModal.addEventListener('click', (event) => { if (event.target === receiptModal) fecharComprovante(); });
  document.querySelector('#close-botanical').addEventListener('click', closeBotanicalSheet);
  botanicalModal.addEventListener('click', (event) => { if (event.target === botanicalModal) closeBotanicalSheet(); });

  checkoutForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const total = calculateSubtotal() - discount;
    const received = Number(amountReceived.value) || 0;
    if (paymentMethod.value === 'DINHEIRO' && received < total) {
      checkoutFeedback.textContent = `Valor recebido insuficiente. Faltam ${currency(total - received)}.`;
      checkoutFeedback.className = 'checkout-feedback is-error';
      return;
    }

    confirmSaleButton.disabled = true;
    confirmSaleButton.textContent = 'Processando...';
    checkoutFeedback.textContent = '';
    try {
      const pedido = await pedidosService.create({
        clienteId: clienteSelect.value || null,
        items: cart.map((item) => ({ produtoId: item.id, quantidade: item.quantity })),
        desconto: discount,
        formaPagamento: paymentMethod.value,
        valorRecebido: paymentMethod.value === 'DINHEIRO' ? received : null
      });
      cart = [];
      discount = 0;
      persistCart();
      closeCheckout();
      await initialize();
      exibirComprovante(pedido);
      showFeedback(`Venda finalizada com sucesso. Pedido ${pedido.id.slice(0, 8)}.`, false);
    } catch (error) {
      checkoutFeedback.textContent = error.message;
      checkoutFeedback.className = 'checkout-feedback is-error';
    } finally {
      confirmSaleButton.disabled = false;
      confirmSaleButton.textContent = 'Confirmar venda';
    }
  });

  async function initialize() {
    try {
      const result = await produtosService.list(1, 100, '', '');
      catalogProducts = result.items.filter((product) => product.ativo);
      products = catalogProducts;
      reconcileCart();
      filterCatalogProducts();
      renderCart();
      const alertResponse = await fetch(`${window.API_BASE_URL}/produtos/alertas-estoque`, { headers: { Authorization: `Bearer ${authService.getToken()}` } });
      const alertPayload = await alertResponse.json();
      if (alertResponse.ok && alertPayload.success) {
        const zeroed = alertPayload.data.zerados.length;
        const low = alertPayload.data.baixos.length;
        stockAlert.textContent = `${zeroed} esgotado(s) e ${low} produto(s) com estoque baixo.`;
        stockAlert.hidden = zeroed + low === 0;
      }
    } catch (error) {
      productFeedback.textContent = error.message;
      productFeedback.classList.add('is-error');
    }
  }

  Promise.all([initialize(), carregarClientesSelect()]);
})();
