const router = require('express').Router();
const { saleController: c } = require('../controllers/controllers');
const { verifyToken } = require('../middleware/auth');
router.get('/',        verifyToken, c.getAll);
router.get('/today',   verifyToken, c.getTodayStats);
router.post('/',       verifyToken, c.create);
module.exports = router;
