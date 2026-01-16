document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const error = document.getElementById("error");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    error.textContent = "";

    if (!username || !password) {
      error.textContent = "Preencha usuário e senha";
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        error.textContent = "Usuário ou senha inválidos";
        return;
      }

      const data = await res.json();

      if (data.success === true) {
        // login válido APENAS na sessão atual
        sessionStorage.setItem("login_ok", "true");

        // redireciona
        window.location.replace("a7tn2eh5k9.html");
      } else {
        error.textContent = "Usuário ou senha inválidos";
      }
    } catch (err) {
      error.textContent = "Erro ao conectar com o servidor";
    }
  });
});
