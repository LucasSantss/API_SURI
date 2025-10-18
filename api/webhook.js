import pool from "./db.js";

export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            const payload = req.body;

            await pool.query(
                "INSERT INTO webhooks (payload, received_at) VALUES ($1, NOW())",
                [payload]
            );

            res.status(200).json({ success: true, message: "Dados salvo" });
        } catch (err) {
            console.error("Erro ao salvar Dados:", err);
            res.status(500).json({ error: "Erro interno" });
        }
    }

    else if (req.method === "GET") {
        // Apenas teste / healthcheck
        res.status(200).json({ success: true, message: "API-SURI endpoint ativo" });
    }

    else {
        res.setHeader("Allow", ["POST", "GET"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
