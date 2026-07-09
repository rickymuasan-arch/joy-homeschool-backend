const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// JOY HOMESCHOOL ROUTES
// ============================================
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const parentRoutes = require('./routes/parents');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parents', parentRoutes);

// ============================================
// MONGODB CONNECTION
// ============================================
const MONGODB_URI = 'mongodb+srv://rickymuasan_db_user:4gf7ehcX@aviora.bqkwlzz.mongodb.net/?retryWrites=true&w=majority&appName=Aviora';

// ===== CREATE FIRST ADMIN =====
const createFirstAdmin = async () => {
    try {
        const Admin = require('./models/Admin');
        const adminCount = await Admin.countDocuments();
        console.log(`📊 Admin count: ${adminCount}`);
        
        if (adminCount === 0) {
            const hashedPassword = await bcrypt.hash('12345689abcABCD', 10);
            const admin = new Admin({
                fullName: 'Ricky Muasan',
                email: 'rickymuasan@gmail.com',
                password: hashedPassword,
                role: 'super_admin',
                isActive: true
            });
            await admin.save();
            console.log('✅ First admin created successfully!');
            console.log(`📧 Email: rickymuasan@gmail.com`);
            console.log(`🔑 Password: 12345689abcABCD`);
        } else {
            console.log('✅ Admin already exists');
        }
    } catch (err) {
        console.error('❌ Error creating admin:', err.message);
    }
};

// ===== CONNECT TO MONGODB =====
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully');
        // Wait 2 seconds before creating admin
        setTimeout(() => {
            createFirstAdmin();
        }, 2000);
    })
    .catch(err => console.error('❌ MongoDB connection error:', err));

// ============================================
// EXISTING EPHORIC TECH ROUTES
// ============================================

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    projects: { type: Array, default: [] },
    invoices: { type: Array, default: [] },
    tickets: { type: Array, default: [] },
    consents: { type: Object, default: {} }
});

const User = mongoose.model('User', userSchema);

// ===== SIGNUP =====
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, phone, password, consents } = req.body;
        
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            consents,
            projects: [],
            invoices: [],
            tickets: []
        });
        
        await user.save();
        res.json({ success: true, message: 'Account created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ===== LOGIN =====
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ userId: user._id }, 'aviora_secret_key', { expiresIn: '7d' });
        
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                createdAt: user.createdAt,
                projects: user.projects,
                invoices: user.invoices,
                tickets: user.tickets
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ===== GET USER DATA =====
app.get('/api/user/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ===== UPDATE USER PROFILE =====
app.put('/api/user/:userId', async (req, res) => {
    try {
        const { name, phone, password } = req.body;
        const updateData = { name, phone };
        
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }
        
        const user = await User.findByIdAndUpdate(req.params.userId, updateData, { new: true });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ===== ADD PROJECT =====
app.post('/api/user/:userId/projects', async (req, res) => {
    try {
        const { name, status, description } = req.body;
        const user = await User.findById(req.params.userId);
        
        user.projects.push({
            id: 'PROJ-' + Date.now(),
            name,
            status,
            description,
            createdAt: new Date()
        });
        
        await user.save();
        res.json({ success: true, projects: user.projects });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ===== DELETE PROJECT =====
app.delete('/api/user/:userId/projects/:projectId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        user.projects = user.projects.filter(p => p.id !== req.params.projectId);
        await user.save();
        res.json({ success: true, projects: user.projects });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ===== ADD SUPPORT TICKET =====
app.post('/api/user/:userId/tickets', async (req, res) => {
    try {
        const { subject, message } = req.body;
        const user = await User.findById(req.params.userId);
        
        user.tickets.push({
            id: 'TKT-' + Date.now(),
            subject,
            message,
            status: 'open',
            createdAt: new Date()
        });
        
        await user.save();
        res.json({ success: true, tickets: user.tickets });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ===== TEST ROUTE =====
app.get('/', (req, res) => {
    res.json({ message: 'Ephoric Tech & Joy Homeschool API is running!' });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Aviora backend running on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}`);
});