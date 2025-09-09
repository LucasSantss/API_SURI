import pool from "./db.js";

export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            const payload = req.body;

            await pool.query(
                "INSERT INTO webhooks (payload, received_at) VALUES ($1, NOW())",
                [payload]
            );

            res.status(200).json({ success: true, message: "Webhook salvo" });
        } catch (err) {
            console.error("Erro ao salvar webhook:", err);
            res.status(500).json({ error: "Erro interno" });
        }
    } else {
        res.setHeader("Allow", ["POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
