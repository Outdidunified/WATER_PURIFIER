const mqtt = require('mqtt');
const { connectToDatabase } = require('../../../config/db');
const { ObjectId } = require('mongodb'); // add at top if not already


// MQTT Connection Config
const clientId = `server_${Math.random().toString(16).substr(2, 8)}`;
const mqttClient = mqtt.connect('mqtt://172.232.109.123:1883', {
  clientId,
  username: '1',
  password: '1',
});

// MongoDB Collections
let db;
let deviceDetailsCollection,
  featureValuesCollection,
  alertCollection,
  statusCollection,
  rawLogsCollection,
  deviceStatusCollection,
  usersCollection,
  ordersCollection;

// MQTT Subscriptions
mqttClient.on('connect', () => {
  console.log('✅ MQTT connected');
  mqttClient.subscribe('waterpurifier/+/telemetry');
  mqttClient.subscribe('waterpurifier/+/alert');
  mqttClient.subscribe('waterpurifier/+/status');
  console.log('✅ Subscribed to MQTT topics');
});

mqttClient.on('error', (err) => {
  console.error('❌ MQTT connection error:', err.message);
});

// MongoDB Initialization
connectToDatabase().then((database) => {
  db = database;
  deviceDetailsCollection = db.collection('device_details');
  featureValuesCollection = db.collection('device_feature_values');
  alertCollection = db.collection('device_alerts');
  statusCollection = db.collection('device_command_status');
  rawLogsCollection = db.collection('mqtt_raw_logs');
  deviceStatusCollection = db.collection('device_status');
  usersCollection = db.collection('users');
  ordersCollection = db.collection('orders');
  console.log('✅ MongoDB connected for MQTT receiver');
});

