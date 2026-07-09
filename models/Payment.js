const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Student', 
        required: true 
    },
    parentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Parent', 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true 
    },
    paymentDate: { 
        type: Date, 
        default: Date.now 
    },
    method: { 
        type: String, 
        enum: ['M-PESA', 'Bank Transfer', 'Cash'], 
        required: true 
    },
    reference: { 
        type: String, 
        required: true 
    },
    term: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Rejected'], 
        default: 'Pending' 
    },
    receipt: String,
    verifiedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Admin' 
    }
});

module.exports = mongoose.model('Payment', PaymentSchema);