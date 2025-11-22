const { connectToDatabase } = require('../config/db');

async function fixDates() {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('service_records');

    const result = await collection.updateMany(
      { created_date: { $type: 'string' } },
      [{ $set: { created_date: { $toDate: '$created_date' } } }]
    );

    console.log(`Updated ${result.modifiedCount} documents`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixDates();
