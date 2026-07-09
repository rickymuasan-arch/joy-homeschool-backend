const mongoose = require('mongoose');

const ParentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    address: String,
    registrationDate: { type: Date, default: Date.now },
    lastLogin: Date
});

module.exports = mongoose.model('Parent', ParentSchema);