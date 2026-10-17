const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacherName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    
    // The file the Admin gives
    fileData: { type: String },
    fileType: { type: String },
    fileName: { type: String },

    // The file the Parent submits back
    submissionData: { type: String, default: null },
    submissionType: { type: String, default: null },
    submissionName: { type: String, default: null },
    submittedAt: { type: Date, default: null },

    // Grading
    status: { type: String, enum: ['Pending', 'Submitted', 'Graded'], default: 'Pending' },
    marks: { type: String, default: null },
    feedback: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);