const router = require('express').Router();
const { shiftController: c } = require('../controllers/controllers');
const { verifyToken, requireAdmin } = require('../middleware/auth');
router.get('/',      verifyToken, c.getAll);
router.post('/',     verifyToken, requireAdmin, c.create);
router.delete('/:id',verifyToken, requireAdmin, c.remove);
module.exports = router;
