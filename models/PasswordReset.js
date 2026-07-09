const mongoose = require('mongoose');

const PasswordResetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userType' },
    userType: { type: String, enum: ['Parent', 'Student', 'Admin'], required: true },
    email: { type: String, required: true },
    resetToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PasswordReset', PasswordResetSchema);