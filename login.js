const form = document.getElementById('loginForm');
const error = document.getElementById('error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  error.textContent = '';

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      error.textContent = data.message || 'Falha no login';
      return;
    }

    // Login OK → vai para o Tetris
    window.location.href = '/a7tn2eh5k9.html';

  } catch {
    error.textContent = 'Erro ao conectar com o servidor';
  }
});
