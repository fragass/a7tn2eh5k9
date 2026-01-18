// pages/api/score.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { username, score, lines, level } = req.body;
  if (!username || score == null) return res.status(400).json({ error: "Dados inválidos" });

  try {
    // 1️⃣ Tenta atualizar a row existente
    const updateResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/scores?username=eq.${username}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          score,
          lines,
          level,
          updated_at: new Date().toISOString()
        })
      }
    );

    const updatedData = await updateResponse.json();

    // 2️⃣ Se não existia row, cria uma nova
    if (updatedData.length === 0) {
      const insertResponse = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/scores`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": process.env.SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify([{
            username,
            score,
            lines,
            level,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
        }
      );

      if (!insertResponse.ok) {
        const txt = await insertResponse.text();
        return res.status(500).json({ error: txt });
      }
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}
