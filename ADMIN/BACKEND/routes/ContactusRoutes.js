const express = require('express');
const router = express.Router();
const contactUsController = require('../controllers/ContactusController');

// POST route to handle contact form submission
router.post('/submitcontact', contactUsController.submitContact);

// GET route to fetch all contact us submissions for admin
router.get('/contactsubmissions', contactUsController.getAllSubmissions);

module.exports = router;
