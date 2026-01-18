export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { username, score, lines, level } = req.body;

  if (!username || score == null) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  try {
    const response = await fetch(
      process.env.SUPABASE_URL + "/rest/v1/scores",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          username,
          score,
          lines,
          level
        })
      }
    );

    if (!response.ok) {
      const txt = await response.text();
      return res.status(500).json({ error: txt });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: "Erro interno" });
  }
}
