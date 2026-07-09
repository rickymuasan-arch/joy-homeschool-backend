const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    dateOfBirth: Date,
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true },
    curriculum: {
        type: String,
        enum: ['British Primary', 'British Lower Secondary', 'IGCSE', 'A-Level', 'CBC', 'KCSE', 'Checkpoint', 'ISEB', 'Pearson Edexcel'],
        required: true
    },
    grade: { type: String, required: true },
    subjects: [String],
    enrollmentDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    previousGrade: String,
    school: String
});

module.exports = mongoose.model('Student', StudentSchema);