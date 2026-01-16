document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, senha })
    });

    if (res.ok) {
      sessionStorage.setItem("auth", "true");
      window.location.replace("a7tn2eh5k9.html");
    } else {
      alert("Usuário ou senha inválidos");
    }
  });
});
