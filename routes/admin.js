const express = require('express');
const router = express.Router();
const { authenticate, isAdmin, isSuperAdmin } = require('../middleware/auth');
const {
    // Parent management
    getParents,
    approveParent,
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
    updateEvent,   // ← Make sure this is here!
    deleteEvent
} = require('../controllers/adminController');

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================
router.use(authenticate);
router.use(isAdmin);

// ============================================
// PARENT MANAGEMENT
// ============================================
router.get('/parents', getParents);
router.put('/parents/:id/approve', isSuperAdmin, approveParent);
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
// USER MANAGEMENT
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
router.put('/events/:eventId', updateEvent);   // ← Line 83
router.delete('/events/:eventId', deleteEvent);

module.exports = router;