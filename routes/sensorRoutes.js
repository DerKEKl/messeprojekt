const express = require('express');
const router = express.Router();
const controller = require('../controllers/sensorController');

router.post('/', controller.getSensorValue);

module.exports = router;