const mongoose = require('mongoose');

const DiarySchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    title: { type: String, required: true },
    content: { type: String, required: true },
    writtenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Diary', DiarySchema);