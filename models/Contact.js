const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    phone: {
        type: String,
        trim: true,
        default: '',
        maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
        maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        maxlength: [5000, 'Message cannot exceed 5000 characters']
    },
    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'closed'],
        default: 'new'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// ============================================
// INDEXES FOR FASTER QUERIES
// ============================================
ContactSchema.index({ email: 1 });
ContactSchema.index({ status: 1 });
ContactSchema.index({ createdAt: -1 });
ContactSchema.index({ isActive: 1 });

// ============================================
// PRE-SAVE HOOK: Update updatedAt
// ============================================
ContactSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// ============================================
// VIRTUAL: Get formatted date
// ============================================
ContactSchema.virtual('formattedDate').get(function() {
    return this.createdAt ? this.createdAt.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : '';
});

// ============================================
// METHOD: Mark as read
// ============================================
ContactSchema.methods.markAsRead = function() {
    this.status = 'read';
    this.updatedAt = new Date();
    return this.save();
};

// ============================================
// METHOD: Mark as replied
// ============================================
ContactSchema.methods.markAsReplied = function() {
    this.status = 'replied';
    this.updatedAt = new Date();
    return this.save();
};

// ============================================
// METHOD: Mark as closed
// ============================================
ContactSchema.methods.markAsClosed = function() {
    this.status = 'closed';
    this.updatedAt = new Date();
    return this.save();
};

// ============================================
// STATIC: Get new enquiries count
// ============================================
ContactSchema.statics.getNewCount = function() {
    return this.countDocuments({ status: 'new', isActive: true });
};

// ============================================
// STATIC: Get total enquiries
// ============================================
ContactSchema.statics.getTotalCount = function() {
    return this.countDocuments({ isActive: true });
};

module.exports = mongoose.model('Contact', ContactSchema);