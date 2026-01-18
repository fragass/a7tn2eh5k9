export default async function handler(req, res) {
  try {
    const response = await fetch(
      process.env.SUPABASE_URL +
        "/rest/v1/scores?select=username,score&order=score.desc",
      {
        headers: {
          "apikey": process.env.SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`
        }
      }
    );

    let data = await response.json();

    // Criar mapa do usuário -> maior score
    const topScores = {};
    data.forEach(entry => {
      const { username, score } = entry;
      if (!topScores[username] || score > topScores[username]) {
        topScores[username] = score;
      }
    });

    // Transformar em array e ordenar do maior para o menor
    const finalRanking = Object.entries(topScores)
      .map(([username, score]) => ({ username, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // pega apenas top 5

    return res.status(200).json(finalRanking);
  } catch (e) {
    return res.status(500).json({ error: "Erro ao buscar ranking" });
  }
}
