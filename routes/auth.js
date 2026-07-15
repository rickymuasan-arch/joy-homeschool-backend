const express = require('express');
const router = express.Router();
const {
    register,
    login,
    adminLogin,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;