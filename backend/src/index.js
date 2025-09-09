import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import pool from './db.js';
import dotenv from 'dotenv';


dotenv.config();


const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';


app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: FRONTEND_ORIGIN }));


// Health
app.get('/', (req, res) => res.json({ ok: true }));


// Recebe webhook
app.post('/webhook', async (req, res) => {
    try {
        const payload = req.body;
        await pool.query('INSERT INTO webhooks (payload) VALUES ($1)', [payload]);
        res.status(200).json({ message: 'Webhook recebido e salvo.' });
    } catch (err) {
        console.error('POST /webhook error', err);
        res.status(500).json({ error: err.message });
    }
});


// Lista
app.get('/webhooks', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, received_at, payload FROM webhooks ORDER BY received_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('GET /webhooks error', err);
        res.status(500).json({ error: err.message });
    }
});


// Deleta todos
app.delete('/webhooks', async (req, res) => {
    try {
        await pool.query('DELETE FROM webhooks');
        res.json({ message: 'Todos os webhooks foram apagados.' });
    } catch (err) {
        console.error('DELETE /webhooks error', err);
        res.status(500).json({ error: err.message });
    }
});


app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));