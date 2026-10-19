const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin'); // 1. ADDED: Need Admin model

const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 2. ADDED: Check Admin collection first (for Ephoric), then User collection
        let user = await Admin.findById(decoded.id);
        if (!user) {
            user = await User.findById(decoded.id);
        }

        if (!user) {
            return res.status(401).json({ message: 'Token is not valid' });
        }
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const isAdmin = (req, res, next) => {
    // 3. ADDED: Allow ephoric_admin to pass this check
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.role !== 'ephoric_admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
};

const isSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Access denied. Super Admin only.' });
    }
    next();
};

const isParent = (req, res, next) => {
    if (req.user.role !== 'parent') {
        return res.status(403).json({ message: 'Access denied. Parent only.' });
    }
    next();
};

module.exports = { authenticate, isAdmin, isSuperAdmin, isParent };