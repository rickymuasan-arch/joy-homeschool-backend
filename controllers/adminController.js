const User = require('../models/User');
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const { sendEmail } = require('../utils/email');

exports.getParents = async (req, res) => {
    try {
        const parents = await Parent.find().populate('children');
        res.json(parents);
    } catch (error) {
        console.error('Get parents error:', error);
        res.status(500).json({ message: 'Error fetching parents' });
    }
};

exports.getStudents = async (req, res) => {
    try {
        const students = await Student.find().populate('parentId');
        res.json(students);
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: 'Error fetching students' });
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