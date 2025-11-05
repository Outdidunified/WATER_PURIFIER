require('dotenv').config();
const mqtt = require('mqtt');
const { logToFile } = require('./utils/fileLogger');
const { connectToDatabase } = require('../config/db');

const clientId = `receiver_${Math.random().toString(16).substr(2, 8)}`;
const client = mqtt.connect(process.env.MQTT_BROKER, {
    port: parseInt(process.env.MQTT_PORT),
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId,
    clean: true,
});

let db;

//  Connect to MongoDB
connectToDatabase()
    .then(database => (db = database))
    .catch(err => console.error(" DB connect error:", err));

client.on('connect', () => {
    console.log(` MQTT Connected as ${clientId}`);

    const topics = [
        'waterpurifier/telemetry',
        'waterpurifier/alert',
        'waterpurifier/status',
        'waterpurifier/command',
        'waterpurifier/boot',
        'waterpurifier/+/telemetry',
        'waterpurifier/+/alert',
        'waterpurifier/+/status',
        'waterpurifier/+/command',
        'waterpurifier/+/boot',
    ];

    client.subscribe(topics, err => {
        if (err) console.error(' Subscription failed:', err.message);
        else console.log('📡 Subscribed to:', topics.join(', '));
    });
});

client.on('message', async (topic, message) => {
    const timestamp = new Date().toISOString();

    let type = topic.split('/').pop().toUpperCase();
    if (!['TELEMETRY', 'ALERT', 'STATUS', 'COMMAND', 'BOOT'].includes(type)) type = 'UNKNOWN';

    try {
        let data = JSON.parse(message.toString());
        if (!Array.isArray(data)) data = [data];

        //  Show exactly like you want in console
        console.log('\n-----------------------------');
        console.log(` Topic: ${topic}`);
        console.log(` Received at: ${timestamp}`);
        console.log(` Type: ${type}`);
        console.log(` data:`);
        console.log(JSON.stringify(data, null, 2)); // <-- pretty array format exactly as you showed
        console.log('-----------------------------\n');

        //  Save full object to log file exactly like console
        logToFile({
            timestamp,
            topic,
            type,
            data: data
        });

        //  Save to MongoDB
        for (const item of data) {
            const entry = { ...item, receivedAt: timestamp, topic, type };
            if (!db) continue;

            await db.collection('water_purifier_liveData').insertOne(entry);

            const collectionMap = {
                TELEMETRY: 'device_telemetry',
                ALERT: 'device_alerts',
                STATUS: 'device_status',
                COMMAND: 'device_command',
                BOOT: 'device_boot',
            };
            const collectionName = collectionMap[type] || 'unknown_messages';
            await db.collection(collectionName).insertOne(entry);

            //  Daily usage (Telemetry only)
            if (type === 'TELEMETRY' && item.wp_device_id && item.totalWaterUsed != null) {
                const usageDate = new Date().toISOString().split('T')[0];
                await db.collection('dailyBasedWaterUsage').updateOne(
                    { wp_device_id: item.wp_device_id, date: usageDate },
                    {
                        $set: {
                            modelName: item.modelName || 'Unknown',
                            updatedAt: new Date(),
                        },
                        $min: {
                            minPressure: item.pressure,
                            minTDSOut: item.tdsOut,
                        },
                        $max: {
                            maxPressure: item.pressure,
                            maxTDSOut: item.tdsOut,
                        },
                        $inc: {
                            totalWaterUsed: item.totalWaterUsed,
                        }
                    },
                    { upsert: true }
                );
            }
        }

    } catch (err) {
        console.error(` Error parsing message on topic: ${topic}`);
        console.error('Raw message:', message.toString());
        console.error('Error:', err.message);

        // Save failed messages too
        logToFile({ timestamp, type, topic, error: err.message, raw: message.toString() });

        if (db) {
            await db.collection('invalid_messages').insertOne({
                receivedAt: timestamp,
                topic,
                rawMessage: message.toString(),
                error: err.message
            });
        }
    }
});

client.on('error', err => console.error(' MQTT Client Error:', err.message));

module.exports = client;
