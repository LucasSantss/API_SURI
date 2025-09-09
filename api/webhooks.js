import pool from "./db.js";

export default async function handler(req, res) {
    if (req.method === "GET") {
        try {
            const result = await pool.query(
                "SELECT id, payload, received_at FROM webhooks ORDER BY received_at DESC"
            );
            res.status(200).json(result.rows);
        } catch (err) {
            console.error("Erro ao buscar webhooks:", err);
            res.status(500).json({ error: "Erro interno" });
        }
    }

    else if (req.method === "DELETE") {
        try {
            await pool.query("DELETE FROM webhooks");
            res.status(200).json({ success: true, message: "Todos os webhooks foram apagados" });
        } catch (err) {
            console.error("Erro ao deletar webhooks:", err);
            res.status(500).json({ error: "Erro interno" });
        }
    }

    else {
        res.setHeader("Allow", ["GET", "DELETE"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
