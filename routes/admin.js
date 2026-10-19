const express = require('express');
const router = express.Router();
const { authenticate, isAdmin, isSuperAdmin } = require('../middleware/auth');
const {
    // Dashboard
    getStats,
    
    // Parent management
    getParents,
    approveParent,
    rejectParent,
    deleteParent,
    deleteRejectedParent,
    
    // Student management
    getStudents,
    
    // Admin management
    getAdmins,
    createAdmin,
    deleteAdmin,
    deleteRejectedAdmin,
    
    // User management
    changeUserEmail,
    
    // Payment management
    getPayments,
    approvePayment,
    rejectPayment,
    deleteRejectedPayment,
    
    // Report Card management
    uploadReportCard,
    getReportCards,
    deleteReportCard,
    
    // Event management
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent
} = require('../controllers/adminController');

const Diary = require('../models/Diary');
const Timetable = require('../models/Timetable');
const Assignment = require('../models/Assignment');
const Student = require('../models/Student');
const User = require('../models/User');
const ReportCard = require('../models/ReportCard');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================
router.use(authenticate);
router.use(isAdmin);

// ============================================
// DASHBOARD
// ============================================
router.get('/stats', getStats);

// ============================================
// PARENT MANAGEMENT
// ============================================
router.get('/parents', getParents);
router.put('/parents/:id/approve', isSuperAdmin, approveParent);
router.put('/parents/:id/reject', isSuperAdmin, rejectParent);
router.delete('/parents/:parentId', isSuperAdmin, deleteParent);
router.delete('/parents/:parentId/rejected', isSuperAdmin, deleteRejectedParent);

// ============================================
// STUDENT MANAGEMENT
// ============================================
router.get('/students', getStudents);

// ============================================
// ADMIN MANAGEMENT (Super Admin only)
// ============================================
router.get('/admins', isSuperAdmin, getAdmins);
router.post('/admins', isSuperAdmin, createAdmin);
router.delete('/admins/:adminId', isSuperAdmin, deleteAdmin);
router.delete('/admins/:adminId/rejected', isSuperAdmin, deleteRejectedAdmin);

// ============================================
// USER MANAGEMENT (Super Admin only)
// ============================================
router.put('/users/:userId/email', isSuperAdmin, changeUserEmail);

// ============================================
// PAYMENT MANAGEMENT (Super Admin only)
// ============================================
router.get('/payments', isSuperAdmin, getPayments);
router.put('/payments/:paymentId/approve', isSuperAdmin, approvePayment);
router.put('/payments/:paymentId/reject', isSuperAdmin, rejectPayment);
router.delete('/payments/:paymentId/rejected', isSuperAdmin, deleteRejectedPayment);

// ============================================
// REPORT CARD MANAGEMENT
// ============================================
router.post('/report-cards', uploadReportCard);
router.get('/report-cards', getReportCards);
router.delete('/report-cards/:reportId', deleteReportCard);

