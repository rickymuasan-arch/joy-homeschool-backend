const mongoose = require('mongoose');

const ReportCardSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    term: { type: String, required: true },
    year: { type: Number, required: true },
    subjects: [{ name: String, grade: String, score: Number, remarks: String }],
    overallGrade: String,
    teacherRemarks: String,
    classTeacher: String,
    fileUrl: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    uploadDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('ReportCard', ReportCardSchema);