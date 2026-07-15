const User = require('../models/User');
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Event = require('../models/Event');
const ReportCard = require('../models/ReportCard');
const { sendEmail } = require('../utils/email');

// ============================================
// PARENT MANAGEMENT
// ============================================
exports.getParents = async (req, res) => {
    try {
        const parents = await Parent.find().populate('children');
        res.json(parents);
    } catch (error) {
        console.error('Get parents error:', error);
        res.status(500).json({ message: 'Error fetching parents' });
    }
};

exports.approveParent = async (req, res) => {
    try {
        const parent = await Parent.findById(req.params.id);
        if (!parent) {
            return res.status(404).json({ message: 'Parent not found' });
        }
        parent.isApproved = true;
        await parent.save();
        await User.findOneAndUpdate({ parentId: parent._id }, { isApproved: true });
        try {
            await sendEmail({
                to: parent.email,
                subject: 'Your Joy Homeschool Account Has Been Approved',
                html: `
                    <h2>Account Approved!</h2>
                    <p>Dear ${parent.fullName},</p>
                    <p>Your Joy Homeschool account has been approved by the admin.</p>
                    <p>You can now log in to your account.</p>
                    <p><a href="https://www.joyhomeschool.co.ke" style="display:inline-block;padding:12px 24px;background:#E8A838;color:#0B1A4A;text-decoration:none;border-radius:8px;font-weight:bold;">Login Now</a></p>
                    <p>— Joy Homeschool Team</p>
                `
            });
        } catch (err) {
            console.error('Error sending approval email:', err);
        }
        res.json({ message: 'Parent approved successfully' });
    } catch (error) {
        console.error('Approve parent error:', error);
        res.status(500).json({ message: 'Error approving parent' });
    }
};

exports.deleteRejectedParent = async (req, res) => {
    try {
        const parent = await User.findById(req.params.parentId);
        if (!parent) {
            return res.status(404).json({ message: 'Parent not found' });
        }
        if (parent.role !== 'parent') {
            return res.status(400).json({ message: 'User is not a parent' });
        }
        if (parent.isApproved) {
            return res.status(400).json({ message: 'Only rejected parents can be deleted' });
        }
        await Student.deleteMany({ parentId: parent._id });
        await User.findByIdAndDelete(req.params.parentId);
        await Parent.findByIdAndDelete(req.params.parentId);
        res.json({ message: 'Rejected parent deleted successfully' });
    } catch (error) {
        console.error('Delete rejected parent error:', error);
        res.status(500).json({ message: 'Error deleting parent' });
    }
};

// ============================================
// STUDENT MANAGEMENT
// ============================================
exports.getStudents = async (req, res) => {
    try {
        const students = await Student.find().populate('parentId');
        res.json(students);
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: 'Error fetching students' });
    }
};

// ============================================
// ADMIN MANAGEMENT
// ============================================
exports.getAdmins = async (req, res) => {
    try {
        const admins = await User.find({ 
            role: { $in: ['admin', 'super_admin'] } 
        }).select('-password');
        res.json(admins);
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({ message: 'Error fetching admins' });
    }
};

exports.createAdmin = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        const user = new User({
            fullName,
            email: email.toLowerCase(),
            password,
            role: role || 'admin',
            isApproved: true,
            isActive: true
        });
        await user.save();
        res.status(201).json({ message: 'Admin created successfully', user: { id: user._id, fullName, email, role: user.role } });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ message: 'Error creating admin' });
    }
};

