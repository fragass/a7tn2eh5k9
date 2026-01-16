export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
  }

  // LOGIN_USERS vem das variáveis de ambiente do Vercel
  // Exemplo de LOGIN_USERS: 
  // {"91643205":"t2026","96247967":"t2026", ...}
  let users;
  try {
    users = JSON.parse(process.env.LOGIN_USERS || "{}");
  } catch (e) {
    return res.status(500).json({ error: "Erro na configuração dos usuários" });
  }

  // Verifica se o usuário existe e se a senha confere
  if (users[username] && users[username] === password) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ error: "Usuário ou senha inválidos" });
  }
}
