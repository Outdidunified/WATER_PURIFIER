require('dotenv').config();
const client = require('./modules/app/services/mqttClient');

const wp_device_id = process.env.WP_DEVICE_ID || 'wp02423';
const modelName = process.env.WP_MODEL_NAME || 'Aqua Purifier';

// Topics
const telemetryTopic = `waterpurifier/${wp_device_id}/telemetry`;
const alertTopic = `waterpurifier/${wp_device_id}/alert`;
const statusTopic = `waterpurifier/${wp_device_id}/status`;
const commandTopic = `waterpurifier/${wp_device_id}/command`;

let hasSubscribedToCommand = false;
client.on('connect', () => {
    if (hasSubscribedToCommand) {
        return;
    }
    client.subscribe(commandTopic, (err) => {
        if (err) {
            console.error('❌ Failed to subscribe to command topic:', err.message || err);
        } else {
            hasSubscribedToCommand = true;
            console.log(`📡 Subscribed to command topic ${commandTopic}`);
        }
    });
});

// === Global Variables ===
let cumulativeWaterUsed = 0;
const waterIncrementPerMessage = 0.0167;
const activeWaterLimit = 500;

let filterLifeUsed = 0; // percentage (0 - 100)
let motorRunning = false;

// === Handle incoming commands ===
client.on('message', (topic, message) => {
    if (topic === commandTopic) {
        try {
            const command = JSON.parse(message.toString());
            console.log(`[DEVICE] Command Received:`, command);

            if (command.command === "START_MOTOR") motorRunning = true;
            if (command.command === "STOP_MOTOR") motorRunning = false;
            if (command.command === "RESET_FILTER") filterLifeUsed = 0;

            const statusPayload = {
                wp_device_id,
                modelName,
                acknowledgedCommand: command.command,
                status: "RECEIVED",
                motorRunning,
                filterLifeUsed,
                timestamp: new Date().toISOString(),
            };

            client.publish(statusTopic, JSON.stringify(statusPayload));
        } catch (err) {
            console.error('Failed to parse command message', err.message);
        }
    }
});

// === Water usage counter ===
let telemetryCounter = 0;
function generateTelemetry(overrides = {}) {
    telemetryCounter++;

    if (motorRunning) {
        cumulativeWaterUsed += waterIncrementPerMessage;
        filterLifeUsed = Math.min(100, filterLifeUsed + 0.02); // slowly increases filter usage
    }

    const pressure = +(1 + Math.random()).toFixed(2);
    const tdsOut = 20 + Math.floor(Math.random() * 120);
    const tankLevel = ['EMPTY', 'HALF', 'FULL'][Math.floor(Math.random() * 3)];
    const pumpStatus = motorRunning ? "ON" : "OFF";
    const leakDetected = Math.random() < 0.01; // 1% chance of leak

    const telemetry = {
        wp_device_id,
        modelName,
        timestamp: new Date().toISOString(),
        totalWaterUsed: +cumulativeWaterUsed.toFixed(4),
        tdsIn: 430,
        tdsOut,
        pressure,
        temperature: +(26 + Math.random()).toFixed(2),
        tankLevel,
        status: "ACTIVE",
        errorCode: leakDetected ? "LEAK_DETECTED" : "NoError",
        valveStatus: "OPEN",
        powerStatus: "ON",
        motorStatus: pumpStatus,
        planType: "BASIC",
        totalWaterLimit: activeWaterLimit,
        filterLifeUsed: +filterLifeUsed.toFixed(2), // new data
        leakDetected,
        uptimeHours: +(telemetryCounter / 6).toFixed(1), // simulate uptime
        voltage: +(220 + Math.random() * 10).toFixed(1),
        current: +(0.8 + Math.random() * 0.4).toFixed(2),
        ...overrides
    };

    return telemetry;
}

// === Alert publisher ===
function sendAlert(alertType, message) {
    const alertPayload = {
        wp_device_id,
        modelName,
        alertType,
        message,
        timestamp: new Date().toISOString(),
    };

    client.publish(alertTopic, JSON.stringify(alertPayload));
    console.log(`[ALERT] ${alertType} - ${message}`);
}

// === Alert checker ===
function checkAndSendAlerts(telemetry) {
    if (telemetry.totalWaterUsed >= telemetry.totalWaterLimit) {
        sendAlert("LIMIT_EXCEEDED", "Water limit exceeded");
    }
    if (telemetry.pressure < 1.5) {
        sendAlert("PRESSURE_LOW", `Low pressure: ${telemetry.pressure} bar`);
    }
    if (telemetry.tdsOut > 100) {
        sendAlert("TDS_OUT_HIGH", `TDS too high: ${telemetry.tdsOut} ppm`);
    }
    if (telemetry.tdsOut < 30) {
        sendAlert("TDS_OUT_LOW", `TDS too low: ${telemetry.tdsOut} ppm`);
    }
    if (telemetry.filterLifeUsed >= 95) {
        sendAlert("FILTER_CHANGE_REQUIRED", "Filter life almost over");
    }
    if (telemetry.leakDetected) {
        sendAlert("LEAK_DETECTED", "Water leakage detected!");
    }
}

// === Send telemetry once ===
function sendTelemetryOnce(overrides = {}) {
    const telemetry = generateTelemetry(overrides);
    client.publish(telemetryTopic, JSON.stringify(telemetry));
    console.log(`[TELEMETRY] Sent: ${telemetry.totalWaterUsed} liters | Motor: ${telemetry.motorStatus}`);
    checkAndSendAlerts(telemetry);
}

// === Initial 5 demo telemetry messages ===
function sendInitialDemoData(count = 5, intervalMs = 1000) {
    let sent = 0;
    const interval = setInterval(() => {
        if (sent >= count) {
            clearInterval(interval);
            console.log(`[DEVICE] Finished sending initial ${count} demo telemetry data.`);
            // Start regular telemetry every 10 seconds
            setInterval(sendTelemetryOnce, 10000);
            return;
        }

        sendTelemetryOnce();
        sent++;
    }, intervalMs);
}

// === START ===
console.log('[DEVICE] Starting Water Purifier Device Simulation...');
motorRunning = true; // device starts ON
sendInitialDemoData();
