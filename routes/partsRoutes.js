const express = require('express');
const router = express.Router();
const controller = require('../controllers/partsController');
const auth = require('../middleware/authMiddleware')

router.post('/', auth, controller.createNewPart)
router.get('/', auth, controller.getAllParts)
router.get('/day/:date', auth, controller.getPartByDay)
router.get('/:partNumber', auth, controller.getPartByNumber)

module.exports = router;