export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
  }

  // LOGIN_USERS vem das variáveis de ambiente, no formato JSON
  // Ex: [{"username":"admin","password":"1234"},{"username":"user","password":"senha"}]
  let users;
  try {
    users = JSON.parse(process.env.LOGIN_USERS || "[]");
  } catch (e) {
    return res.status(500).json({ error: "Erro na configuração dos usuários" });
  }

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Usuário ou senha inválidos" });
  }

  // Login válido
  return res.status(200).json({ success: true });
}
