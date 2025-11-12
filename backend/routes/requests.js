const { sendMail } = require('../mailer');
const express = require('express');
const router = express.Router();
const db = require('../db');

// Crear solicitud
router.post('/', async (req, res) => {
  try {
    const { title, description, requester, approver, type_id } = req.body;

    if (!title || !requester || !approver) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Insertar solicitud
    const result = await db.query(
      `INSERT INTO requests (title, description, requester, approver, type_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, requester, approver, type_id]
    );

    const newReq = result.rows[0];

    // Registrar en historial
    await db.query(
      `INSERT INTO history (request_id, status, changed_by, comment)
       VALUES ($1, $2, $3, $4)`,
      [newReq.id, newReq.status, requester, 'Solicitud creada']
    );

    // 📨 Enviar correo simulado al aprobador
    console.log("➡️ Enviando correo simulado al aprobador...");
    await sendMail({
      to: `${approver}@empresa.com`,
      subject: `Nueva solicitud para aprobar: ${title}`,
      html: `
        <h3>Nueva Solicitud Recibida</h3>
        <p><strong>Título:</strong> ${title}</p>
        <p><strong>Descripción:</strong> ${description}</p>
        <p><strong>Solicitante:</strong> ${requester}</p>
        <p>Por favor revisa la solicitud en el sistema.</p>
      `
    });

    res.status(201).json(newReq);
  } catch (err) {
    console.error('Error en POST /requests:', err);
    res.status(500).json({ error: 'Error creando la solicitud' });
  }
});

// Obtener todas o filtrar por approver/status
router.get('/', async (req, res) => {
  try {
    const { approver, status } = req.query;

    let baseQuery = `
      SELECT r.*, 
             t.name AS type_name,
             u1.display_name AS requester_name,
             u2.display_name AS approver_name
      FROM requests r
      LEFT JOIN request_types t ON r.type_id = t.id
      LEFT JOIN users u1 ON r.requester = u1.username
      LEFT JOIN users u2 ON r.approver = u2.username
    `;

    const filters = [];
    const params = [];

    if (approver) {
      params.push(approver);
      filters.push(`r.approver = $${params.length}`);
    }
    if (status) {
      params.push(status);
      filters.push(`r.status = $${params.length}`);
    }

    if (filters.length > 0) {
      baseQuery += ' WHERE ' + filters.join(' AND ');
    }

    baseQuery += ' ORDER BY r.created_at DESC';

    const result = await db.query(baseQuery, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error en GET /requests:', err);
    res.status(500).json({ error: 'Error obteniendo solicitudes' });
  }
});

// Obtener detalle por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const reqResult = await db.query(
      `SELECT r.*, t.name AS type_name 
       FROM requests r 
       LEFT JOIN request_types t ON r.type_id = t.id 
       WHERE r.id = $1`,
      [id]
    );

    if (reqResult.rowCount === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const histResult = await db.query(
      `SELECT * FROM history 
       WHERE request_id = $1 
       ORDER BY changed_at DESC`,
      [id]
    );

    res.json({
      request: reqResult.rows[0],
      history: histResult.rows
    });
  } catch (err) {
    console.error('Error en GET /requests/:id:', err);
    res.status(500).json({ error: 'Error obteniendo detalle' });
  }
});

// Aprobar o rechazar solicitud
router.post('/:id/decision', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, user, comment } = req.body;

    if (!action || !user) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const newStatus = action === 'approve' ? 'APROBADO' : 'RECHAZADO';

    await db.query(
      `UPDATE requests 
       SET status = $1, updated_at = now() 
       WHERE id = $2`,
      [newStatus, id]
    );

    await db.query(
      `INSERT INTO history (request_id, status, changed_by, comment)
       VALUES ($1, $2, $3, $4)`,
      [id, newStatus, user, comment || '']
    );

    const updatedReq = await db.query(
      `SELECT * FROM requests WHERE id = $1`,
      [id]
    );

    // 📨 Enviar correo simulado al solicitante
    const r = updatedReq.rows[0];
    console.log("➡️ Enviando correo simulado al solicitante...");
    await sendMail({
      to: `${r.requester}@empresa.com`,
      subject: `Tu solicitud fue ${newStatus.toLowerCase()}`,
      html: `
        <h3>Tu solicitud fue ${newStatus}</h3>
        <p><strong>Título:</strong> ${r.title}</p>
        <p><strong>Comentario:</strong> ${comment || 'Sin comentario'}</p>
      `
    });

    res.json({ request: updatedReq.rows[0] });
  } catch (err) {
    console.error('Error en POST /requests/:id/decision:', err);
    res.status(500).json({ error: 'Error procesando decisión' });
  }
});

module.exports = router;
