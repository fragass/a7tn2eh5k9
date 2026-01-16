document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const error = document.getElementById("error");

  error.textContent = "";

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      error.textContent = "Usuário ou senha inválidos";
      return;
    }

    // sessão válida apenas nesta aba
    sessionStorage.setItem("auth", "true");

    // entra no jogo
    window.location.replace("a7tn2eh5k9.html");

  } catch {
    error.textContent = "Erro ao conectar com o servidor";
  }
});
