// controllers/requestCallController.js
const RequestCall = require('../models/CallRequest');

exports.requestCall = async (req, res) => {
  const { name, phone, city } = req.body;

  if (!name || !phone || !city) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const newRequest = new RequestCall({ name, phone, city });
    await newRequest.save();

    // Optional: Integrate with call API like Twilio here

    return res.status(200).json({ message: 'Call request submitted successfully,we will get Back Soon' });
  } catch (error) {
    console.error('Call Request Error:', error);
    return res.status(500).json({ message: 'Failed to submit call request', error: error.message });
  }
};



