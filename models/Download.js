const mongoose = require('mongoose');

const DownloadSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    category: {
        type: String,
        enum: ['Past Papers', 'Revision Materials', 'Forms', 'Syllabi', 'Fee Structure', 'Calendar'],
        required: true
    },
    curriculum: {
        type: String,
        enum: ['British Primary', 'British Lower Secondary', 'IGCSE', 'A-Level', 'CBC', 'KCSE', 'Checkpoint', 'ISEB', 'Pearson Edexcel', 'All']
    },
    fileUrl: { type: String, required: true },
    fileSize: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    uploadDate: { type: Date, default: Date.now },
    downloads: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Download', DownloadSchema);