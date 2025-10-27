const { connectToDatabase } = require('../config/db');

(async () => {
  try {
    const db = await connectToDatabase();
    const serviceRecords = db.collection('service_records');

    console.log('='.repeat(60));
    console.log('INSTALLATION TASKS STATUS (task_type: 1)');
    console.log('='.repeat(60));

    // Check tasks 161, 196, 199
    const taskIds = [161, 196, 199];

    for (const taskId of taskIds) {
      const task = await serviceRecords.findOne({ task_id: taskId });
      
      if (task) {
        console.log(`\n📋 Task ${task.task_id}:`);
        console.log(`  - Status: ${task.task_status}`);
        console.log(`  - Assigned to: ${task.assigned_technician_id || 'None'}`);
        console.log(`  - wp_device_id: ${task.wp_device_id || 'N/A'}`);
        console.log(`  - Address: ${task.address?.state || 'N/A'}, ${task.address?.district || 'N/A'}`);
        console.log(`  - Assignment History: ${task.assignment_history?.length || 0} entries`);
        
        if (task.assignment_history && task.assignment_history.length > 0) {
          const lastEntry = task.assignment_history[task.assignment_history.length - 1];
          console.log(`  - Last Assigned: ${lastEntry.technician_id} (${new Date(lastEntry.assigned_date).toLocaleString()})`);
        }
      } else {
        console.log(`\n❌ Task ${taskId}: NOT FOUND`);
      }
    }

    // Summary of all tasks by status
    console.log(`\n${'='.repeat(60)}`);
    console.log('INSTALLATION TASKS SUMMARY (task_type: 1)');
    console.log('='.repeat(60));

    const statusBreakdown = await serviceRecords.aggregate([
      { $match: { task_type: 1 } },
      { $group: { _id: '$task_status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    statusBreakdown.forEach(({ _id, count }) => {
      console.log(`  ${_id || 'Unknown'}: ${count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();