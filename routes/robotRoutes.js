const express = require('express');
const router = express.Router();
const controller = require('../controllers/robotController')

router.post('/start', controller.startRoutine)

module.exports = router;