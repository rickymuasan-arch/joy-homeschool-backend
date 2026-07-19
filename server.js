const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
    origin: ['https://joyhomeschool.co.ke', 'https://www.joyhomeschool.co.ke', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// STATIC FILES
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
// ERROR HANDLING
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
// ✅ DATABASE CONNECTION - FIXED
// ============================================
// Use MONGO_URI from environment - NO fallback to localhost
const MONGODB_URI = process.env.MONGO_URI;

console.log('🔍 Checking MongoDB connection...');

if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGO_URI environment variable is NOT set on Render!');
    console.error('💡 Please add MONGO_URI to your Render environment variables.');
    console.error('💡 It should be: mongodb+srv://rickymuasan_db_user:****@aviora.bqkwlzz.mongodb.net/joy_homeschool_portal?retryWrites=true&w=majority&appName=Aviora');
    process.exit(1);
}

// Mask password for logging
const maskedUri = MONGODB_URI.replace(/:[^:@]*@/, ':****@');
console.log('📡 Using MongoDB URI:', maskedUri);

// Connect to MongoDB Atlas
mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 60000,
    connectTimeoutMS: 60000,
    family: 4
})
.then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('💡 Please check:');
    console.error('   1. Your MONGO_URI is correct');
    console.error('   2. Your MongoDB Atlas IP whitelist includes 0.0.0.0/0');
    console.error('   3. Your MongoDB Atlas cluster is running');
    process.exit(1);
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🔗 Live URL: https://joy-homeschool-backend.onrender.com`);
});