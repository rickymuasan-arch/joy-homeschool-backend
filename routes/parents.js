const express = require('express');
const jwt = require('jsonwebtoken');

const Parent = require('../models/Parent');
const Student = require('../models/Student');
const ReportCard = require('../models/ReportCard');
const Payment = require('../models/Payment');
const Download = require('../models/Download');
const Event = require('../models/Event');
const FeeStructure = require('../models/FeeStructure');

const router = express.Router();

// ============================================
// MIDDLEWARE: Verify Parent
// ============================================
const verifyParent = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, 'aviora_secret_key');
        if (decoded.role !== 'parent') {
            return res.status(403).json({ message: 'Access denied' });
        }
        req.parentId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// ============================================
// GET PARENT PROFILE
// ============================================
router.get('/profile', verifyParent, async (req, res) => {
    try {
        const parent = await Parent.findById(req.parentId).populate('children');
        if (!parent) {
            return res.status(404).json({ message: 'Parent not found' });
        }
        res.json(parent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// GET PARENT'S CHILDREN
// ============================================
router.get('/children', verifyParent, async (req, res) => {
    try {
        const parent = await Parent.findById(req.parentId).populate('children');
        if (!parent) {
            return res.status(404).json({ message: 'Parent not found' });
        }
        res.json(parent.children);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// ADD CHILD (PARENT)
// ============================================
router.post('/add-child', verifyParent, async (req, res) => {
    try {
        const { name, dob, curriculum, grade } = req.body;

        if (!name || !dob || !curriculum || !grade) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const parent = await Parent.findById(req.parentId);
        if (!parent) {
            return res.status(404).json({ message: 'Parent not found' });
        }

        const student = new Student({
            fullName: name,
            dateOfBirth: dob,
            parentId: parent._id,
            curriculum,
            grade,
            isActive: true
        });

        await student.save();

        parent.children.push(student._id);
        await parent.save();

        res.status(201).json({ message: 'Child added successfully', child: student });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// GET CHILD'S REPORT CARDS
// ============================================
router.get('/child-reports/:studentId', verifyParent, async (req, res) => {
    try {
        const { studentId } = req.params;

        const parent = await Parent.findById(req.parentId);
        if (!parent.children.includes(studentId)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const reportCards = await ReportCard.find({ studentId, isActive: true }).sort({ year: -1, term: -1 });
        res.json(reportCards);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// GET PAYMENTS FOR CHILD
// ============================================
router.get('/child-payments/:studentId', verifyParent, async (req, res) => {
    try {
        const { studentId } = req.params;

        const parent = await Parent.findById(req.parentId);
        if (!parent.children.includes(studentId)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const payments = await Payment.find({ studentId, parentId: req.parentId }).sort({ paymentDate: -1 });
        res.json(payments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// SUBMIT PAYMENT (PARENT)
// ============================================
router.post('/submit-payment', verifyParent, async (req, res) => {
    try {
        const { childId, amount, term, method, reference } = req.body;

        // Validate
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

        // Verify child belongs to this parent
        const parent = await Parent.findById(req.parentId);
        if (!parent) {
            return res.status(404).json({ message: 'Parent not found' });
        }

        if (!parent.children.includes(childId)) {
            return res.status(403).json({ message: 'This child does not belong to you' });
        }

        // Check if student exists
        const student = await Student.findById(childId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Create payment record
        const payment = new Payment({
            studentId: childId,
            parentId: req.parentId,
            amount: amount,
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
router.get('/payment-history', verifyParent, async (req, res) => {
    try {
        const payments = await Payment.find({ parentId: req.parentId })
            .populate('studentId', 'fullName')
            .sort({ paymentDate: -1 });

        res.json(payments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// DOWNLOAD REPORT CARD
// ============================================
router.get('/download-report/:reportId', verifyParent, async (req, res) => {
    try {
        const report = await ReportCard.findById(req.params.reportId);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Verify the student belongs to this parent
        const parent = await Parent.findById(req.parentId);
        if (!parent.children.includes(report.studentId.toString())) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Return the file data
        res.json({
            fileUrl: report.fileUrl,
            fileName: report.fileName || 'report-card.pdf',
            term: report.term,
            year: report.year,
            overallGrade: report.overallGrade,
            teacherRemarks: report.teacherRemarks
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// GET DOWNLOADS
// ============================================
router.get('/downloads', verifyParent, async (req, res) => {
    try {
        const downloads = await Download.find({ isActive: true }).sort({ uploadDate: -1 });
        res.json(downloads);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// GET EVENTS (FILTERED BY PARENT'S CHILDREN CURRICULUM)
// ============================================
router.get('/events', verifyParent, async (req, res) => {
    try {
        const parent = await Parent.findById(req.parentId).populate('children');
        if (!parent) {
            return res.status(404).json({ message: 'Parent not found' });
        }

        const curricula = parent.children.map(child => child.curriculum);
        const uniqueCurricula = [...new Set(curricula)];

        const events = await Event.find({
            isActive: true,
            startDate: { $gte: new Date() },
            $or: [
                { targetCurriculum: 'All' },
                { targetCurriculum: { $in: uniqueCurricula } }
            ]
        }).sort({ startDate: 1 });

        res.json(events);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// GET FEE STRUCTURE
// ============================================
router.get('/fee-structure', verifyParent, async (req, res) => {
    try {
        const feeStructures = await FeeStructure.find({ isActive: true });
        res.json(feeStructures);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;