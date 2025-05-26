const database = require('../../../config/db');

exports.requestCall = async (req, res) => {
    const { name, phone, city } = req.body;

    // console.log('Received Call Request:', req.body);

    if (!name || !phone || !city) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }

    try {
        const db = await database.connectToDatabase();
        const callRequest = {
            name,
            phone,
            city,
            requestedAt: new Date()
        };

        await db.collection('callRequests').insertOne(callRequest);

        return res.status(200).json({
            success: true,
            message: 'Your call request has been submitted successfully. IonHive Water Purifier will call you soon.'
        });
    } catch (error) {
        console.error('Call Request Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to submit call request. Please try again later.',
            error: error.message
        });
    }
};