// ADDED: Create Digital Report Card (Manual Entry)
router.post('/report-cards/digital', async (req, res) => {
    try {
        const { studentId, term, year, overallGrade, teacherRemarks, classTeacher, subjects } = req.body;
        
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const newReport = new ReportCard({
            studentId,
            studentName: student.fullName,
            parentId: student.parentId,
            term,
            year,
            overallGrade,
            teacherRemarks,
            classTeacher,
            subjects, // This will be an array of { subjectName, score }
            isDigital: true // Flag to know it's not a file
        });

        await newReport.save();
        res.status(201).json({ message: 'Digital report card created successfully', report: newReport });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ADDED: Edit Report Card
router.put('/report-cards/:id', isSuperAdmin, async (req, res) => {
    try {
        const { term, year, overallGrade, teacherRemarks, classTeacher } = req.body;
        const updated = await ReportCard.findByIdAndUpdate(req.params.id, {
            term, year, overallGrade, teacherRemarks, classTeacher
        }, { new: true });
        res.json({ message: 'Report card updated', reportCard: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ADDED: Delete Report Card (Matches frontend call)
router.delete('/report-cards/:id/delete', isSuperAdmin, async (req, res) => {
    try {
        await ReportCard.findByIdAndDelete(req.params.id);
        res.json({ message: 'Report card deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ============================================
// EVENT MANAGEMENT
// ============================================
router.get('/events', getEvents);
router.post('/events', createEvent);
router.put('/events/:eventId', updateEvent);
router.delete('/events/:eventId', deleteEvent);

// ============================================
// DIARY MANAGEMENT (ADMINS & SUPER ADMINS)
// ============================================
router.post('/diary', async (req, res) => {
    try {
        const { studentId, title, content } = req.body;
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const newDiary = new Diary({
            studentId,
            studentName: student.fullName,
            parentId: student.parentId,
            title,
            content,
            writtenBy: req.user._id,
            authorName: req.user.fullName
        });
        await newDiary.save();
        res.status(201).json({ message: 'Diary entry added', diary: newDiary });
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// Get All Diaries for Admin table
router.get('/diary', async (req, res) => {
    try {
        const diaries = await Diary.find().sort({ createdAt: -1 });
        res.json(diaries);
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// Delete Diary
router.delete('/diary/:id', isSuperAdmin, async (req, res) => {
    try {
        await Diary.findByIdAndDelete(req.params.id);
        res.json({ message: 'Diary entry deleted' });
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// Edit Diary
router.put('/diary/:id', isSuperAdmin, async (req, res) => {
    try {
        const { title, content } = req.body;
        const updated = await Diary.findByIdAndUpdate(req.params.id, { title, content }, { new: true });
        res.json({ message: 'Diary updated', diary: updated });
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// ============================================
// TIMETABLE MANAGEMENT (SUPER ADMIN ONLY)
// ============================================
// Create Timetable
router.post('/timetable', isSuperAdmin, async (req, res) => {
    try {
        const { studentId, teacherId, day, timeSlots, term, year } = req.body;
        
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const teacher = await User.findById(teacherId);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

        const newTimetable = new Timetable({
            studentId,
            studentName: student.fullName,
            parentId: student.parentId,
            teacherId,
            teacherName: teacher.fullName,
            day, timeSlots, term, year
        });
        
        await newTimetable.save();
        res.status(201).json({ message: 'Timetable created', timetable: newTimetable });
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// GET TIMETABLES (For Admin viewing & Super Admin tracking)
router.get('/timetables', async (req, res) => {
    try {
        // Super admin sees all, normal admin sees only their own assigned timetables
        const filter = req.user.role === 'super_admin' ? {} : { teacherId: req.user._id };
        const timetables = await Timetable.find(filter).sort({ createdAt: -1 });
        res.json(timetables);
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// Edit Timetable
router.put('/timetable/:id', isSuperAdmin, async (req, res) => {
    try {
        const { teacherId, day, timeSlots, term, year } = req.body;
        
        let teacherName = undefined;
        if (teacherId) {
            const teacher = await User.findById(teacherId);
            if (teacher) teacherName = teacher.fullName;
        }

        const updated = await Timetable.findByIdAndUpdate(req.params.id, {
            teacherId, teacherName, day, timeSlots, term, year
        }, { new: true });

        res.json({ message: 'Timetable updated', timetable: updated });
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// Delete Timetable
router.delete('/timetable/:id', isSuperAdmin, async (req, res) => {
    try {
        await Timetable.findByIdAndDelete(req.params.id);
        res.json({ message: 'Timetable deleted' });
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// ============================================
// ASSIGNMENT MANAGEMENT (ADMINS & SUPER ADMINS)
// ============================================
// Create Assignment
router.post('/assignment', async (req, res) => {
    try {
        const { studentId, title, description, dueDate, fileData, fileType, fileName } = req.body;
        
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const newAssignment = new Assignment({
            studentId,
            studentName: student.fullName,
            parentId: student.parentId,
            teacherId: req.user._id,
            teacherName: req.user.fullName,
            title, description, dueDate, fileData, fileType, fileName
        });
        
        await newAssignment.save();
        res.status(201).json({ message: 'Assignment created', assignment: newAssignment });
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// Get Assignments
router.get('/assignments', async (req, res) => {
    try {
        // Super admin sees all, normal admin sees only their own created assignments
        const filter = req.user.role === 'super_admin' ? {} : { teacherId: req.user._id };
        const assignments = await Assignment.find(filter).sort({ createdAt: -1 });
        res.json(assignments);
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// Grade Assignment
router.put('/assignment/:id/grade', async (req, res) => {
    try {
        const { marks, feedback } = req.body;
        const updated = await Assignment.findByIdAndUpdate(req.params.id, {
            marks, feedback, status: 'Graded'
        }, { new: true });
        res.json({ message: 'Graded successfully', assignment: updated });
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// ADDED: Edit Assignment
router.put('/assignment/:id', isSuperAdmin, async (req, res) => {
    try {
        const { title, description, dueDate } = req.body;
        const updated = await Assignment.findByIdAndUpdate(req.params.id, {
            title, description, dueDate
        }, { new: true });
        res.json({ message: 'Assignment updated', assignment: updated });
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// ADDED: Delete Assignment
router.delete('/assignment/:id', isSuperAdmin, async (req, res) => {
    try {
        await Assignment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Assignment deleted' });
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// ============================================
// EPHORIC TECH SUBSCRIPTION MONITORING
// ============================================
router.get('/ephoric/subscriptions', async (req, res) => {
    try {
        if (req.user.role !== 'ephoric_admin') return res.status(403).json({ message: 'Access denied. Ephoric Tech only.' });

        const students = await Student.find()
            .populate('parentId', 'fullName email phone')
            .sort({ createdAt: -1 });

        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/ephoric/student/:id/lock', async (req, res) => {
    try {
        if (req.user.role !== 'ephoric_admin') return res.status(403).json({ message: 'Access denied.' });
        
        const student = await Student.findByIdAndUpdate(req.params.id, { 
            subscriptionStatus: 'Inactive',
            subscriptionExpiry: null 
        }, { new: true });
        
        res.json({ message: 'Student locked successfully', student });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/ephoric/change-password', async (req, res) => {
    try {
        if (req.user.role !== 'ephoric_admin') return res.status(403).json({ message: 'Access denied.' });
        
        const { currentPassword, newPassword } = req.body;
        const admin = await Admin.findById(req.user._id);
        
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });
        
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);
        await admin.save();
        
        res.json({ message: 'Password updated successfully!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
module.exports = router;