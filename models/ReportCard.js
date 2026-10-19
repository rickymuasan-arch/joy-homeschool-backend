const mongoose = require('mongoose');

const ReportCardSchema = new mongoose.Schema({
    // Student reference
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    // Quick access fields
    studentName: {
        type: String,
        required: true
    },
    // Parent reference for access control
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parentName: {
        type: String,
        default: '' // CHANGED: No longer required to prevent 500 errors
    },
    // Report details
    term: {
        type: String,
        required: true,
        enum: ['Term 1', 'Term 2', 'Term 3']
    },
    year: {
        type: Number,
        required: true
    },
    // Subject details
    subjects: [{
        subjectName: { type: String }, // CHANGED: Matches frontend
        name: { type: String },        // KEPT: For backwards compatibility
        grade: { type: String },
        score: { type: String },       // CHANGED: String to match frontend input
        remarks: { type: String }
    }],
    overallGrade: {
        type: String,
        default: ''
    },
    teacherRemarks: {
        type: String,
        default: ''
    },
    classTeacher: {
        type: String,
        default: ''
    },
    // File storage
    fileUrl: {
        type: String,
        default: ''
    },
    fileData: {
        type: String,
        default: null
    },
    fileType: {
        type: String,
        default: null
    },
    fileName: {
        type: String,
        default: null
    },
    // Flag for Digital vs Uploaded
    isDigital: {
        type: Boolean,
        default: false
    },
    // Upload info
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for faster queries
ReportCardSchema.index({ studentId: 1 });
ReportCardSchema.index({ parentId: 1 });
ReportCardSchema.index({ year: 1, term: 1 });
ReportCardSchema.index({ isActive: 1 });

module.exports = mongoose.model('ReportCard', ReportCardSchema);