const mqtt = require('mqtt');

const brokerUrl = 'mqtt://172.232.109.123';
const options = {
  port: 1883,
  username: '1',
  password: '1',
  clientId: `receiver_${Math.random().toString(16).substr(2, 8)}`,
  clean: true
};

const client = mqtt.connect(brokerUrl, options);

client.on('connect', () => {
  console.log('✅ Connected to MQTT Broker');

  // ✅ Subscribe to your topic
  client.subscribe('pandi', (err) => {
    if (err) {
      console.error('❌ Failed to subscribe to topic "pandi"');
    } else {
      console.log('📡 Subscribed to topic: pandi');
    }
  });
});

client.on('message', (topic, message) => {
  try {
    const parsed = JSON.parse(message.toString());
    console.log(`📥 [${topic}]:`, parsed);
  } catch (err) {
    console.log(`📥 [${topic}]: (non-JSON)`, message.toString());
  }
});

client.on('error', (err) => {
  console.error('❌ MQTT Error:', err.message);
});
