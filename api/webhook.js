import pool from "./db.js";

export default async function handler(req, res) {
  // CORS headers
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === "POST") {
    try {
      const payload = req.body;
      await pool.query(
        "INSERT INTO webhooks (payload, received_at) VALUES ($1, NOW())",
        [payload]
      );
      return res.status(200).json({ success: true, message: "Webhook salvo" });
    } catch (err) {
      console.error("Erro ao salvar webhook:", err);
      return res.status(500).json({ error: "Erro interno" });
    }
  } else {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
