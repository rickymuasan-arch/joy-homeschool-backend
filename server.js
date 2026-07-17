const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// STATIC FILES - Serve uploaded files
// ============================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// ROUTE IMPORTS
// ============================================
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const parentRoutes = require('./routes/parents');
const contactRoutes = require('./routes/contactRoutes');

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/contact', contactRoutes);

// ============================================
// TEST ROUTE
// ============================================
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is running!' });
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// ============================================
// DATABASE CONNECTION
// ============================================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/joyhomeschool')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
});