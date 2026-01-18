// pages/api/login.js
export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método não permitido" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Usuário ou senha não informados" });
  }

  // Recupera variável de ambiente
  const usersEnv = process.env.LOGIN_USERS || "";
  const usersArray = usersEnv.split(",");

  // Cria um mapa de {usuario:senha}
  const usersMap = {};
  usersArray.forEach(pair => {
    const [user, pass] = pair.split(":");
    usersMap[user] = pass;
  });

  // Valida login
  if (usersMap[username] && usersMap[username] === password) {
    return res.status(200).json({ success: true, username });
  } else {
    return res.status(401).json({ success: false, message: "Usuário ou senha incorretos" });
  }
}
