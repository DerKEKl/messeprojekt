const express = require('express');
const router = express.Router();
const controller = require('../controllers/robotController')
const auth = require('../middleware/authMiddleware')

router.get('/start', auth, controller.startRoutine)

module.exports = router;