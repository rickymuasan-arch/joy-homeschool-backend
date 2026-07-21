const express = require('express');
const router = express.Router();
const { authenticate, isParent } = require('../middleware/auth');
const Student = require('../models/Student');
const ReportCard = require('../models/ReportCard');
const Payment = require('../models/Payment');
const Event = require('../models/Event');
const User = require('../models/User');

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================
router.use(authenticate);
router.use(isParent);

// ============================================
// GET PARENT PROFILE
// ============================================
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// GET PARENT'S CHILDREN
// ============================================
router.get('/children', async (req, res) => {
    try {
        const children = await Student.find({ parentId: req.user._id });
        res.json(children);
    } catch (err) {
        console.error('Get children error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// ADD CHILD (PARENT)
// ============================================
router.post('/add-child', async (req, res) => {
    try {
        const { name, dob, curriculum, grade } = req.body;

        if (!name || !dob || !curriculum || !grade) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const student = new Student({
            fullName: name,
            dateOfBirth: dob,
            parentId: req.user._id,
            parentName: req.user.fullName,
            parentEmail: req.user.email,
            parentPhone: req.user.phone || '',
            curriculum: curriculum,
            grade: grade,
            isActive: true
        });

        await student.save();

        res.status(201).json({
            message: 'Child added successfully',
            child: student
        });
    } catch (err) {
        console.error('Add child error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// GET CHILD'S REPORT CARDS
// ============================================
router.get('/child-reports/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findOne({ _id: studentId, parentId: req.user._id });
        if (!student) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const reportCards = await ReportCard.find({ 
            studentId: studentId,
            isActive: true 
        }).sort({ year: -1, term: -1 });

        res.json(reportCards);
    } catch (err) {
        console.error('Get child reports error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// GET ALL REPORT CARDS FOR PARENT
// ============================================
router.get('/report-cards', async (req, res) => {
    try {
        const reportCards = await ReportCard.find({ 
            parentId: req.user._id 
        }).sort({ createdAt: -1 });

        res.json(reportCards);
    } catch (err) {
        console.error('Get report cards error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// GET PAYMENTS FOR CHILD
// ============================================
router.get('/child-payments/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findOne({ _id: studentId, parentId: req.user._id });
        if (!student) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const payments = await Payment.find({ 
            studentId: studentId, 
            parentId: req.user._id 
        }).sort({ paymentDate: -1 });

        res.json(payments);
    } catch (err) {
        console.error('Get child payments error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// SUBMIT PAYMENT (PARENT)
// ============================================
router.post('/submit-payment', async (req, res) => {
    try {
        const { childId, amount, term, method, reference } = req.body;

        if (!childId) {
            return res.status(400).json({ message: 'Child ID is required' });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Please enter a valid amount' });
        }
        if (!term) {
            return res.status(400).json({ message: 'Term is required' });
        }
        if (!method) {
            return res.status(400).json({ message: 'Payment method is required' });
        }
        if (!reference || reference.trim().length < 3) {
            return res.status(400).json({ message: 'Please enter a valid payment reference (min 3 characters)' });
        }

        const student = await Student.findOne({ _id: childId, parentId: req.user._id });
        if (!student) {
            return res.status(403).json({ message: 'This child does not belong to you' });
        }

        const payment = new Payment({
            studentId: childId,
            parentId: req.user._id,
            parentName: req.user.fullName,
            studentName: student.fullName,
            amount: parseInt(amount),
            term: term,
            method: method,
            reference: reference.trim(),
            status: 'Pending',
            paymentDate: new Date()
        });

        await payment.save();

        console.log(`💰 Payment submitted: ${student.fullName} - Ksh ${amount} - ${term}`);

        res.status(201).json({
            message: 'Payment submitted successfully! Awaiting admin approval.',
            payment: {
                id: payment._id,
                amount: payment.amount,
                term: payment.term,
                method: payment.method,
                reference: payment.reference,
                status: payment.status,
                date: payment.paymentDate
            }
        });
    } catch (err) {
        console.error('❌ Error submitting payment:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// ============================================
// GET PAYMENT HISTORY (PARENT)
// ============================================
router.get('/payment-history', async (req, res) => {
    try {
        const payments = await Payment.find({ parentId: req.user._id })
            .populate('studentId', 'fullName')
            .sort({ paymentDate: -1 });

        res.json(payments);
    } catch (err) {
        console.error('Get payment history error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// DOWNLOAD REPORT CARD
// ============================================
router.get('/download-report/:reportId', async (req, res) => {
    try {
        const report = await ReportCard.findById(req.params.reportId);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const student = await Student.findOne({ 
            _id: report.studentId, 
            parentId: req.user._id 
        });
        if (!student) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({
            fileUrl: report.fileUrl,
            fileName: report.fileName || 'report-card.pdf',
            term: report.term,
            year: report.year,
            overallGrade: report.overallGrade,
            teacherRemarks: report.teacherRemarks
        });
    } catch (err) {
        console.error('Download report error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// GET EVENTS
// ============================================
router.get('/events', async (req, res) => {
    try {
        const children = await Student.find({ parentId: req.user._id });
        
        const curricula = children.map(child => child.curriculum);
        const uniqueCurricula = [...new Set(curricula)];

        const events = await Event.find({
            isActive: true,
            startDate: { $gte: new Date() },
            $or: [
                { curriculum: 'All' },
                { curriculum: { $in: uniqueCurricula } }
            ]
        }).sort({ startDate: 1 });

        res.json(events);
    } catch (err) {
        console.error('Get events error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;