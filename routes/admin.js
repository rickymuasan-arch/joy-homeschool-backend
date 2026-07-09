const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Admin = require('../models/Admin');
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const ReportCard = require('../models/ReportCard');
const Payment = require('../models/Payment');
const Event = require('../models/Event');

const router = express.Router();

// ===== MIDDLEWARE: Verify Admin =====
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, 'aviora_secret_key');
        if (decoded.role !== 'super_admin' && decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        req.adminId = decoded.id;
        req.adminRole = decoded.role;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// ===== GET ALL PARENTS =====
router.get('/parents', verifyAdmin, async (req, res) => {
    try {
        const parents = await Parent.find().populate('children');
        res.json(parents);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== APPROVE PARENT (SUPER ADMIN ONLY) =====
router.put('/parents/:id/approve', verifyAdmin, async (req, res) => {
    try {
        if (req.adminRole !== 'super_admin') {
            return res.status(403).json({ message: 'Only Super Admin can approve parents' });
        }

        const parent = await Parent.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
        if (!parent) {
            return res.status(404).json({ message: 'Parent not found' });
        }
        res.json({ message: 'Parent approved successfully', parent });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== GET ALL STUDENTS =====
router.get('/students', verifyAdmin, async (req, res) => {
    try {
        const students = await Student.find().populate('parentId');
        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== UPDATE STUDENT GRADE =====
router.put('/students/:id/grade', verifyAdmin, async (req, res) => {
    try {
        const { grade } = req.body;
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        student.previousGrade = student.grade;
        student.grade = grade;
        await student.save();
        res.json({ message: 'Student grade updated', student });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== CREATE ADMIN (Super Admin only) =====
router.post('/admins', verifyAdmin, async (req, res) => {
    try {
        if (req.adminRole !== 'super_admin') {
            return res.status(403).json({ message: 'Only super admin can create admins' });
        }

        const { fullName, email, password, role } = req.body;

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const adminCount = await Admin.countDocuments();
        if (adminCount >= 30) {
            return res.status(400).json({ message: 'Maximum 30 admins allowed' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new Admin({ fullName, email: email.toLowerCase(), password: hashedPassword, role: role || 'admin', isActive: true });
        await admin.save();

        res.status(201).json({ message: 'Admin created successfully', admin });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== GET ALL ADMINS =====
router.get('/admins', verifyAdmin, async (req, res) => {
    try {
        if (req.adminRole !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const admins = await Admin.find().select('-password');
        res.json(admins);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== DELETE ADMIN =====
router.delete('/admins/:id', verifyAdmin, async (req, res) => {
    try {
        if (req.adminRole !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const admin = await Admin.findById(req.params.id);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (admin._id.toString() === req.adminId) {
            return res.status(400).json({ message: 'Cannot delete yourself' });
        }

        await admin.deleteOne();
        res.json({ message: 'Admin deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== UPLOAD REPORT CARD =====
router.post('/report-cards', verifyAdmin, async (req, res) => {
    try {
        const { studentId, term, year, subjects, overallGrade, teacherRemarks, classTeacher, fileName, fileType, fileData } = req.body;

        const reportCard = new ReportCard({
            studentId,
            term,
            year,
            subjects: subjects || [],
            overallGrade,
            teacherRemarks,
            classTeacher,
            fileUrl: fileData ? `data:${fileType};base64,${fileData}` : null,
            fileName: fileName || null,
            uploadedBy: req.adminId
        });

        await reportCard.save();

        res.status(201).json({ message: 'Report card uploaded successfully', reportCard });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== GET REPORT CARDS FOR STUDENT =====
router.get('/report-cards/:studentId', verifyAdmin, async (req, res) => {
    try {
        const reportCards = await ReportCard.find({ studentId: req.params.studentId, isActive: true }).sort({ year: -1, term: -1 });
        res.json(reportCards);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// EVENTS MANAGEMENT
// ============================================

// ===== CREATE EVENT =====
router.post('/events', verifyAdmin, async (req, res) => {
    try {
        const { title, description, eventType, startDate, endDate, location, curriculum } = req.body;

        const event = new Event({
            title,
            description,
            eventType,
            startDate,
            endDate: endDate || null,
            location: location || null,
            targetCurriculum: curriculum || 'All',
            createdBy: req.adminId
        });

        await event.save();
        res.status(201).json({ message: 'Event created successfully', event });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== GET ALL EVENTS =====
router.get('/events', verifyAdmin, async (req, res) => {
    try {
        const events = await Event.find({ isActive: true }).sort({ startDate: 1 });
        res.json(events);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== DELETE EVENT =====
router.delete('/events/:id', verifyAdmin, async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// PAYMENT MANAGEMENT (SUPER ADMIN ONLY)
// ============================================

// ===== GET ALL PAYMENTS =====
router.get('/payments', verifyAdmin, async (req, res) => {
    try {
        if (req.adminRole !== 'super_admin') {
            return res.status(403).json({ message: 'Only Super Admin can view payments' });
        }

        const payments = await Payment.find()
            .populate('studentId', 'fullName')
            .populate('parentId', 'fullName')
            .sort({ paymentDate: -1 });

        res.json(payments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== APPROVE PAYMENT (SUPER ADMIN ONLY) =====
router.put('/payments/:id/approve', verifyAdmin, async (req, res) => {
    try {
        if (req.adminRole !== 'super_admin') {
            return res.status(403).json({ message: 'Only Super Admin can approve payments' });
        }

        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            { status: 'Approved', verifiedBy: req.adminId },
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json({ message: 'Payment approved successfully', payment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== REJECT PAYMENT (SUPER ADMIN ONLY) =====
router.put('/payments/:id/reject', verifyAdmin, async (req, res) => {
    try {
        if (req.adminRole !== 'super_admin') {
            return res.status(403).json({ message: 'Only Super Admin can reject payments' });
        }

        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            { status: 'Rejected', verifiedBy: req.adminId },
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json({ message: 'Payment rejected', payment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;