const db = require('../config/db');

exports.getAll = async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Fuel ORDER BY fuel_id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Fuel WHERE fuel_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Fuel not found.' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { fuel_type, price_per_liter, description } = req.body;
    if (!fuel_type || !price_per_liter)
      return res.status(400).json({ error: 'fuel_type and price_per_liter required.' });
    const [r] = await db.query(
      'INSERT INTO Fuel (fuel_type, price_per_liter, description) VALUES (?,?,?)',
      [fuel_type, price_per_liter, description || null]
    );
    res.status(201).json({ message: 'Fuel added.', fuel_id: r.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { fuel_type, price_per_liter, description } = req.body;
    const [r] = await db.query(
      'UPDATE Fuel SET fuel_type=?, price_per_liter=?, description=? WHERE fuel_id=?',
      [fuel_type, price_per_liter, description || null, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Fuel not found.' });
    res.json({ message: 'Fuel updated.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const [r] = await db.query('DELETE FROM Fuel WHERE fuel_id = ?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ error: 'Fuel not found.' });
    res.json({ message: 'Fuel deleted.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
