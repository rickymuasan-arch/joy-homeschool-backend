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
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// ============================================
// LOGIN
// ============================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('========================================');
        console.log('LOGIN ATTEMPT:', email);
        console.log('========================================');

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            console.log('User NOT found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log('User FOUND:', user.email, '| Role:', user.role);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch ? 'YES' : 'NO');

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.role === 'parent' && user.isRejected === true) {
            return res.status(403).json({
                message: 'Your account has been rejected. Please contact admin.',
                isRejected: true,
                isApproved: false
            });
        }

        if (user.role === 'parent' && !user.isApproved) {
            return res.status(403).json({
                message: 'Your account is pending approval. Please wait for admin verification.',
                isApproved: false,
                isRejected: false
            });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'aviora_secret_key',
            { expiresIn: '7d' }
        );

        console.log('LOGIN SUCCESSFUL!');
        console.log('========================================');

        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved,
                isRejected: user.isRejected || false,
                phone: user.phone || ''
            }
        });

    } catch (error) {
        console.error('Login error:', error);
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

        console.log('Password reset token for', email, ':', resetToken);

        const resetUrl = `${process.env.FRONTEND_URL || 'https://joyhomeschool.co.ke'}/#reset-password?token=${resetToken}`;

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #E31B23;">Password Reset Request</h2>
                <p>Hello ${user.fullName},</p>
                <p>You requested to reset your password for Joy Homeschool Portal.</p>
                <p>Click the link below to reset your password. This link expires in 1 hour.</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background: #E31B23; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Reset Password
                    </a>
                </p>
                <p style="color: #666; font-size: 0.9rem;">If the button doesn't work, copy this link:</p>
                <p style="color: #666; font-size: 0.85rem; word-break: break-all;">${resetUrl}</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 0.85rem;">If you didn't request this, ignore this email.</p>
                <p style="color: #999; font-size: 0.85rem;">— Joy Homeschool & Tuition Centre</p>
            </div>
        `;

        try {
            const SibApiV3Sdk = require('@getbrevo/brevo');
            const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
            apiInstance.setApiKey(
                SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
                process.env.BREVO_API_KEY
            );

            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
            sendSmtpEmail.subject = 'Password Reset - Joy Homeschool';
            sendSmtpEmail.htmlContent = htmlContent;
            sendSmtpEmail.sender = { name: 'Joy Homeschool', email: 'rickymuasan@gmail.com' };
            sendSmtpEmail.to = [{ email: user.email, name: user.fullName }];

            await apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log('✅ Email sent via Brevo API to:', user.email);
            res.json({ message: 'Password reset link sent to your email.' });
        } catch (emailError) {
            console.error('❌ Email send failed:', emailError.message);
            res.status(500).json({
                message: 'Could not send email. Please contact admin.',
                error: emailError.message
            });
        }

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

        console.log('Password reset successful for:', user.email);
        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Error resetting password' });
    }
};