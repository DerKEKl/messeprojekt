const express = require('express');
const router = express.Router();
const controller = require('../controllers/costsController')
const auth = require('../middleware/authMiddleware')

router.get('/:date', auth, controller.showCostsByDate)
router.get('/preview/:partsCount', auth, controller.showProfitTime)

module.exports = router;