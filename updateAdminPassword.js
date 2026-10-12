const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');  // ✅ Changed from User to Admin
require('dotenv').config();

async function updateAdminPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const adminEmail = 'rickymuasan@gmail.com';
        const adminPassword = 'Directormichael@2026';

        // Find the admin
        const admin = await Admin.findOne({ email: adminEmail });  // ✅ Changed from User to Admin

        if (!admin) {
            console.log('❌ Admin not found!');
            console.log('💡 Make sure you have an admin in the Admin collection');
            await mongoose.disconnect();
            return;
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Update the password
        admin.password = hashedPassword;
        await admin.save();

        console.log('✅ Admin password updated successfully!');
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 New Password: ${adminPassword}`);
        console.log('✅ Done!');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.disconnect();
    }
}

updateAdminPassword();