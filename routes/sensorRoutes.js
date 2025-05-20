const express = require('express');
const router = express.Router();
const controller = require('../controllers/sensorController');

router.post('/', controller.postSensorValue);


module.exports = router;