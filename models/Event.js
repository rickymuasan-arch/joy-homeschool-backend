const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    eventType: {
        type: String,
        enum: ['Exam', 'Holiday', 'Sports', 'Meeting', 'Field Trip', 'Celebration', 'Other'],
        required: true
    },
    startDate: { type: Date, required: true },
    endDate: Date,
    location: String,
    targetCurriculum: {
        type: String,
        enum: ['All', 'IGCSE', 'A-Level', 'CBC', 'British Primary', 'British Lower Secondary', 'KCSE'],
        default: 'All'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    createdAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Event', EventSchema);