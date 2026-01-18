import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { username, score, lines, level } = req.body;

  const { data: existing } = await supabase
    .from("ranking")
    .select("*")
    .eq("username", username)
    .single();

  if (!existing) {
    await supabase.from("ranking").insert([
      { username, score, lines, level }
    ]);
  } else if (score > existing.score) {
    await supabase
      .from("ranking")
      .update({ score, lines, level })
      .eq("username", username);
  }

  res.status(200).json({ ok: true });
}
