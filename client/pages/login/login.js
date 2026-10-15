(function () {
  const form = document.querySelector('#login-form');
  const emailInput = document.querySelector('#email');
  const senhaInput = document.querySelector('#senha');
  const feedback = document.querySelector('#login-feedback');
  const button = document.querySelector('#login-button');

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    feedback.textContent = '';
    feedback.className = 'feedback';

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if (!email || !senha) {
      feedback.textContent = 'Informe seu e-mail e sua senha para continuar.';
      feedback.classList.add('is-error');
      return;
    }

    button.disabled = true;
    button.classList.add('is-loading');

    try {
      await authService.login(email, senha);
      feedback.textContent = 'Login realizado com sucesso.';
      feedback.classList.add('is-success');
      window.location.href = '../pdv/index.html';
    } catch (error) {
      feedback.textContent = error.message;
      feedback.classList.add('is-error');
    } finally {
      button.disabled = false;
      button.classList.remove('is-loading');
    }
  });
})();
