'use strict';

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { computeLineValues } = require('./compute');

dotenv.config();

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// 1) List all orders (headers only)
app.get('/api/orders', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, gtn_no, customer_code, user_id, status, e_date
       FROM sol
       ORDER BY id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
  }
});

// 2) Get single order with lines
app.get('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const headerResult = await pool.query(
      `SELECT id, gtn_no, customer_code, user_id, status, e_date, remarks
       FROM sol WHERE id = $1`,
      [id]
    );
    if (headerResult.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const linesResult = await pool.query(
      `SELECT id, so_id, gtn_no, item_code, item_name, pol_code, policy2,
              so_qty, pol_rate, so_rate, approved_qty, approved_rate, so_val, approved_val
       FROM so2 WHERE so_id = $1 ORDER BY id ASC`,
      [id]
    );
    res.json({ header: headerResult.rows[0], lines: linesResult.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order', details: err.message });
  }
});

// 3) Create new order with lines
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    const { gtn_no, customer_code, user_id, status, remarks, lines } = req.body || {};
    if (!customer_code || !user_id || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'customer_code, user_id and at least one line are required' });
    }

    await client.query('BEGIN');
    const insertHeader = await client.query(
      `INSERT INTO sol (gtn_no, customer_code, user_id, status, remarks)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [gtn_no ?? null, customer_code, user_id, status ?? null, remarks ?? null]
    );
    const newId = insertHeader.rows[0].id;

    for (const line of lines) {
      const { so_val, approved_val } = computeLineValues(line);
      const insertLineParams = [
        newId,
        line.gtn_no ?? null,
        line.item_code,
        line.item_name ?? null,
        line.pol_code ?? null,
        line.policy2 ?? null,
        line.so_qty,
        line.pol_rate ?? null,
        line.so_rate,
        line.approved_qty ?? null,
        line.approved_rate ?? null,
        so_val,
        approved_val
      ];
      if (!line.item_code || line.so_qty == null || line.so_rate == null) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Each line requires item_code, so_qty, so_rate' });
      }
      await client.query(
        `INSERT INTO so2 (
            so_id, gtn_no, item_code, item_name, pol_code, policy2,
            so_qty, pol_rate, so_rate, approved_qty, approved_rate, so_val, approved_val
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        insertLineParams
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ id: newId });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    res.status(500).json({ error: 'Failed to create order', details: err.message });
  } finally {
    client.release();
  }
});

// 4) Update order status or remarks
app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body || {};
  if (status == null && remarks == null) {
    return res.status(400).json({ error: 'Provide status and/or remarks' });
  }
  try {
    const fields = [];
    const values = [];
    let idx = 1;
    if (status != null) { fields.push(`status = $${idx++}`); values.push(status); }
    if (remarks != null) { fields.push(`remarks = $${idx++}`); values.push(remarks); }
    values.push(id);
    const sql = `UPDATE sol SET ${fields.join(', ')} WHERE id = $${idx}`;
    const r = await pool.query(sql, values);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order', details: err.message });
  }
});

// 5) Approve a line (update approved qty/rate and recompute approved_val)
app.put('/api/orders/:id/lines/:lineId/approve', async (req, res) => {
  const { id, lineId } = req.params;
  const { approved_qty, approved_rate } = req.body || {};
  try {
    // Ensure line belongs to order
    const lineCheck = await pool.query('SELECT id, so_id FROM so2 WHERE id = $1 AND so_id = $2', [lineId, id]);
    if (lineCheck.rowCount === 0) return res.status(404).json({ error: 'Line not found for this order' });

    const { approved_val } = computeLineValues({ approved_qty, approved_rate });
    const r = await pool.query(
      `UPDATE so2 SET approved_qty = $1, approved_rate = $2, approved_val = $3 WHERE id = $4`,
      [approved_qty ?? null, approved_rate ?? null, approved_val, lineId]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Line not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve line', details: err.message });
  }
});

// 6) Delete an order (cascade deletes lines)
app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const r = await pool.query('DELETE FROM sol WHERE id = $1', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Order not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete order', details: err.message });
  }
});

// 7) Optional mock endpoint
app.get('/api/mock', (_req, res) => {
  res.json({
    header: {
      id: 1,
      gtn_no: 12345678,
      customer_code: 'CUST001',
      user_id: 45,
      status: 'P',
      e_date: new Date().toISOString(),
      remarks: 'First test order'
    },
    lines: [
      {
        id: 1,
        so_id: 1,
        gtn_no: 12345678,
        item_code: 'ITEM001',
        item_name: 'Blue Shirt',
        pol_code: 'PROMO10',
        policy2: '10% Off',
        so_qty: 10,
        so_rate: 15.5,
        approved_qty: 8,
        approved_rate: 15,
        so_val: 155,
        approved_val: 120
      }
    ]
  });
});

const PORT = Number(process.env.PORT || 5001);
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // eslint-disable-next-line no-console
    console.error(`❌ Port ${PORT} is already in use.`);
    // eslint-disable-next-line no-console
    console.error(`   Kill the process: kill -9 $(lsof -ti:${PORT})`);
    // eslint-disable-next-line no-console
    console.error(`   Or change PORT in .env file`);
  } else {
    // eslint-disable-next-line no-console
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});


