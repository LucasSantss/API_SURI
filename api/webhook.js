import pool from "./db.js";

export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            const payload = req.body;

            await pool.query(
                "INSERT INTO webhooks (payload, received_at) VALUES ($1, NOW())",
                [payload]
            );

            // Buscar configuração de retorno customizada
            let responseStatus = 200;
            let responseBody = { success: true, message: "Dados salvo", type: payload.type };

            try {
                const configResult = await pool.query("SELECT status, body FROM api_config ORDER BY id DESC LIMIT 1");
                if (configResult.rows.length > 0) {
                    responseStatus = configResult.rows[0].status;
                    responseBody = configResult.rows[0].body;
                }
            } catch (configErr) {
                console.warn("Usando retorno padrão devido a erro na config:", configErr.message);
            }

            res.status(responseStatus).json(responseBody);
        } catch (err) {
            console.error("Erro ao salvar Dados:", err);
            res.status(500).json({ success: false, message: "Erro interno" });
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
