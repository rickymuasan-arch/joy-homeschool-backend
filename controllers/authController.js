const User = require('../models/User');
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail, sendEmail } = require('../utils/email');

exports.register = async (req, res) => {
    try {
        const { parentName, parentEmail, parentPhone, parentPassword, studentName, studentDOB, curriculum, grade } = req.body;

        if (!parentName || !parentEmail || !parentPassword || !studentName) {
            return res.status(400).json({ message: 'Please fill in all required fields' });
        }
        if (parentPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        const existingUser = await User.findOne({ email: parentEmail.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const parent = new Parent({
            fullName: parentName,
            email: parentEmail.toLowerCase(),
            phone: parentPhone,
            isApproved: false
        });
        await parent.save();

        const user = new User({
            fullName: parentName,
            email: parentEmail.toLowerCase(),
            password: parentPassword,
            phone: parentPhone,
            role: 'parent',
            isApproved: false,
            parentId: parent._id
        });
        await user.save();

        const student = new Student({
            fullName: studentName,
            dateOfBirth: studentDOB,
            curriculum: curriculum || 'IGCSE',
            grade: grade || 'Year 7',
            parentId: parent._id,
            isActive: true
        });
        await student.save();

        parent.children = [student._id];
        await parent.save();

        try {
            await sendEmail({
                to: process.env.ADMIN_EMAIL || 'info@joyhomeschool.co.ke',
                subject: 'New Parent Registration - Pending Approval',
                html: `
                    <h2>New Parent Registration</h2>
                    <p><strong>Name:</strong> ${parentName}</p>
                    <p><strong>Email:</strong> ${parentEmail}</p>
                    <p><strong>Phone:</strong> ${parentPhone || 'Not provided'}</p>
                    <p><strong>Student:</strong> ${studentName}</p>
                    <p>Please log in to the admin dashboard to approve this registration.</p>
                `
            });
        } catch (err) {
            console.error('Error sending admin notification:', err);
        }

        res.status(201).json({
            message: 'Registration successful! Please wait for admin approval.',
            parentId: parent._id,
            studentId: student._id
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (user.role === 'parent' && !user.isApproved) {
            return res.status(403).json({ message: 'Your account is pending approval.' });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: 'Your account has been deactivated.' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: 'Your account has been deactivated.' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'No user found with this email' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        await sendPasswordResetEmail({ email: user.email, resetToken });

        res.json({ message: 'Password reset link sent to your email' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Error sending reset link' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        user.password = newPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Error resetting password' });
    }
};