const express = require('express');
const router = express.Router();
const controller = require('../controllers/partsController');

router.post('/', controller.createNewPart)
router.get('/', controller.getAllParts)
router.get('/day/:date', controller.getPartByDay)
router.get('/:partNumber', controller.getPartByNumber)

module.exports = router;