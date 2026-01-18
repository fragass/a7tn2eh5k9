document.getElementById("mini-profile").textContent =
  sessionStorage.getItem("loggedUserPhone");

async function load() {
  const res = await fetch("/api/ranking");
  const data = await res.json();

  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";

  data.forEach((u, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${u.username}</td>
        <td>${u.score}</td>
      </tr>
    `;
  });
}

load();
