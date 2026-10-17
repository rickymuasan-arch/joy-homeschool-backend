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
const Student = require('../models/Student');

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

// ============================================
// TIMETABLE MANAGEMENT (SUPER ADMIN ONLY)
// ============================================
router.post('/timetable', isSuperAdmin, async (req, res) => {
    try {
        const { curriculum, grade, day, timeSlots, term, year } = req.body;
        
        const newTimetable = new Timetable({
            curriculum, 
            grade, 
            day, 
            timeSlots, 
            term, 
            year, 
            createdBy: req.user._id
        });
        
        await newTimetable.save();
        res.status(201).json({ message: 'Timetable created', timetable: newTimetable });
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

router.delete('/timetable/:id', isSuperAdmin, async (req, res) => {
    try {
        await Timetable.findByIdAndDelete(req.params.id);
        res.json({ message: 'Timetable deleted' });
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

module.exports = router;