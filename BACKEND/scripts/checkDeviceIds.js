const { connectToDatabase } = require('../config/db');

(async () => {
  try {
    const db = await connectToDatabase();
    const serviceRecords = db.collection('service_records');
    const ordersCollection = db.collection('orders');

    console.log('='.repeat(60));
    console.log('SERVICE TASKS - DEVICE ID DIAGNOSTIC');
    console.log('='.repeat(60));

    // Find tasks WITH device ID
    const tasksWithDeviceId = await serviceRecords
      .find({ task_type: 2, wp_device_id: { $exists: true, $ne: '', $ne: null } })
      .toArray();

    console.log(`\n✅ Tasks WITH wp_device_id: ${tasksWithDeviceId.length}`);
    tasksWithDeviceId.forEach(t => {
      console.log(`  - Task ${t.task_id}: ${t.wp_device_id}`);
    });

    // Find tasks WITHOUT device ID - with details
    const tasksWithoutDeviceId = await serviceRecords
      .find({
        task_type: 2,
        $or: [
          { wp_device_id: null },
          { wp_device_id: { $exists: false } },
          { wp_device_id: '' }
        ]
      })
      .limit(5)
      .toArray();

    console.log(`\n❌ Sample tasks WITHOUT wp_device_id (showing 5):`);
    for (const task of tasksWithoutDeviceId) {
      console.log(`\n  Task ${task.task_id}:`);
      console.log(`    - Status: ${task.task_status || 'N/A'}`);
      console.log(`    - device_id field: ${task.device_id || 'N/A'}`);
      console.log(`    - order field: ${task.order ? JSON.stringify(task.order).substring(0, 80) + '...' : 'N/A'}`);
      console.log(`    - Created by user: ${task.task_created_by_user_id || 'N/A'}`);
      
      // Try to find related order
      if (task.order && task.order.customOrderId) {
        const order = await ordersCollection.findOne({ customOrderId: task.order.customOrderId });
        if (order) {
          console.log(`    - Found order: ${order.customOrderId} | wp_device_id: ${order.wp_device_id || 'N/A'}`);
        }
      }
    }

    // Check if we can link tasks to orders by device_id
    const tasksWithDeviceIdField = await serviceRecords
      .find({ task_type: 2, device_id: { $exists: true, $ne: '', $ne: null } })
      .limit(5)
      .toArray();

    console.log(`\n📊 Tasks with device_id field (showing 5):`);
    for (const task of tasksWithDeviceIdField) {
      console.log(`\n  Task ${task.task_id}: device_id=${task.device_id}`);
      const order = await ordersCollection.findOne({ wp_device_id: task.device_id });
      if (order) {
        console.log(`    ✅ Found matching order: ${order.customOrderId}`);
      } else {
        console.log(`    ❌ No order found for device_id: ${task.device_id}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();