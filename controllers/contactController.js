const Contact = require('../models/Contact');
const { sendContactEmail, sendAutoReply } = require('../utils/email');

exports.submitContact = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'Please fill in all required fields' });
        }
        const contact = new Contact({ name, email, phone, subject, message });
        await contact.save();

        // ✅ SEND EMAILS - KEEP THIS!
        try {
            await sendContactEmail({ name, email, phone, subject, message });
        } catch (emailError) {
            console.error('Error sending admin email:', emailError);
        }
        try {
            await sendAutoReply({ name, email });
        } catch (emailError) {
            console.error('Error sending auto-reply:', emailError);
        }

        res.status(201).json({
            message: 'Your enquiry has been submitted successfully. We will get back to you soon!'
        });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ message: 'Error submitting enquiry' });
    }
};

exports.getContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ message: 'Error fetching contacts' });
    }
};

exports.updateContactStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const contact = await Contact.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        res.json(contact);
    } catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({ message: 'Error updating contact' });
    }
};

exports.deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({ message: 'Error deleting contact' });
    }
};