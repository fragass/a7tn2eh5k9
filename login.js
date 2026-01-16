document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const error = document.getElementById("error");

  error.textContent = "";

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("login_ok", "true");
      window.location.href = "a7tn2eh5k9.html";
    } else {
      error.textContent = "Usuário ou senha inválidos";
    }
  } catch {
    error.textContent = "Erro ao conectar com o servidor";
  }
});
