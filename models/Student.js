const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    // ✅ FIX: Reference User model instead of Parent
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // ✅ ADD: Parent details for quick access
    parentName: {
        type: String,
        required: true
    },
    parentEmail: {
        type: String,
        required: true
    },
    parentPhone: {
        type: String,
        default: ''
    },
    curriculum: {
        type: String,
        enum: ['British Primary', 'British Lower Secondary', 'IGCSE', 'A-Level', 'CBC', 'KCSE', 'Checkpoint', 'ISEB', 'Pearson Edexcel'],
        required: true
    },
    grade: {
        type: String,
        required: true,
        trim: true
    },
    subjects: {
        type: [String],
        default: []
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    previousGrade: {
        type: String,
        trim: true
    },
    school: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Index for faster queries
StudentSchema.index({ parentId: 1 });
StudentSchema.index({ fullName: 1 });

module.exports = mongoose.model('Student', StudentSchema);