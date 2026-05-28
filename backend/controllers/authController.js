const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const [rows] = await db.query(
      'SELECT * FROM Employee WHERE email = ? AND is_active = 1',
      [email]
    );
    if (!rows.length)
      return res.status(401).json({ error: 'Invalid credentials.' });

    const emp = rows[0];
    const valid = await bcrypt.compare(password, emp.password);
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign(
      { emp_id: emp.emp_id, email: emp.email, role: emp.role, name: emp.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const { password: _, ...empData } = emp;
    res.json({ token, user: empData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, hire_date } = req.body;
    if (!name || !email || !password || !hire_date)
      return res.status(400).json({ error: 'Name, email, password and hire_date are required.' });

    const VALID_ROLES = ['admin','manager','cashier','loader','pump_operator','inventory_clerk','carwash_attendant','field_engineer'];
    const assignedRole = VALID_ROLES.includes(role) ? role : 'cashier';

    const [exists] = await db.query('SELECT emp_id FROM Employee WHERE email = ?', [email]);
    if (exists.length)
      return res.status(409).json({ error: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO Employee (name, email, password, role, phone, hire_date) VALUES (?,?,?,?,?,?)',
      [name, email, hashed, assignedRole, phone || null, hire_date]
    );
    res.status(201).json({ message: 'Employee registered successfully.', emp_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT emp_id,name,email,role,phone,hire_date,is_active,created_at FROM Employee WHERE emp_id = ?',
      [req.user.emp_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
