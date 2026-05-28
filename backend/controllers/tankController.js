const db = require('../config/db');

exports.getAll = async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, f.fuel_type, f.price_per_liter,
              ROUND((t.remaining_stock / t.capacity_liters)*100,1) AS stock_pct
       FROM Tank t JOIN Fuel f ON t.fuel_id=f.fuel_id ORDER BY t.tank_id`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT t.*, f.fuel_type FROM Tank t JOIN Fuel f ON t.fuel_id=f.fuel_id WHERE t.tank_id=?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Tank not found.' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { tank_name, fuel_id, capacity_liters, remaining_stock } = req.body;
    if (!tank_name || !fuel_id || !capacity_liters)
      return res.status(400).json({ error: 'tank_name, fuel_id, capacity_liters required.' });
    const stock = remaining_stock ?? 0;
    const [r] = await db.query(
      'INSERT INTO Tank (tank_name, fuel_id, capacity_liters, remaining_stock) VALUES (?,?,?,?)',
      [tank_name, fuel_id, capacity_liters, stock]
    );
    res.status(201).json({ message: 'Tank added.', tank_id: r.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { tank_name, fuel_id, capacity_liters } = req.body;
    const [r] = await db.query(
      'UPDATE Tank SET tank_name=?, fuel_id=?, capacity_liters=? WHERE tank_id=?',
      [tank_name, fuel_id, capacity_liters, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Tank not found.' });
    res.json({ message: 'Tank updated.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.refill = async (req, res) => {
  try {
    const { add_liters } = req.body;
    if (!add_liters || add_liters <= 0)
      return res.status(400).json({ error: 'add_liters must be > 0.' });
    const [rows] = await db.query('SELECT * FROM Tank WHERE tank_id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Tank not found.' });
    const { capacity_liters, remaining_stock } = rows[0];
    const newStock = Math.min(parseFloat(remaining_stock) + parseFloat(add_liters), parseFloat(capacity_liters));
    await db.query(
      'UPDATE Tank SET remaining_stock=?, last_refilled=NOW() WHERE tank_id=?',
      [newStock, req.params.id]
    );
    res.json({ message: 'Tank refilled.', new_stock: newStock });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const [r] = await db.query('DELETE FROM Tank WHERE tank_id=?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ error: 'Tank not found.' });
    res.json({ message: 'Tank deleted.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
