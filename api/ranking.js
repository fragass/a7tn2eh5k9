export default async function handler(req, res) {
  try {
    const response = await fetch(
      process.env.SUPABASE_URL +
        "/rest/v1/scores?select=username,score&order=score.desc&limit=10",
      {
        headers: {
          "apikey": process.env.SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`
        }
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Erro ao buscar ranking" });
  }
}
