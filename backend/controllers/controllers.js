// ── employeeController.js ──────────────────────────────────────
const db   = require('../config/db');
const bcrypt = require('bcryptjs');

const empController = {
  getAll: async (_req, res) => {
    try {
      const [rows] = await db.query(
        'SELECT emp_id,name,email,role,phone,hire_date,is_active,created_at FROM Employee ORDER BY emp_id'
      );
      res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  getById: async (req, res) => {
    try {
      const [rows] = await db.query(
        'SELECT emp_id,name,email,role,phone,hire_date,is_active FROM Employee WHERE emp_id=?',
        [req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Employee not found.' });
      res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  update: async (req, res) => {
    try {
      const { name, phone, role, is_active } = req.body;
      const VALID_ROLES = ['admin','manager','cashier','loader','pump_operator','inventory_clerk','carwash_attendant','field_engineer'];
      const assignedRole = VALID_ROLES.includes(role) ? role : 'cashier';
      const [r] = await db.query(
        'UPDATE Employee SET name=?,phone=?,role=?,is_active=? WHERE emp_id=?',
        [name, phone, assignedRole, is_active, req.params.id]
      );
      if (!r.affectedRows) return res.status(404).json({ error: 'Employee not found.' });
      res.json({ message: 'Employee updated.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  remove: async (req, res) => {
    try {
      const [r] = await db.query('DELETE FROM Employee WHERE emp_id=?', [req.params.id]);
      if (!r.affectedRows) return res.status(404).json({ error: 'Employee not found.' });
      res.json({ message: 'Employee deleted.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },
};

// ── shiftController.js ─────────────────────────────────────────
const shiftController = {
  getAll: async (req, res) => {
    try {
      const { date } = req.query;
      let query = `SELECT s.*, e.name AS emp_name, e.role
                   FROM Shift s JOIN Employee e ON s.emp_id=e.emp_id`;
      const params = [];
      if (date) { query += ' WHERE s.shift_date = ?'; params.push(date); }
      query += ' ORDER BY s.shift_date DESC, s.start_time';
      const [rows] = await db.query(query, params);
      res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  create: async (req, res) => {
    try {
      const { shift_name, start_time, end_time, emp_id, shift_date } = req.body;
      if (!shift_name || !start_time || !end_time || !emp_id || !shift_date)
        return res.status(400).json({ error: 'All shift fields required.' });
      const [r] = await db.query(
        'INSERT INTO Shift (shift_name,start_time,end_time,emp_id,shift_date) VALUES (?,?,?,?,?)',
        [shift_name, start_time, end_time, emp_id, shift_date]
      );
      res.status(201).json({ message: 'Shift created.', shift_id: r.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  remove: async (req, res) => {
    try {
      const [r] = await db.query('DELETE FROM Shift WHERE shift_id=?', [req.params.id]);
      if (!r.affectedRows) return res.status(404).json({ error: 'Shift not found.' });
      res.json({ message: 'Shift deleted.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },
};

// ── vehicleController.js ───────────────────────────────────────
const vehicleController = {
  getAll: async (_req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT v.*, f.fuel_type AS preferred_fuel
         FROM Vehicle v LEFT JOIN Fuel f ON v.fuel_preference=f.fuel_id ORDER BY v.vehicle_id`
      );
      res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  getById: async (req, res) => {
    try {
      const [rows] = await db.query(
        'SELECT v.*, f.fuel_type FROM Vehicle v LEFT JOIN Fuel f ON v.fuel_preference=f.fuel_id WHERE v.vehicle_id=?',
        [req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Vehicle not found.' });
      res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  create: async (req, res) => {
    try {
      const { reg_number, owner_name, vehicle_type, fuel_preference } = req.body;
      if (!reg_number) return res.status(400).json({ error: 'reg_number required.' });
      const [r] = await db.query(
        'INSERT INTO Vehicle (reg_number,owner_name,vehicle_type,fuel_preference) VALUES (?,?,?,?)',
        [reg_number.toUpperCase(), owner_name || null, vehicle_type || 'Car', fuel_preference || null]
      );
      res.status(201).json({ message: 'Vehicle registered.', vehicle_id: r.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  update: async (req, res) => {
    try {
      const { owner_name, vehicle_type, fuel_preference } = req.body;
      const [r] = await db.query(
        'UPDATE Vehicle SET owner_name=?,vehicle_type=?,fuel_preference=? WHERE vehicle_id=?',
        [owner_name, vehicle_type, fuel_preference || null, req.params.id]
      );
      if (!r.affectedRows) return res.status(404).json({ error: 'Vehicle not found.' });
      res.json({ message: 'Vehicle updated.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  remove: async (req, res) => {
    try {
      const [r] = await db.query('DELETE FROM Vehicle WHERE vehicle_id=?', [req.params.id]);
      if (!r.affectedRows) return res.status(404).json({ error: 'Vehicle not found.' });
      res.json({ message: 'Vehicle deleted.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  getHistory: async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT s.sale_id, f.fuel_type, s.liters_pumped, s.total_amount,
                s.payment_method, e.name AS served_by, sh.shift_name, s.sale_time
         FROM Sale s
         JOIN Fuel f     ON s.fuel_id    = f.fuel_id
         JOIN Employee e ON s.emp_id     = e.emp_id
         JOIN Shift sh   ON s.shift_id   = sh.shift_id
         WHERE s.vehicle_id = ?
         ORDER BY s.sale_time DESC`,
        [req.params.id]
      );
      res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },
};

// ── saleController.js ─────────────────────────────────────────
const saleController = {
  getAll: async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const [rows] = await db.query(
        `SELECT s.sale_id, v.reg_number, v.vehicle_type, f.fuel_type,
                s.liters_pumped, s.price_per_liter, s.total_amount,
                s.payment_method, e.name AS cashier_name, sh.shift_name, s.sale_time
         FROM Sale s
         JOIN Vehicle  v  ON s.vehicle_id = v.vehicle_id
         JOIN Fuel     f  ON s.fuel_id    = f.fuel_id
         JOIN Employee e  ON s.emp_id     = e.emp_id
         JOIN Shift    sh ON s.shift_id   = sh.shift_id
         ORDER BY s.sale_time DESC
         LIMIT ? OFFSET ?`,
        [parseInt(limit), parseInt(offset)]
      );
      res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  create: async (req, res) => {
    try {
      const { vehicle_id, fuel_id, tank_id, emp_id, shift_id, liters_pumped, payment_method } = req.body;
      if (!vehicle_id || !fuel_id || !tank_id || !emp_id || !shift_id || !liters_pumped)
        return res.status(400).json({ error: 'All fields required.' });

      // Check tank has enough stock
      const [tanks] = await db.query('SELECT remaining_stock FROM Tank WHERE tank_id=?', [tank_id]);
      if (!tanks.length) return res.status(404).json({ error: 'Tank not found.' });
      if (parseFloat(tanks[0].remaining_stock) < parseFloat(liters_pumped))
        return res.status(400).json({ error: 'Insufficient tank stock.' });

      const [fuels] = await db.query('SELECT price_per_liter FROM Fuel WHERE fuel_id=?', [fuel_id]);
      if (!fuels.length) return res.status(404).json({ error: 'Fuel not found.' });

      const [r] = await db.query(
        `INSERT INTO Sale (vehicle_id,fuel_id,tank_id,emp_id,shift_id,
          liters_pumped,price_per_liter,payment_method) VALUES (?,?,?,?,?,?,?,?)`,
        [vehicle_id, fuel_id, tank_id, emp_id, shift_id,
         liters_pumped, fuels[0].price_per_liter, payment_method || 'Cash']
      );
      res.status(201).json({
        message: 'Sale recorded.',
        sale_id: r.insertId,
        total_amount: (liters_pumped * fuels[0].price_per_liter).toFixed(2),
      });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  getTodayStats: async (_req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT COUNT(*) AS total_sales,
                COALESCE(SUM(total_amount),0) AS total_revenue,
                COALESCE(SUM(liters_pumped),0) AS total_liters
         FROM Sale WHERE DATE(sale_time) = CURDATE()`
      );
      res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },
};

// ── reportController.js ───────────────────────────────────────
const reportController = {
  dailyRevenue: async (req, res) => {
    try {
      const { start, end } = req.query;
      const s = start || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const e = end   || new Date().toISOString().split('T')[0];
      const [rows] = await db.query('CALL GetDailyRevenue(?,?)', [s, e]);
      res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  fuelConsumption: async (_req, res) => {
    try {
      const [rows] = await db.query('CALL GetFuelConsumption()');
      res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  shiftPerformance: async (req, res) => {
    try {
      const date = req.query.date || new Date().toISOString().split('T')[0];
      const [rows] = await db.query('CALL GetShiftPerformance(?)', [date]);
      res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  vehicleActivity: async (req, res) => {
    try {
      const { reg } = req.query;
      if (!reg) return res.status(400).json({ error: 'reg query param required.' });
      const [rows] = await db.query('CALL GetVehicleActivity(?)', [reg]);
      res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  lowStockAlerts: async (_req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT la.*, t.tank_name, f.fuel_type
         FROM LowStockAlert la
         JOIN Tank t ON la.tank_id = t.tank_id
         JOIN Fuel f ON t.fuel_id  = f.fuel_id
         WHERE la.is_resolved = 0
         ORDER BY la.alert_time DESC`
      );
      res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },
};

module.exports = { empController, shiftController, vehicleController, saleController, reportController };
