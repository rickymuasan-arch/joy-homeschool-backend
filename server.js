require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();

// ============================================
// ✅ SECURITY: Helmet for security headers
// ============================================
app.use(helmet());

// ============================================
// ✅ FIXED: CORS - Allow Netlify and Render
// ============================================
const allowedOrigins = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:5002',
    'https://joyhomeschool.netlify.app',
    'https://www.joyhomeschool.netlify.app',
    'https://joy-homeschool.netlify.app',
    'https://www.joyhomeschool.co.ke',
    'https://joyhomeschool.co.ke'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('❌ Blocked CORS from:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================
// ✅ SECURITY: Rate Limiting
// ============================================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
    skipSuccessfulRequests: true,
});

const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: { message: 'Too many requests. Please slow down.' },
});

app.use(generalLimiter);

// ============================================
// JOY HOMESCHOOL ROUTES
// ============================================
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const parentRoutes = require('./routes/parents');

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/admin-login', loginLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parents', parentRoutes);

// ============================================
// MONGODB CONNECTION
// ============================================
const MONGODB_URI = process.env.MONGODB_URI;

// ===== CREATE FIRST ADMIN =====
const createFirstAdmin = async () => {
    try {
        const Admin = require('./models/Admin');
        const adminCount = await Admin.countDocuments();
        
        if (adminCount === 0) {
            const adminEmail = process.env.ADMIN_EMAIL || 'info@joyhomeschool.co.ke';
            const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
            
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const admin = new Admin({
                fullName: 'Michael Onyango',
                email: adminEmail,
                password: hashedPassword,
                role: 'super_admin',
                isActive: true
            });
            await admin.save();
            console.log('✅ First admin created successfully!');
            console.log('📧 Email:', adminEmail);
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
        createFirstAdmin();
    })
    .catch(err => console.error('❌ MongoDB connection error:', err));

// ============================================
// EXISTING EPHORIC TECH ROUTES
// ============================================
const User = require('./models/User');

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
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your-super-secret-key', { expiresIn: '7d' });
        
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

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// ===== TEST ROUTE =====
app.get('/', (req, res) => {
    res.json({ message: 'Ephoric Tech & Joy Homeschool API is running!' });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});