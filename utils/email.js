const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendEmail = async ({ to, subject, html, from = process.env.SMTP_FROM }) => {
    try {
        const mailOptions = { from: from || process.env.SMTP_FROM, to, subject, html };
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email sending error:', error);
        throw error;
    }
};

const sendContactEmail = async ({ name, email, phone, subject, message }) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'info@joyhomeschool.co.ke';
    const html = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr>
        <p>Sent from Joy Homeschool website</p>
        <p><strong>To reply, simply reply to this email.</strong></p>
    `;
    return sendEmail({ to: adminEmail, subject: `New Enquiry: ${subject}`, html });
};

const sendAutoReply = async ({ name, email }) => {
    const html = `
        <h2>Thank You for Contacting Joy Homeschool!</h2>
        <p>Dear ${name},</p>
        <p>Thank you for your inquiry. We have received your message and will get back to you within 24 hours.</p>
        <p>If you need immediate assistance, please call us at <strong>+254 710 692 228</strong></p>
        <p>Best regards,</p>
        <p><strong>Joy Homeschool & Tuition Centre Team</strong></p>
        <hr>
        <p style="font-size:0.85rem;color:#6B7280;">Visit us at: www.joyhomeschool.co.ke</p>
    `;
    return sendEmail({ to: email, subject: 'Thank You for Contacting Joy Homeschool', html });
};

const sendPasswordResetEmail = async ({ email, resetToken }) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://www.joyhomeschool.co.ke'}/reset-password.html?token=${resetToken}`;
    const html = `
        <h2>Password Reset Request</h2>
        <p>Hello ${email},</p>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#E8A838;color:#0B1A4A;text-decoration:none;border-radius:8px;font-weight:bold;">Reset Password</a></p>
        <p>This link will expire in <strong>1 hour</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>— Joy Homeschool Team</p>
    `;
    return sendEmail({ to: email, subject: 'Password Reset - Joy Homeschool', html });
};

module.exports = {
    sendEmail,
    sendContactEmail,
    sendAutoReply,
    sendPasswordResetEmail
};