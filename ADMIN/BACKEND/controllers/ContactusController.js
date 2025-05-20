const ContactUs = require('../models/Contactus'); // Import the model

// Controller for handling contact form submission
exports.submitContact = async (req, res) => {
  const { name, phone, city, message } = req.body;

  if (!name || !phone || !city || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const contactUsEntry = new ContactUs({
      name,
      phone,
      city,
      message,
    });

    await contactUsEntry.save();

    return res.status(200).json({ message: 'Contact details submitted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to submit contact details', error: error.message });
  }
};

// Controller to fetch all contact submissions for admin
exports.getAllSubmissions = async (req, res) => {
  try {
    const contactUsEntries = await ContactUs.find();
    
    return res.status(200).json({ data: contactUsEntries });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch contact submissions', error: error.message });
  }
};
