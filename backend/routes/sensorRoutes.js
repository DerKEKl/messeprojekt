const express = require('express');
const router = express.Router();
const controller = require('../controllers/sensorController');
const auth = require('../middleware/authMiddleware')

router.post('/', auth, controller.postSensorValue);


module.exports = router;