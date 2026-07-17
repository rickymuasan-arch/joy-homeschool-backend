const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Direct connection to MongoDB
const User = mongoose.model('User', new mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    role: String,
    isApproved: Boolean,
    isActive: Boolean
}));

async function simpleAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const email = 'rickymuasan@gmail.com';
        const password = 'Directormichael@2026';

        // Delete old admin
        await User.deleteMany({ email: email });
        console.log('🗑️ Deleted old admin');

        // Hash password using bcrypt directly
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        console.log('🔑 Hashed password created');

        // Create new admin
        const admin = new User({
            fullName: 'Michael Onyango',
            email: email,
            password: hashedPassword,
            role: 'super_admin',
            isApproved: true,
            isActive: true
        });
        await admin.save();
        console.log('✅ Admin created!');

        // Verify
        const testUser = await User.findOne({ email: email });
        const testPass = bcrypt.compareSync(password, testUser.password);
        console.log('🔑 Password test:', testPass ? '✅ PASSED' : '❌ FAILED');

        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('✅ DONE!');

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.disconnect();
    }
}

simpleAdmin();