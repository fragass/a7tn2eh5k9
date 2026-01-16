// Seleciona o formulário e o span de erro
const form = document.getElementById("loginForm");
const error = document.getElementById("error");

// Sempre que a página de login carregar, limpa qualquer autenticação
sessionStorage.removeItem("auth");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  error.textContent = "";

  const username = form.username.value.trim();
  const password = form.password.value.trim();

  // Usuários válidos (substitua ou adicione conforme quiser)
  const users = {
    "usuario1": "senha1",
    "usuario2": "senha2"
  };

  // Validação simples
  if (users[username] && users[username] === password) {
    // Marca sessão temporária
    sessionStorage.setItem("auth", "true");
    // Redireciona para o Tetris
    window.location.href = "a7tn2eh5k9.html";
  } else {
    error.textContent = "Usuário ou senha inválidos";
  }
});
