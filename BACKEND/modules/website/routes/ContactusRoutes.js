const express = require('express');
const router = express.Router();
const contactUsController = require('../controllers/ContactusController');

// POST route to handle contact form submission
router.post('/submitcontact', contactUsController.submitContact);

module.exports = router;
