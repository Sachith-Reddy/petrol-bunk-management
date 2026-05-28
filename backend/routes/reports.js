const router = require('express').Router();
const { reportController: c } = require('../controllers/controllers');
const { verifyToken } = require('../middleware/auth');
router.get('/daily-revenue',    verifyToken, c.dailyRevenue);
router.get('/fuel-consumption', verifyToken, c.fuelConsumption);
router.get('/shift-performance',verifyToken, c.shiftPerformance);
router.get('/vehicle-activity', verifyToken, c.vehicleActivity);
router.get('/low-stock',        verifyToken, c.lowStockAlerts);
module.exports = router;
