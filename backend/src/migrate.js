// script simples para criar a tabela usando pool
import fs from 'fs';
import path from 'path';
import pool from './db.js';


const sql = fs.readFileSync(path.join(process.cwd(), 'sql', 'create_table.sql'), 'utf8');


(async () => {
    try {
        await pool.query(sql);
        console.log('Migration executada com sucesso.');
        process.exit(0);
    } catch (err) {
        console.error('Erro na migration:', err);
        process.exit(1);
    }
})();