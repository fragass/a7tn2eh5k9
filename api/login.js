export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
  }

  // LOGIN_USERS como objeto JSON
  let users;
  try {
    users = JSON.parse(process.env.LOGIN_USERS || "{}");
  } catch (e) {
    console.error("Erro ao parsear LOGIN_USERS:", e);
    return res.status(500).json({ error: "Erro na configuração dos usuários" });
  }

  console.log("Tentativa de login:", username, password);

  if (users[username] && users[username] === password) {
    console.log("Login válido para:", username);
    return res.status(200).json({ success: true });
  } else {
    console.log("Login inválido para:", username);
    return res.status(401).json({ error: "Usuário ou senha inválidos" });
  }
}
