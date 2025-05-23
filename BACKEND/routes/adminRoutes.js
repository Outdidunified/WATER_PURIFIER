const express = require('express');
const router = express.Router();
const dashboardRoute = require('../modules/admin/routes/dashboardRoute');

router.use('/', dashboardRoute);  // will be mounted at /api/admin

module.exports = router;
