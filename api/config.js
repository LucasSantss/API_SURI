import pool from "./db.js";

export default async function handler(req, res) {
    // CORS headers
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // Tentar criar a tabela se não existir (inicialização simplificada)
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS api_config (
                id SERIAL PRIMARY KEY,
                status INTEGER DEFAULT 200,
                body JSONB DEFAULT '{"success": true}'::jsonb,
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
    } catch (e) {
        console.error("Erro ao garantir tabela api_config:", e);
    }

    if (req.method === "GET") {
        try {
            const result = await pool.query("SELECT status, body FROM api_config ORDER BY id DESC LIMIT 1");
            if (result.rows.length > 0) {
                return res.status(200).json(result.rows[0]);
            } else {
                return res.status(200).json({ status: 200, body: { success: true, message: "Padrão" } });
            }
        } catch (err) {
            console.error("Erro ao buscar config:", err);
            return res.status(500).json({ error: "Erro interno" });
        }
    } else if (req.method === "POST") {
        const { status, body } = req.body;
        try {
            // Upsert simplificado: deleta anterior e insere novo ou apenas insere e pegamos o último
            await pool.query("DELETE FROM api_config");
            await pool.query(
                "INSERT INTO api_config (status, body, updated_at) VALUES ($1, $2, NOW())",
                [status, body]
            );
            return res.status(200).json({ success: true });
        } catch (err) {
            console.error("Erro ao salvar config:", err);
            return res.status(500).json({ success: false, message: "Erro interno" });
        }
    } else {
        res.setHeader("Allow", ["GET", "POST", "OPTIONS"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
