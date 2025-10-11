require('dotenv').config();
const mqtt = require('mqtt');
//const { logToFile } = require('../utils/fileLogger');
const { connectToDatabase } = require('../BACKEND/config/db'); // ✅ MongoDB

const clientId = `receiver_${Math.random().toString(16).substr(2, 8)}`;

const options = {
    port: parseInt(process.env.MQTT_PORT),
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId,
    clean: true,
};

const client = mqtt.connect(process.env.MQTT_BROKER, options);

// Initialize DB connection
let db;
let hasSubscribedToTopics = false;
connectToDatabase().then((database) => {
    db = database;
}).catch(err => {
    console.error("❌ Failed to connect to DB", err);
});

client.on('connect', () => {
    console.log('✅ MQTT Connected as', clientId);

    if (hasSubscribedToTopics) {
        console.log('ℹ️ Topics already subscribed, skipping re-subscribe.');
        return;
    }

    const topics = [
        'waterpurifier/+/telemetry',
        'waterpurifier/+/alert',
        'waterpurifier/+/status',
        'waterpurifier/+/command',
    ];

    client.subscribe(topics, (err) => {
        if (err) {
            console.error('❌ Subscription failed:', err.message || err);
        } else {
            hasSubscribedToTopics = true;
            console.log('📡 Subscribed to:', topics.join(', '));
        }
    });
});

client.on('message', async (topic, message) => {
    const timestamp = new Date().toISOString();

    let type = 'UNKNOWN';
    if (topic.includes('/telemetry')) type = 'TELEMETRY';
    else if (topic.includes('/alert')) type = 'ALERT';
    else if (topic.includes('/status')) type = 'STATUS';
    else if (topic.includes('/command')) type = 'COMMAND';

    try {
        const data = JSON.parse(message.toString());

        const entry = {
            ...data,
            receivedAt: timestamp,
            topic,
            type,
        };

        // Logs
        console.log(`📥 [${type} RECEIVED] ${timestamp}`);
        console.log(JSON.stringify(data, null, 2));
        //logToFile({ timestamp, type, topic, data });

        if (db) {
            await db.collection('water_purifier_liveData').insertOne(entry);
            console.log(`💾 Saved ${type} entry to water_purifier_liveData for topic ${topic}`);

            let collectionName = '';
            switch (type) {
                case 'TELEMETRY': collectionName = 'device_telemetry'; break;
                case 'ALERT': collectionName = 'device_alerts'; break;
                case 'STATUS': collectionName = 'device_status'; break;
                case 'COMMAND': collectionName = 'device_command'; break;
                default: collectionName = 'unknown_messages';
            }

            await db.collection(collectionName).insertOne(entry);
            console.log(`💾 Saved entry to ${collectionName} collection for topic ${topic}`);

            // ✅ DAILY AGGREGATION FOR TELEMETRY
            if (type === 'TELEMETRY') {
                const {
                    wp_device_id,
                    modelName,
                    totalWaterUsed,
                    pressure,
                    tdsOut,
                } = data;

                if (wp_device_id && totalWaterUsed != null) {
                    const usageDate = new Date().toISOString().split('T')[0];
                    const usageCollection = db.collection('dailyBasedWaterUsage');

                    await usageCollection.updateOne(
                        { wp_device_id, date: usageDate },
                        {
                            $set: {
                                updatedAt: new Date(),
                                modelName: modelName || 'Unknown Model',
                            },
                            $min: {
                                minPressure: pressure,
                                minTDSOut: tdsOut,
                            },
                            $max: {
                                maxPressure: pressure,
                                maxTDSOut: tdsOut,
                            },
                            $inc: {
                                totalWaterUsed: totalWaterUsed,
                            }
                        },
                        { upsert: true }
                    );

                    console.log(`💾 Updated dailyBasedWaterUsage for ${wp_device_id} on ${usageDate}`);
                }
            }
        } else {
            console.warn('⚠️ Database not initialized yet.');
        }

    } catch (err) {
        console.error(`❌ Failed to parse message on topic: ${topic}`);
        console.error(message.toString());

        //logToFile({ timestamp, type, topic, message: message.toString() });

        if (db) {
            await db.collection('invalid_messages').insertOne({
                receivedAt: timestamp,
                topic,
                rawMessage: message.toString(),
                error: err.message
            });
            console.log(`💾 Saved invalid message for topic ${topic} with error: ${err.message}`);
        }
    }
});

client.on('error', (err) => {
    console.error('❌ MQTT Client Error:', err.message || err);
});

module.exports = client;
