document.getElementById("loginBtn").addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("errorMsg");

  errorMsg.textContent = "";

  if (!username || !password) {
    errorMsg.textContent = "Preencha usuário e senha";
    return;
  }

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      sessionStorage.setItem("auth", "true");
      window.location.href = "home.html"; // Página protegida após login
    } else {
      errorMsg.textContent = data.error || "Erro no login";
    }
  } catch (err) {
    errorMsg.textContent = "Erro na comunicação com o servidor";
    console.error(err);
  }
});
