const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const Parent = require('../models/Parent');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const PasswordReset = require('../models/PasswordReset');

const router = express.Router();

// ===== REGISTER PARENT & STUDENT =====
router.post('/register', async (req, res) => {
    try {
        const { parentName, parentEmail, parentPhone, parentPassword, studentName, studentDOB, curriculum, grade } = req.body;

        const existingParent = await Parent.findOne({ email: parentEmail });
        if (existingParent) {
            return res.status(400).json({ message: 'Parent already registered' });
        }

        const hashedPassword = await bcrypt.hash(parentPassword, 10);

        const parent = new Parent({
            fullName: parentName,
            email: parentEmail,
            phone: parentPhone,
            password: hashedPassword,
            isApproved: false
        });
        await parent.save();

        const student = new Student({
            fullName: studentName,
            dateOfBirth: studentDOB,
            parentId: parent._id,
            curriculum,
            grade,
            isActive: true
        });
        await student.save();

        parent.children.push(student._id);
        await parent.save();

        res.status(201).json({ message: 'Registration successful! Please wait for admin approval.', parentId: parent._id, studentId: student._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== PARENT LOGIN =====
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const parent = await Parent.findOne({ email: email.toLowerCase() });
        if (!parent) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!parent.isApproved) {
            return res.status(401).json({ message: 'Account pending approval' });
        }

        const isValid = await bcrypt.compare(password, parent.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        parent.lastLogin = new Date();
        await parent.save();

        const token = jwt.sign({ id: parent._id, role: 'parent' }, 'aviora_secret_key', { expiresIn: '7d' });

        res.json({ token, user: { id: parent._id, name: parent.fullName, email: parent.email, role: 'parent', children: parent.children } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== ADMIN LOGIN =====
router.post('/admin-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!admin.isActive) {
            return res.status(401).json({ message: 'Account disabled' });
        }

        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        admin.lastLogin = new Date();
        await admin.save();

        const token = jwt.sign({ id: admin._id, role: admin.role }, 'aviora_secret_key', { expiresIn: '7d' });

        res.json({ token, user: { id: admin._id, name: admin.fullName, email: admin.email, role: admin.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== FORGOT PASSWORD =====
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        let user = await Parent.findOne({ email: email.toLowerCase() });
        let userType = 'Parent';

        if (!user) {
            user = await Admin.findOne({ email: email.toLowerCase() });
            userType = 'Admin';
        }

        if (!user) {
            return res.json({ message: 'If an account exists, a reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000);

        await PasswordReset.create({ userId: user._id, userType, email: email.toLowerCase(), resetToken, expiresAt, used: false });

        console.log(`Reset link for ${email}: http://localhost:5000/reset-password?token=${resetToken}`);

        res.json({ message: 'If an account exists, a reset link has been sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== RESET PASSWORD =====
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const resetEntry = await PasswordReset.findOne({ resetToken: token, used: false, expiresAt: { $gt: new Date() } });
        if (!resetEntry) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        if (resetEntry.userType === 'Parent') {
            await Parent.findByIdAndUpdate(resetEntry.userId, { password: hashedPassword });
        } else if (resetEntry.userType === 'Admin') {
            await Admin.findByIdAndUpdate(resetEntry.userId, { password: hashedPassword });
        }

        resetEntry.used = true;
        await resetEntry.save();

        res.json({ message: 'Password reset successful!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;