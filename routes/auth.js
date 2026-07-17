const express = require('express');
const router = express.Router();
const {
    register,
    login,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

// ============================================
// PUBLIC ROUTES
// ============================================

// Register a new parent (public)
router.post('/register', register);

// Login for ALL users (parent, admin, superadmin)
// Parent login will check if parent is approved
router.post('/login', login);

// Forgot password
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password', resetPassword);

module.exports = router;