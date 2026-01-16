export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const rawUsers = process.env.LOGIN_USERS;

  if (!rawUsers) {
    return res.status(500).json({ error: "LOGIN_USERS não existe" });
  }

  let users;
  try {
    users = JSON.parse(rawUsers);
  } catch {
    return res.status(500).json({ error: "LOGIN_USERS inválido" });
  }

  if (!users[username] || users[username] !== password) {
    return res.status(401).json({ success: false });
  }

  return res.status(200).json({ success: true });
}
