const { connectToDatabase } = require('../config/db');

async function createIndexes() {
  try {
    const db = await connectToDatabase();
    
    console.log('Creating indexes...');
    
    await Promise.all([
      db.collection('service_records').createIndex({ task_type: 1, task_status: 1 }),
      db.collection('service_records').createIndex({ wp_device_id: 1 }),
      db.collection('service_records').createIndex({ device_id: 1 }),
      db.collection('service_records').createIndex({ task_type: 1, wp_device_id: 1 }),
      db.collection('service_records').createIndex({ task_type: 1, device_id: 1 }),
      db.collection('service_records').createIndex({ assigned_technician_id: 1 }),
      db.collection('orders').createIndex({ wp_device_id: 1 }),
      db.collection('orders').createIndex({ paymentStatus: 1 }),
      db.collection('orders').createIndex({ createdAt: -1 }),
      db.collection('orders').createIndex({ 'deliveryAddress.district': 1 }),
      db.collection('orders').createIndex({ orderStatus: 1, paymentType: 1, paymentStatus: 1 }),
      db.collection('orders').createIndex({ user_id: 1 }),
      db.collection('device_details').createIndex({ wp_device_id: 1 }),
      db.collection('device_details').createIndex({ model_id: 1 }),
      db.collection('users').createIndex({ user_id: 1 }),
      db.collection('users').createIndex({ technician_id: 1 }),
      db.collection('users').createIndex({ role_id: 1 }),
      db.collection('users').createIndex({ district: 1 }),
      db.collection('product_models').createIndex({ model_id: 1 }),
      db.collection('payments').createIndex({ orderId: 1 }),
      db.collection('payments').createIndex({ paymentStatus: 1 }),
      db.collection('payments').createIndex({ createdAt: -1 }),
    ]);
    
    console.log('✅ All indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();
