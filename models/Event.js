const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    eventType: {
        type: String,
        enum: ['Exam', 'Holiday', 'Sports', 'Meeting', 'Field Trip', 'Celebration', 'Other'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        default: null
    },
    location: {
        type: String,
        default: '',
        trim: true
    },
    targetCurriculum: {
        type: String,
        enum: ['All', 'IGCSE', 'A-Level', 'CBC', 'British Primary', 'British Lower Secondary', 'KCSE'],
        default: 'All'
    },
    // ✅ FIX: Reference User instead of Admin
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
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
EventSchema.index({ startDate: 1 });
EventSchema.index({ eventType: 1 });
EventSchema.index({ isActive: 1 });
EventSchema.index({ targetCurriculum: 1 });

module.exports = mongoose.model('Event', EventSchema);