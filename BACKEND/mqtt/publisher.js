require('dotenv').config();
const mqtt = require('mqtt');

const clientId = `publisher_${Math.random().toString(16).substr(2, 8)}`;
const client = mqtt.connect(process.env.MQTT_BROKER, {
    port: parseInt(process.env.MQTT_PORT),
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId,
    clean: true,
});

const devices = [
    { id: 'WPSAJJ', model: 'HIVE DRINK' },
    // { id: 'KK8756', model: 'HIVE  RO PLUS' },
];

client.on('connect', () => {
    console.log(` Publisher connected as ${clientId}`);

    sendBoot();
    setInterval(sendTelemetry, 10_000);
    setInterval(sendAlerts, 30_000);
    setInterval(sendStatus, 20_000);
});

function publish(topic, data) {
    client.publish(topic, JSON.stringify(data), { qos: 0 }, err => {
        if (err) console.error(` Publish failed on ${topic}:`, err.message);
        else console.log(` Published → ${topic}`);
    });
}

// 🛰 Boot (each device separately)
function sendBoot() {
    devices.forEach(d => {
        const data = {
            wp_device_id: d.id,
            modelName: d.model,
            status: 'BOOT_COMPLETED',
            timestamp: new Date().toISOString()
        };

        // Example topic: waterpurifier/WP0224455/boot
        const macId = d.id.replace(/\W/g, '').toUpperCase();
        const topic = `waterpurifier/${macId}/boot`;
        publish(topic, data);
    });
}

//  Telemetry (each device individually)
function sendTelemetry() {
    devices.forEach(d => {
        const data = {
            wp_device_id: d.id,
            modelName: d.model,
            timestamp: new Date().toISOString(),
            totalWaterUsed: Number((Math.random() * 0.1).toFixed(4)), // L
            tdsIn: 400 + Math.floor(Math.random() * 50),
            tdsOut: 60 + Math.floor(Math.random() * 10),
            pressure: Number((1.2 + Math.random() * 0.5).toFixed(2)),
            temperature: Number((25 + Math.random() * 5).toFixed(2)),
            tankLevel: ['EMPTY', 'HALF', 'FULL'][Math.floor(Math.random() * 3)],
            status: 'NORMAL',
            errorCode: 'NoError',
            valveStatus: ['OPEN', 'CLOSED'][Math.floor(Math.random() * 2)],
            powerStatus: ['ON', 'OFF'][Math.floor(Math.random() * 2)],
            planType: ['BASIC', 'PREMIUM'][Math.floor(Math.random() * 2)],
            totalWaterLimit: 500,
            leakDetected: Math.random() > 0.9,
            filterLifeUsed: Number((Math.random() * 0.3).toFixed(2)),
            uptimeHours: Number((Math.random() * 5).toFixed(2))
        };

        const macId = d.id.replace(/\W/g, '').toUpperCase();
        const topic = `waterpurifier/${macId}/telemetry`;
        publish(topic, data);
    });
}

//  Alerts (each device individually)
function sendAlerts() {
    devices.forEach(d => {
        const data = {
            wp_device_id: d.id,
            modelName: d.model,
            alertType: ['PRESSURE_LOW', 'FILTER_CHANGE_REQUIRED', 'LEAK_DETECTED'][Math.floor(Math.random() * 3)],
            message: 'Simulated alert event',
            timestamp: new Date().toISOString()
        };

        const macId = d.id.replace(/\W/g, '').toUpperCase();
        const topic = `waterpurifier/${macId}/alert`;
        publish(topic, data);
    });
}

//  Status (each device individually)
function sendStatus() {
    devices.forEach(d => {
        const data = {
            wp_device_id: d.id,
            modelName: d.model,
            acknowledgedCommand: ['START_MOTOR', 'STOP_MOTOR', 'RESET_FILTER'][Math.floor(Math.random() * 3)],
            status: 'RECEIVED',
            motorRunning: Math.random() > 0.5,
            filterLifeUsed: Number((Math.random() * 10).toFixed(2)),
            timestamp: new Date().toISOString()
        };

        const macId = d.id.replace(/\W/g, '').toUpperCase();
        const topic = `waterpurifier/${macId}/status`;
        publish(topic, data);
    });
}
