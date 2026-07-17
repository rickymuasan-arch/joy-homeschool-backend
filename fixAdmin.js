const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function fixAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const email = 'rickymuasan@gmail.com';
        const password = 'Directormichael@2026';

        // Delete old admin
        await User.deleteMany({ email: email });
        console.log('🗑️ Deleted old admin');

        // Create new admin
        const hashedPassword = await bcrypt.hash(password, 10);
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

        // Test if password works
        const testUser = await User.findOne({ email: email });
        const testPass = await bcrypt.compare(password, testUser.password);
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

fixAdmin();