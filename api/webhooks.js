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

  if (req.method === "GET") {
    try {
      const result = await pool.query(
        "SELECT id, payload, received_at FROM webhooks ORDER BY received_at DESC"
      );
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error("Erro ao buscar webhooks:", err);
      return res.status(500).json({ error: "Erro interno" });
    }
  } else if (req.method === "DELETE") {
    try {
      await pool.query("DELETE FROM webhooks");
      return res.status(200).json({ success: true, message: "Todos os webhooks foram apagados" });
    } catch (err) {
      console.error("Erro ao deletar webhooks:", err);
      return res.status(500).json({ error: "Erro interno" });
    }
  } else {
    res.setHeader("Allow", ["GET", "DELETE", "OPTIONS"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
