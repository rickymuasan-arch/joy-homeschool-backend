const mongoose = require('mongoose');

const FeeStructureSchema = new mongoose.Schema({
    curriculum: { type: String, required: true },
    grade: { type: String, required: true },
    term: { type: String, required: true },
    tuitionFee: { type: Number, required: true },
    registrationFee: Number,
    materialsFee: Number,
    otherFees: [{ name: String, amount: Number }],
    totalAmount: { type: Number, required: true },
    validFrom: Date,
    validTo: Date,
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
});

module.exports = mongoose.model('FeeStructure', FeeStructureSchema);