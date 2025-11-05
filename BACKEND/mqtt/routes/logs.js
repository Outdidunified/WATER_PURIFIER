const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const logFilePath = path.join(__dirname, '../utils/logs/mqtt_log.json');

router.get('/logs', (req, res) => {
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error reading log file' });

        try {
            let cleanData = data.trim();
            if (cleanData.endsWith(',')) cleanData = cleanData.slice(0, -1);
            if (!cleanData.startsWith('[')) cleanData = `[${cleanData}]`;

            const logs = JSON.parse(cleanData);
            res.json(logs);
        } catch (err) {
            res.status(500).json({ error: 'Invalid log format' });
        }
    });
});

module.exports = router;
