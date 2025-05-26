const database = require('../../../config/db');

// Controller for handling contact form submission
exports.submitContact = async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Validate all required fields
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const db = await database.connectToDatabase();

        const contactData = {
            name,
            email,
            subject,
            message,
            submittedAt: new Date(),
        };

        await db.collection('contactUs').insertOne(contactData);

        return res.status(200).json({
            message: 'Your details were sent successfully. The ionHive Water Purifier team will call you soon.',
        });
    } catch (error) {
        console.error('Submit Contact Error:', error);
        return res.status(500).json({
            message: 'Failed to submit contact details',
            error: error.message,
        });
    }
};


// Controller to fetch all contact submissions for admin
exports.getAllSubmissions = async (req, res) => {
    try {
        const db = await database.connectToDatabase();

        const contactUsEntries = await db.collection('contactUs').find().toArray();

        return res.status(200).json({ data: contactUsEntries });
    } catch (error) {
        console.error('Fetch Contact Submissions Error:', error);
        return res.status(500).json({ message: 'Failed to fetch contact submissions', error: error.message });
    }
};
