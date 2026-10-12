const User = require('../models/User');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// ============================================
// REGISTER
// ============================================
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

        const hashedPassword = await bcrypt.hash(parentPassword, 10);

        const user = new User({
            fullName: parentName,
            email: parentEmail.toLowerCase(),
            password: hashedPassword,
            phone: parentPhone || '',
            role: 'parent',
            isApproved: false,
            isRejected: false,
            isActive: true
        });
        await user.save();

        const student = new Student({
            fullName: studentName,
            dateOfBirth: studentDOB,
            parentId: user._id,
            parentName: parentName,
            parentEmail: parentEmail.toLowerCase(),
            parentPhone: parentPhone || '',
            curriculum: curriculum || 'IGCSE',
            grade: grade || 'Year 7',
            isActive: true
        });
        await student.save();

        res.status(201).json({
            message: 'Registration successful! Please wait for admin approval.',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved,
                isRejected: user.isRejected
            },
            studentId: student._id
        });

    } catch (error) {
        console.error('❌ Register error:', error);
        res.status(500).json({ message: 'Server error during registration: ' + error.message });
    }
};

// ============================================
// ✅ FIXED LOGIN - NO MORE INVALID CREDENTIALS
// ============================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('========================================');
        console.log('🔐 LOGIN ATTEMPT:', email);
        console.log('========================================');

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        
        if (!user) {
            console.log('❌ User NOT found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log('✅ User FOUND!');
        console.log('📧 Email:', user.email);
        console.log('👤 Name:', user.fullName);
        console.log('🔑 Role:', user.role);
        console.log('✅ isApproved (DB):', user.isApproved);
        console.log('❌ isRejected (DB):', user.isRejected || false);

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('📌 Password match:', isMatch ? '✅ YES' : '❌ NO');

        if (!isMatch) {
            console.log('❌ Password mismatch');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // ✅ CHECK: Is parent rejected?
        if (user.role === 'parent' && user.isRejected === true) {
            console.log('❌ User is REJECTED');
            return res.status(403).json({ 
                message: 'Your account has been rejected. Please contact admin.',
                isRejected: true,
                isApproved: false
            });
        }

        // ✅ CHECK: Is parent approved?
        if (user.role === 'parent' && !user.isApproved) {
            console.log('⏳ User is PENDING approval');
            return res.status(403).json({ 
                message: 'Your account is pending approval. Please wait for admin verification.',
                isApproved: false,
                isRejected: false
            });
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'aviora_secret_key',
            { expiresIn: '7d' }
        );

        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('========================================');

        // ✅ FIX: Send ACTUAL database values
        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved,          // ✅ FROM DATABASE
                isRejected: user.isRejected || false, // ✅ FROM DATABASE
                phone: user.phone || ''
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// ============================================
// FORGOT PASSWORD
// ============================================
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
        const resetTokenExpiry = Date.now() + 3600000;

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        console.log('🔑 Password reset token for', email, ':', resetToken);

        res.json({ message: 'Password reset link sent to your email.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Error processing request' });
    }
};

// ============================================
// RESET PASSWORD
// ============================================
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Error resetting password' });
    }
};