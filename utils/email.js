const nodemailer = require('nodemailer');

// ============================================
// CHECK IF SMTP IS CONFIGURED
// ============================================
const isSMTPConfigured = () => {
    return process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_USER !== '';
};

// ============================================
// CREATE TRANSPORTER
// ============================================
let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;

    if (!isSMTPConfigured()) {
        console.warn('⚠️ SMTP credentials not configured. Emails will be logged to console.');
        // Create dummy transporter for development
        transporter = {
            sendMail: async (mailOptions) => {
                console.log('📧 EMAIL (DEV MODE):');
                console.log(`  From: ${mailOptions.from || process.env.SMTP_FROM || 'info@joyhomeschool.co.ke'}`);
                console.log(`  To: ${mailOptions.to}`);
                console.log(`  Subject: ${mailOptions.subject}`);
                console.log(`  Body: ${mailOptions.html ? 'HTML content' : 'Text content'}`);
                return { messageId: 'dev-' + Date.now() };
            }
        };
        return transporter;
    }

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    return transporter;
};

// ============================================
// SEND EMAIL - GENERIC
// ============================================
const sendEmail = async ({ to, subject, html, from = null }) => {
    try {
        const transporter = getTransporter();
        const fromEmail = from || process.env.SMTP_FROM || 'info@joyhomeschool.co.ke';
        
        const mailOptions = {
            from: `"Joy Homeschool" <${fromEmail}>`,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Email sending error:', error);
        throw error;
    }
};

// ============================================
// SEND CONTACT EMAIL TO ADMIN
// ============================================
const sendContactEmail = async ({ name, email, phone, subject, message }) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'info@joyhomeschool.co.ke';
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0B1A4A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 20px; background: #f9f9f9; border-radius: 0 0 8px 8px; }
                .field { margin: 10px 0; padding: 10px; background: white; border-radius: 5px; border: 1px solid #eee; }
                .field strong { color: #0B1A4A; display: inline-block; width: 100px; }
                .message-box { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #E8A838; margin: 10px 0; }
                .footer { text-align: center; padding: 15px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>📩 New Enquiry</h2>
                    <p>From Joy Homeschool Website</p>
                </div>
                <div class="content">
                    <div class="field">
                        <strong>📛 Name:</strong> ${name}
                    </div>
                    <div class="field">
                        <strong>📧 Email:</strong> <a href="mailto:${email}">${email}</a>
                    </div>
                    <div class="field">
                        <strong>📱 Phone:</strong> ${phone || 'Not provided'}
                    </div>
                    <div class="field">
                        <strong>📌 Subject:</strong> ${subject}
                    </div>
                    <div class="field">
                        <strong>📅 Date:</strong> ${new Date().toLocaleString()}
                    </div>
                    <div class="message-box">
                        <strong>💬 Message:</strong>
                        <p style="margin-top: 10px; white-space: pre-wrap;">${message}</p>
                    </div>
                    <hr>
                    <p style="color: #666; font-size: 14px;">
                        ⚡ Please respond to this enquiry within 24 hours.<br>
                        📞 You can call them back at: ${phone || 'No phone provided'}
                    </p>
                    <p style="color: #0B1A4A; font-weight: bold;">
                        💡 Reply directly to: <a href="mailto:${email}">${email}</a>
                    </p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Joy Homeschool &amp; Tuition Centre</p>
                    <p>This is an automated notification from your website.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({
        to: adminEmail,
        subject: `📩 New Enquiry from Website: ${subject}`,
        html
    });
};

// ============================================
// SEND AUTO-REPLY TO USER
// ============================================
const sendAutoReply = async ({ name, email }) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0B1A4A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 20px; background: #f9f9f9; border-radius: 0 0 8px 8px; }
                .btn { display: inline-block; padding: 12px 30px; background: #E8A838; color: #0B1A4A; text-decoration: none; border-radius: 5px; font-weight: bold; }
                .footer { text-align: center; padding: 15px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>✅ Thank You for Contacting Us!</h2>
                </div>
                <div class="content">
                    <p>Dear <strong>${name}</strong>,</p>
                    <p>We have received your enquiry and will get back to you within <strong>24 hours</strong>.</p>
                    <hr>
                    <p style="text-align: center; margin: 20px 0;">
                        <a href="https://www.joyhomeschool.co.ke" class="btn">🌐 Visit Our Website</a>
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        📞 If you have any urgent questions, please call us at <strong>+254 710 692 228</strong>.
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        📧 Email us directly at: <a href="mailto:info@joyhomeschool.co.ke">info@joyhomeschool.co.ke</a>
                    </p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Joy Homeschool &amp; Tuition Centre</p>
                    <p>info@joyhomeschool.co.ke | +254 710 692 228</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({
        to: email,
        subject: '📩 We\'ve Received Your Enquiry - Joy Homeschool',
        html
    });
};

// ============================================
// SEND PASSWORD RESET EMAIL
// ============================================
const sendPasswordResetEmail = async ({ email, resetToken }) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://www.joyhomeschool.co.ke'}/reset-password.html?token=${resetToken}`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0B1A4A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 20px; background: #f9f9f9; border-radius: 0 0 8px 8px; }
                .btn { display: inline-block; padding: 12px 30px; background: #E8A838; color: #0B1A4A; text-decoration: none; border-radius: 5px; font-weight: bold; }
                .footer { text-align: center; padding: 15px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🔑 Password Reset Request</h2>
                </div>
                <div class="content">
                    <p>Hello <strong>${email}</strong>,</p>
                    <p>You requested to reset your password. Click the link below to set a new password:</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" class="btn">🔑 Reset Password</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
                        ${resetUrl}
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        ⚠️ This link will expire in <strong>1 hour</strong>.<br>
                        If you did not request this, please ignore this email.
                    </p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Joy Homeschool &amp; Tuition Centre</p>
                    <p>info@joyhomeschool.co.ke | +254 710 692 228</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({
        to: email,
        subject: '🔑 Password Reset - Joy Homeschool',
        html
    });
};

module.exports = {
    sendEmail,
    sendContactEmail,
    sendAutoReply,
    sendPasswordResetEmail
};