exports.deleteAdmin = async (req, res) => {
    try {
        const admin = await User.findById(req.params.adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        if (admin.role === 'super_admin') {
            return res.status(403).json({ message: 'Cannot delete Super Admin' });
        }
        await User.findByIdAndDelete(req.params.adminId);
        res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({ message: 'Error deleting admin' });
    }
};

exports.deleteRejectedAdmin = async (req, res) => {
    try {
        const admin = await User.findById(req.params.adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        if (admin.role !== 'admin' && admin.role !== 'super_admin') {
            return res.status(400).json({ message: 'User is not an admin' });
        }
        if (admin.isActive) {
            return res.status(400).json({ message: 'Only deactivated admins can be deleted' });
        }
        await User.findByIdAndDelete(req.params.adminId);
        res.json({ message: 'Rejected admin deleted successfully' });
    } catch (error) {
        console.error('Delete rejected admin error:', error);
        res.status(500).json({ message: 'Error deleting admin' });
    }
};

// ============================================
// USER MANAGEMENT
// ============================================
exports.changeUserEmail = async (req, res) => {
    try {
        const { newEmail } = req.body;
        const userId = req.params.userId;
        if (!newEmail) {
            return res.status(400).json({ message: 'New email is required' });
        }
        const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const oldEmail = user.email;
        user.email = newEmail.toLowerCase();
        await user.save();
        try {
            await sendEmail({
                to: oldEmail,
                subject: 'Your email has been changed',
                html: `
                    <h2>Email Change Notification</h2>
                    <p>Your email address has been changed.</p>
                    <p><strong>Old Email:</strong> ${oldEmail}</p>
                    <p><strong>New Email:</strong> ${newEmail}</p>
                    <p>If you did not authorize this, please contact us immediately.</p>
                    <p>— Joy Homeschool Team</p>
                `
            });
        } catch (err) {
            console.error('Error sending old email notification:', err);
        }
        try {
            await sendEmail({
                to: newEmail,
                subject: 'Welcome to Joy Homeschool - Email Updated',
                html: `
                    <h2>Email Address Updated</h2>
                    <p>Your email address has been updated.</p>
                    <p>You can now log in with this email.</p>
                    <p>— Joy Homeschool Team</p>
                `
            });
        } catch (err) {
            console.error('Error sending new email notification:', err);
        }
        res.json({ message: 'Email updated successfully', user: { id: user._id, email: user.email } });
    } catch (error) {
        console.error('Change email error:', error);
        res.status(500).json({ message: 'Error changing email' });
    }
};

// ============================================
// PAYMENT MANAGEMENT
// ============================================
exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.find().populate('studentId').populate('parentId');
        res.json(payments);
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ message: 'Error fetching payments' });
    }
};

exports.approvePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        payment.status = 'Approved';
        await payment.save();
        res.json({ message: 'Payment approved successfully' });
    } catch (error) {
        console.error('Approve payment error:', error);
        res.status(500).json({ message: 'Error approving payment' });
    }
};

exports.rejectPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        payment.status = 'Rejected';
        await payment.save();
        res.json({ message: 'Payment rejected' });
    } catch (error) {
        console.error('Reject payment error:', error);
        res.status(500).json({ message: 'Error rejecting payment' });
    }
};

exports.deleteRejectedPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        if (payment.status !== 'Rejected') {
            return res.status(400).json({ message: 'Only rejected payments can be deleted' });
        }
        await Payment.findByIdAndDelete(req.params.paymentId);
        res.json({ message: 'Rejected payment deleted successfully' });
    } catch (error) {
        console.error('Delete rejected payment error:', error);
        res.status(500).json({ message: 'Error deleting payment' });
    }
};

// ============================================
// REPORT CARD MANAGEMENT
// ============================================
exports.uploadReportCard = async (req, res) => {
    try {
        res.json({ message: 'Report card uploaded successfully' });
    } catch (error) {
        console.error('Upload report card error:', error);
        res.status(500).json({ message: 'Error uploading report card' });
    }
};

exports.getReportCards = async (req, res) => {
    try {
        const reportCards = await ReportCard.find().populate('studentId');
        res.json(reportCards);
    } catch (error) {
        console.error('Get report cards error:', error);
        res.status(500).json({ message: 'Error fetching report cards' });
    }
};

exports.deleteReportCard = async (req, res) => {
    try {
        await ReportCard.findByIdAndDelete(req.params.reportId);
        res.json({ message: 'Report card deleted successfully' });
    } catch (error) {
        console.error('Delete report card error:', error);
        res.status(500).json({ message: 'Error deleting report card' });
    }
};

// ============================================
// EVENT MANAGEMENT
// ============================================
exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ startDate: 1 });
        res.json(events);
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const { title, description, eventType, startDate, endDate, location, curriculum } = req.body;
        if (!title || !description || !eventType || !startDate) {
            return res.status(400).json({ message: 'Please fill in all required fields' });
        }
        const event = new Event({ title, description, eventType, startDate, endDate, location, curriculum });
        await event.save();
        res.status(201).json({ message: 'Event created successfully', event });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ message: 'Error creating event' });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.eventId, req.body, { new: true });
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ message: 'Event updated successfully', event });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ message: 'Error updating event' });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.eventId);
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ message: 'Error deleting event' });
    }
};