// pages/api/score.js
export default async function handler(req, res) { 
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { username, score, lines, level } = req.body;

  if (!username || score == null) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  try {
    // Upsert: cria se não existir, atualiza se já existir
    const response = await fetch(
      process.env.SUPABASE_URL + "/rest/v1/scores",
      {
        method: "POST", // POST + "Prefer: merge-duplicates" faz upsert
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          "Prefer": "resolution=merge-duplicates" // ESSENCIAL
        },
        body: JSON.stringify([{
          username,
          score,
          lines,
          level,
          updated_at: new Date().toISOString()
        }])
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: JSON.stringify(data) });
    }

    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}
