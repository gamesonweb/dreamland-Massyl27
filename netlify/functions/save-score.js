const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  // Autoriser les requêtes POST uniquement
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  try {
    const { userId, score } = JSON.parse(event.body);

    const { data, error } = await supabase.from("scores").upsert({
      user_id: userId,
      best_score: score,
      updated_at: new Date(),
    });

    return {
      statusCode: error ? 500 : 200,
      body: JSON.stringify(error || data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
