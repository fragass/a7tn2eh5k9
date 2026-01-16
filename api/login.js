import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Dados incompletos" });
  }

  let users;
  try {
    users = JSON.parse(process.env.LOGIN_USERS || "{}");
  } catch {
    return res.status(500).json({ error: "Erro na configuração" });
  }

  const hash = users[username];

  if (!hash) {
    return res.status(401).json({ error: "Usuário ou senha inválidos" });
  }

  const ok = await bcrypt.compare(password, hash);

  if (!ok) {
    return res.status(401).json({ error: "Usuário ou senha inválidos" });
  }

  return res.status(200).json({ success: true });
}
