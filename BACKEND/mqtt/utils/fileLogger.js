const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');
const logPath = path.join(logDir, 'mqtt_log.json');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Save MQTT message data to mqtt_log.json
 * @param {Object} entry - { timestamp, type, topic, payload }
 */
function logToFile(entry) {
    const receivedAt = new Date().toISOString();

    // Add receivedAt field
    const logEntry = { receivedAt, ...entry };

    let logs = [];
    if (fs.existsSync(logPath)) {
        try {
            const existing = fs.readFileSync(logPath, 'utf8').trim();
            if (existing) {
                logs = JSON.parse(existing);
            }
        } catch (err) {
            console.error(' Error reading existing log file:', err);
            // If corrupted, start fresh
            logs = [];
        }
    }

    logs.push(logEntry);

    try {
        fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');
    } catch (err) {
        console.error(' Error writing to log file:', err);
    }
}

module.exports = { logToFile };
