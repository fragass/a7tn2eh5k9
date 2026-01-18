import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { data } = await supabase
    .from("ranking")
    .select("username, score")
    .order("score", { ascending: false })
    .limit(5);

  res.status(200).json(data || []);
}
