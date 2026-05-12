import pool from "./db.js";

export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            const payload = req.body;

            await pool.query(
                "INSERT INTO webhooks (payload, received_at) VALUES ($1, NOW())",
                [payload]
            );

            // 1. Tentar encontrar um CPF ou CNPJ no payload
            let foundDoc = null;
            const searchKeys = ['cpf', 'cnpj', 'documento', 'doc', 'tax_id'];
            
            // Busca recursiva simples no payload por chaves de documento
            function findDoc(obj) {
                if (!obj || typeof obj !== 'object') return;
                for (let key in obj) {
                    if (searchKeys.includes(key.toLowerCase())) {
                        foundDoc = String(obj[key]).replace(/[^\d]+/g, '');
                        if (foundDoc) return;
                    }
                    if (typeof obj[key] === 'object') findDoc(obj[key]);
                    if (foundDoc) return;
                }
            }
            findDoc(payload);

            // 2. Se encontrou um documento, buscar no banco de autorizados
            if (foundDoc) {
                try {
                    const docResult = await pool.query(
                        "SELECT custom_response FROM authorized_documents WHERE doc_value = $1",
                        [foundDoc]
                    );
                    if (docResult.rows.length > 0) {
                        return res.status(200).json(docResult.rows[0].custom_response);
                    } else {
                        // Se não encontrou no banco, retornar erro personalizado ou padrão
                        return res.status(404).json({ 
                            success: false, 
                            message: "Documento não encontrado na base de dados autorizada",
                            documento: foundDoc 
                        });
                    }
                } catch (docErr) {
                    console.error("Erro ao buscar documento autorizado:", docErr);
                }
            }

            // 3. Se não houver documento ou não encontrar, usar configuração global
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
