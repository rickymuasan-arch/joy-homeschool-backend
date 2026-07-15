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
    updateEvent,
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
// Get all parents
router.get('/parents', getParents);

// Approve a parent (Super Admin only)
router.put('/parents/:id/approve', isSuperAdmin, approveParent);

// Delete rejected parent (Super Admin only)
router.delete('/parents/:parentId/rejected', isSuperAdmin, deleteRejectedParent);

// ============================================
// STUDENT MANAGEMENT
// ============================================
// Get all students
router.get('/students', getStudents);

// ============================================
// ADMIN MANAGEMENT (Super Admin only)
// ============================================
// Get all admins
router.get('/admins', isSuperAdmin, getAdmins);

// Create a new admin
router.post('/admins', isSuperAdmin, createAdmin);

// Delete an admin
router.delete('/admins/:adminId', isSuperAdmin, deleteAdmin);

// Delete rejected/inactive admin
router.delete('/admins/:adminId/rejected', isSuperAdmin, deleteRejectedAdmin);

// ============================================
// USER MANAGEMENT
// ============================================
// Change user email (Super Admin only)
router.put('/users/:userId/email', isSuperAdmin, changeUserEmail);

// ============================================
// PAYMENT MANAGEMENT (Super Admin only)
// ============================================
// Get all payments
router.get('/payments', isSuperAdmin, getPayments);

// Approve a payment
router.put('/payments/:paymentId/approve', isSuperAdmin, approvePayment);

// Reject a payment
router.put('/payments/:paymentId/reject', isSuperAdmin, rejectPayment);

// Delete rejected payment
router.delete('/payments/:paymentId/rejected', isSuperAdmin, deleteRejectedPayment);

// ============================================
// REPORT CARD MANAGEMENT
// ============================================
// Upload report card
router.post('/report-cards', uploadReportCard);

// Get all report cards
router.get('/report-cards', getReportCards);

// Delete report card
router.delete('/report-cards/:reportId', deleteReportCard);

// ============================================
// EVENT MANAGEMENT
// ============================================
// Get all events
router.get('/events', getEvents);

// Create event
router.post('/events', createEvent);

// Update event
router.put('/events/:eventId', updateEvent);

// Delete event
router.delete('/events/:eventId', deleteEvent);

module.exports = router;