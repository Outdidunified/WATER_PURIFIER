const express = require('express');
const router = express.Router();
const {
    getRecentTelemetry,
    getLatestTelemetryPerDevice,
    getTelemetryByTimeRange,
    getTelemetryDashboard,
    getLatestSingleTelemetry
} = require('../controllers/TelemetryController');

// Get recent telemetry data (with optional deviceId filter and limit)
// GET /api/app/telemetry/recent?deviceId=WP049&limit=10
router.get('/recent', getRecentTelemetry);

// Get latest telemetry data for each device (one record per device)
// GET /api/app/telemetry/latest-per-device
router.get('/latest-per-device', getLatestTelemetryPerDevice);

// Get telemetry data for specific device with time range
// GET /api/app/telemetry/device/WP049?startDate=2025-01-20&endDate=2025-01-21&limit=50
router.get('/device/:deviceId', getTelemetryByTimeRange);

// Get dashboard summary with real-time telemetry status
// GET /api/app/telemetry/dashboard
router.get('/dashboard', getTelemetryDashboard);

// Get latest single telemetry record for a specific device (only 1 record)
// GET /api/app/telemetry/latest/WP049
router.get('/latest/:deviceId', getLatestSingleTelemetry);

module.exports = router;