const { getDB } = require('../config/db');

exports.requestCall = async (req, res) => {
  const { name, phone, city } = req.body;

  if (!name || !phone || !city) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const db = getDB();
    const callRequest = {
      name,
      phone,
      city,
      requestedAt: new Date()
    };

    await db.collection('callRequests').insertOne(callRequest);

    return res.status(200).json({ message: 'Call request submitted successfully, we will get back soon' });
  } catch (error) {
    console.error('Call Request Error:', error);
    return res.status(500).json({ message: 'Failed to submit call request', error: error.message });
  }
};
