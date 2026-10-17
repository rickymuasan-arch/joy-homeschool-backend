const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
    curriculum: { type: String, required: true }, // e.g. "British Lower Secondary"
    grade: { type: String, required: true },      // e.g. "1"
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required: true },
    timeSlots: [{ 
        startTime: String, 
        endTime: String, 
        subject: String, 
        teacher: String, 
        room: String 
    }],
    term: String,
    year: Number,
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Timetable', TimetableSchema);