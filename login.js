document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;

    // credenciais fixas (exemplo)
    if (usuario === "boni" && senha === "boni") {
      localStorage.setItem("auth", "true");

      // redireciona corretamente
      window.location.replace("a7tn2eh5k9.html");
    } else {
      alert("Usuário ou senha inválidos");
    }
  });
});
