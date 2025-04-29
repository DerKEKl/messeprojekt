const express = require('express');
const router = express.Router();
const controller = require('../controllers/statisticsController')

router.get('/report/:date', controller.createReport);

router.get('/colors', controller.countColors);

module.exports = router;