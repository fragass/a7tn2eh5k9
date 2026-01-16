const form = document.getElementById("loginForm");
const error = document.getElementById("error");

// Sempre que abrir a página de login, remove qualquer sessão antiga
sessionStorage.removeItem("auth");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  error.textContent = "";

  const username = form.username.value.trim();
  const password = form.password.value;

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      // Marca sessão temporária enquanto a aba estiver aberta
      sessionStorage.setItem("auth", "true");
      // Redireciona para o Tetris
      window.location.href = "a7tn2eh5k9.html";
    } else {
      error.textContent = "Usuário ou senha inválidos";
    }
  } catch {
    error.textContent = "Erro ao conectar com o servidor";
  }
});
