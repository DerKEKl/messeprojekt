const express = require('express');
const router = express.Router();
const controller = require('../controllers/opcuaController');

// Temperature specific routes
router.get('/temperature', controller.getTemperature);

module.exports = router;