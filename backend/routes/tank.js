const router = require('express').Router();
const ctrl   = require('../controllers/tankController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/',           verifyToken, ctrl.getAll);
router.get('/:id',        verifyToken, ctrl.getById);
router.post('/',          verifyToken, requireAdmin, ctrl.create);
router.put('/:id',        verifyToken, requireAdmin, ctrl.update);
router.put('/:id/refill', verifyToken, requireAdmin, ctrl.refill);
router.delete('/:id',     verifyToken, requireAdmin, ctrl.remove);

module.exports = router;
