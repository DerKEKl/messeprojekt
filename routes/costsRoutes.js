const express = require('express');
const router = express.Router();
const controller = require('../controllers/costsController')

router.get('/:date', controller.showCostsByDate)
router.get('/preview/:partsCount', controller.showProfitTime)

module.exports = router;