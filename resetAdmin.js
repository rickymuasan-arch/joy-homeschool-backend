const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function resetAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const adminEmail = 'rickymuasan@gmail.com';
        const adminPassword = 'Directormichael@2026';

        // Delete existing admin
        await User.deleteOne({ email: adminEmail });
        console.log('🗑️ Deleted existing admin');

        // Create new admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);
        
        const admin = new User({
            fullName: 'Michael Onyango',
            email: adminEmail,
            password: hashedPassword,
            role: 'super_admin',
            isApproved: true,
            isActive: true
        });
        await admin.save();
        console.log('✅ Admin created with password: Directormichael@2026');

        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Password: ${adminPassword}`);
        console.log('✅ Done!');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        await mongoose.disconnect();
    }
}

resetAdmin();