const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    // ✅ FIX: Reference User model instead of Parent
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // ✅ ADD: Quick access fields
    parentName: {
        type: String,
        required: true
    },
    studentName: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    method: {
        type: String,
        enum: ['M-PESA', 'Bank Transfer', 'Cash'],
        required: true
    },
    reference: {
        type: String,
        required: true,
        trim: true
    },
    term: {
        type: String,
        required: true,
        enum: ['Term 1', 'Term 2', 'Term 3', 'Other']
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    receipt: {
        type: String,
        default: ''
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for faster queries
PaymentSchema.index({ parentId: 1 });
PaymentSchema.index({ studentId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);