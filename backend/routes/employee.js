// routes/employee.js
const r1 = require('express').Router();
const { empController: e } = require('../controllers/controllers');
const { verifyToken, requireAdmin } = require('../middleware/auth');
r1.get('/',      verifyToken, e.getAll);
r1.get('/:id',   verifyToken, e.getById);
r1.put('/:id',   verifyToken, requireAdmin, e.update);
r1.delete('/:id',verifyToken, requireAdmin, e.remove);
module.exports = r1;
