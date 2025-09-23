const express = require('express');
const router = express.Router();
const mqttClient = require('../services/mqttClient');

// Route to send SET_PLAN command to a purifier
router.post('/send-command/:deviceId', (req, res) => {
  const { deviceId } = req.params;

  const topic = `waterpurifier/${deviceId}/command`;

  const payload = {
    command: "SET_PLAN",
    planType: "FAMILY",
    subscriptionDuration: 30,
    totalWaterLimit: 1000,
    startDate: "2025-07-09",
    endDate: "2025-08-09"
  };

  mqttClient.publish(topic, JSON.stringify(payload), (err) => {
    if (err) return res.status(500).json({ error: 'MQTT publish failed' });
    res.json({ message: 'Command sent successfully' });
  });
});

module.exports = router;
