const express = require('express');
const cors = require('cors');
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json());


const requestsRouter = require('./routes/requests');
app.use('/api/requests', requestsRouter);


const db = require('./db');
app.get('/api/users', async (req, res) => {
const r = await db.query('SELECT username, display_name FROM users');
res.json(r.rows);
});
app.get('/api/types', async (req, res) => {
const r = await db.query('SELECT id, name FROM request_types');
res.json(r.rows);
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));