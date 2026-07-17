const mongoose = require('mongoose');

const ReportCardSchema = new mongoose.Schema({
    // Student reference
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    // ✅ ADD: Quick access fields
    studentName: {
        type: String,
        required: true
    },
    // ✅ ADD: Parent reference for access control
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parentName: {
        type: String,
        required: true
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
        name: { type: String, required: true },
        grade: { type: String },
        score: { type: Number },
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
    // ✅ ADD: For storing file content
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