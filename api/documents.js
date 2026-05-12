import pool from "./db.js";

export default async function handler(req, res) {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(204).end();

    // Inicialização da tabela
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS authorized_documents (
                id SERIAL PRIMARY KEY,
                doc_type VARCHAR(10), -- 'CPF' ou 'CNPJ'
                doc_value VARCHAR(20) UNIQUE,
                custom_response JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
    } catch (e) {
        console.error("Erro ao criar tabela authorized_documents:", e);
    }

    if (req.method === "GET") {
        try {
            const result = await pool.query("SELECT * FROM authorized_documents ORDER BY created_at DESC");
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    } 
    
    else if (req.method === "POST") {
        const { doc_type, doc_value, custom_response } = req.body;
        try {
            const cleanDoc = doc_value.replace(/[^\d]+/g, '');
            await pool.query(
                "INSERT INTO authorized_documents (doc_type, doc_value, custom_response) VALUES ($1, $2, $3) ON CONFLICT (doc_value) DO UPDATE SET custom_response = $3",
                [doc_type, cleanDoc, custom_response]
            );
            return res.status(200).json({ success: true });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    else if (req.method === "DELETE") {
        const { id } = req.query;
        try {
            await pool.query("DELETE FROM authorized_documents WHERE id = $1", [id]);
            return res.status(200).json({ success: true });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(405).end();
}
