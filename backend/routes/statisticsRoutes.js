const express = require('express');
const router = express.Router();
const controller = require('../controllers/statisticsController')
const auth = require('../middleware/authMiddleware')

router.get('/report/:date', auth, controller.createReport);
router.get('/colors', auth, controller.countColors);

module.exports = router;