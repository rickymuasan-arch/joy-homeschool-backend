const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixParent() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // ============================================
        // CHANGE THESE TWO LINES TO YOUR PARENT'S INFO
        // ============================================
        const parentEmail = 'pheebsrutto@gmail.com';  // <-- CHANGE THIS
        const newPassword = 'Password123';             // <-- CHANGE THIS
        // ============================================

        const User = require('./models/User');

        const user = await User.findOne({ email: parentEmail.toLowerCase() });

        if (!user) {
            console.log('❌ User not found:', parentEmail);
            console.log('\n📋 Available parent accounts in database:');
            const all = await User.find({ role: 'parent' }, 'email fullName isApproved isRejected');
            all.forEach(u => {
                console.log(`  - ${u.email} | ${u.fullName} | Approved: ${u.isApproved} | Rejected: ${u.isRejected || false}`);
            });
            await mongoose.disconnect();
            return;
        }

        console.log('✅ Found user:', user.email);
        console.log('👤 Name:', user.fullName);
        console.log('📌 Current status - Approved:', user.isApproved, '| Rejected:', user.isRejected || false);
        console.log('');

        // Fix: Approve the parent
        user.isApproved = true;
        user.isRejected = false;
        user.rejectionReason = '';

        // Fix: Reset password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save();

        console.log('✅ PARENT FIXED SUCCESSFULLY!');
        console.log('📧 Email:', user.email);
        console.log('🔑 New Password:', newPassword);
        console.log('✅ Approved:', user.isApproved);
        console.log('❌ Rejected:', user.isRejected || false);

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.disconnect();
    }
}

fixParent();