// Message Handler
mqttClient.on('message', async (topic, payload) => {
  const timestamp = new Date();
  const payloadString = payload.toString();

  console.log(`📥 Received MQTT message on topic: ${topic}`);

  try {
    const data = JSON.parse(payloadString);
    const [, topicDeviceId, topicType] = topic.split('/');

    if (!topicDeviceId || !topicType) return;

    // ✅ Validate deviceId match between topic and payload
    if (data.deviceId && data.deviceId !== topicDeviceId) {
      console.warn(`❌ Device ID mismatch: topic = ${topicDeviceId}, payload = ${data.deviceId}`);
      return;
    }

    const deviceId = topicDeviceId;

    // ✅ Log raw message
    if (rawLogsCollection) {
      await rawLogsCollection.insertOne({
        topic,
        deviceId,
        type: topicType,
        payload: data,
        receivedAt: timestamp,
      });
    }

    // ✅ Check device existence
    const device = await deviceDetailsCollection.findOne({
      wp_device_id: { $regex: new RegExp(`^${deviceId}$`, 'i') },
    });

    if (!device) {
      console.warn(`❌ Unknown device ${deviceId}`);
      return;
    }

    // ✅ Prepare base record
    const record = {
      deviceId,
      topicType,
      timestamp: data.timestamp ? new Date(data.timestamp) : timestamp,
    };

    // Alert Frame
    if (topicType === 'alert') {
      record.is_alert = {
        alertType: data.alertType,
        message: data.message,
      };
      record.is_ack = null;

      await alertCollection.insertOne({
        deviceId,
        alertType: data.alertType,
        message: data.message,
        timestamp: record.timestamp,
      });

      console.log(`🚨 [Alert Frame] ${data.alertType} logged for ${deviceId}`);

      await featureValuesCollection.updateOne(
        { deviceId },
        { $set: { alertType: data.alertType, alertMessage: data.message } },
        { sort: { timestamp: -1 } }
      );
    }

    // Status Frame (Acknowledgement)
    else if (topicType === 'status') {
      record.is_ack = {
        acknowledgedCommand: data.acknowledgedCommand,
        ack_status: data.status,
      };
      record.is_alert = null;

      await statusCollection.insertOne({
        deviceId,
        acknowledgedCommand: data.acknowledgedCommand,
        ack_status: data.status,
        timestamp: record.timestamp,
      });

      console.log(`📬 [ACK] ${data.acknowledgedCommand} from ${deviceId}`);
    }

    // Telemetry Frame
   else if (topicType === 'telemetry') {
  Object.assign(record, data); // include telemetry fields
  record.is_alert = null;
  record.is_ack = null;

  // ✅ Check is_subscribed_wp and handle accordingly
  // ✅ Check is_subscribed_wp and handle accordingly
if (data.is_subscribed_wp === false) {
  const user = await usersCollection.findOne({
    assigned_device_ids: deviceId
  });

  if (user) {
    const currentStatus = await deviceStatusCollection.findOne({ deviceId });
    const isLocked = currentStatus?.is_locked === true;

    if (user.is_subscribed === true && user.active_order_id) {
      const order = await ordersCollection.findOne({
        _id: new ObjectId(user.active_order_id),
        wp_device_id: { $regex: new RegExp(`^${deviceId}$`, 'i') }
      });

      if (order) {
        // ✅ Send UNLOCK_DEVICE if currently locked
        if (isLocked) {
          const unlockPayload = {
            command: 'UNLOCK_DEVICE',
            reason: 'Plan renewed',
            timestamp: new Date().toISOString()
          };

          const commandTopic = `waterpurifier/${deviceId}/command`;
          mqttClient.publish(commandTopic, JSON.stringify(unlockPayload), (err) => {
            if (err) {
              console.error(`❌ Failed to publish UNLOCK_DEVICE for ${deviceId}:`, err.message);
            } else {
              console.log(`🔓 Sent UNLOCK_DEVICE to ${commandTopic}`);
            }
          });

          // ✅ Update lock status
          await deviceStatusCollection.updateOne(
            { deviceId },
            { $set: { is_locked: false } }
          );
        }

        // ✅ Then proceed with SET_PLAN
        const planType = order.selectedPlan?.label || 'BASIC';
        const totalWaterLimit = order.totalLitre || 500;
        const durationText = order.selectedDuration?.duration_time_limit || '30 days';
        const subscriptionDuration = parseInt(durationText) || 30;
        const startDate = new Date(order.createdAt).toISOString().split('T')[0];
        const endDate = new Date(order.subscriptionExpiryDate).toISOString().split('T')[0];

        const commandPayload = {
          command: 'SET_PLAN',
          planType,
          subscriptionDuration,
          totalWaterLimit,
          startDate,
          endDate
        };

        const commandTopic = `waterpurifier/${deviceId}/command`;
        mqttClient.publish(commandTopic, JSON.stringify(commandPayload), (err) => {
          if (err) {
            console.error(`❌ Failed to publish SET_PLAN for ${deviceId}:`, err.message);
          } else {
            console.log(`📤 Sent SET_PLAN to ${commandTopic}`);
          }
        });
      } else {
        console.warn(`⚠️ No active order found for user ${user._id} & device ${deviceId}`);
      }

    } else {
      // ❌ is_subscribed is false → send LOCK_DEVICE
      const lockPayload = {
        command: 'LOCK_DEVICE',
        reason: 'Subscription expired',
        timestamp: new Date().toISOString()
      };

      const commandTopic = `waterpurifier/${deviceId}/command`;
      mqttClient.publish(commandTopic, JSON.stringify(lockPayload), (err) => {
        if (err) {
          console.error(`❌ Failed to publish LOCK_DEVICE for ${deviceId}:`, err.message);
        } else {
          console.log(`🔒 Sent LOCK_DEVICE to ${commandTopic}`);
        }
      });

      // ✅ Update lock status
      await deviceStatusCollection.updateOne(
        { deviceId },
        { $set: { is_locked: true } },
        { upsert: true }
      );
    }

  } else {
    console.warn(`🚫 No user found for device ${deviceId}`);
  }
}


  // ✅ Auto-alert detection (as usual)
  const alerts = [];

  if (data.totalWaterUsed >= data.totalWaterLimit)
    alerts.push({ alertType: 'LIMIT_EXCEEDED', message: 'Water limit exceeded' });

  if (data.pressure < 1.5)
    alerts.push({ alertType: 'PRESSURE_LOW', message: 'Pressure is low' });

  if (data.tdsOut > 100)
    alerts.push({ alertType: 'TDS_OUT_HIGH', message: 'TDS output > 100 ppm' });

  if (data.tdsOut < 30)
    alerts.push({ alertType: 'TDS_OUT_LOW', message: 'TDS output < 30 ppm' });

  for (const alert of alerts) {
    await alertCollection.insertOne({
      deviceId,
      alertType: alert.alertType,
      message: alert.message,
      timestamp: record.timestamp
    });
    console.log(`🚨 [Auto-Alert] ${alert.alertType} for ${deviceId}`);
  }
}


    // ✅ Always insert telemetry/history record
    await featureValuesCollection.insertOne({
      ...data,
      deviceId,
      topicType,
      timestamp: record.timestamp,
    });

    // ✅ Update or insert current status
    delete record._id;
    await deviceStatusCollection.updateOne(
      { deviceId },
      { $set: record },
      { upsert: true }
    );

    console.log(`📦 [${topicType.toUpperCase()}] Updated device_status for ${deviceId}`);
  } catch (e) {
    console.error('❌ JSON parse error or processing failure:', e.message);
    console.log('🚫 Payload:', payloadString);

    if (rawLogsCollection) {
      await rawLogsCollection.insertOne({
        topic,
        payload: payloadString,
        receivedAt: timestamp,
        error: e.message,
      });
    }
  }
});

module.exports = mqttClient;
