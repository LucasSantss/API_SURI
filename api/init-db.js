import pool from "./db.js";

export const initDatabase = async () => {
    try {
        console.log("Iniciando criação de tabelas no Neon PostgreSQL...");

        // 1. Tabela de Webhooks (Log de recebimento)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS webhooks (
                id SERIAL PRIMARY KEY,
                payload JSONB,
                received_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log("Tabela 'webhooks' verificada/criada.");

        // 2. Tabela de Configuração Global da API
        await pool.query(`
            CREATE TABLE IF NOT EXISTS api_config (
                id SERIAL PRIMARY KEY,
                status INTEGER DEFAULT 200,
                body JSONB DEFAULT '{"success": true}'::jsonb,
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log("Tabela 'api_config' verificada/criada.");

        // 3. Tabela de Documentos Autorizados (CPF/CNPJ)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS authorized_documents (
                id SERIAL PRIMARY KEY,
                doc_type VARCHAR(10),
                doc_value VARCHAR(20) UNIQUE,
                custom_response JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log("Tabela 'authorized_documents' verificada/criada.");

        console.log("Banco de dados inicializado com sucesso!");
        return true;
    } catch (err) {
        console.error("Erro ao inicializar banco de dados:", err);
        throw err;
    }
};
