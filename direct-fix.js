const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function directFix() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get the User model
        const User = require('./models/User');

        const email = 'pheebsrutto@gmail.com';
        const newPassword = 'Password123';

        // Find the user
        let user = await User.findOne({ email: email });
        
        if (!user) {
            console.log('❌ User not found');
            await mongoose.disconnect();
            return;
        }

        console.log('✅ Found user:', user.email);
        console.log('');

        // ✅ DIRECT UPDATE - Bypass the pre-save hook
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(newPassword, salt);
        
        // ✅ Use findOneAndUpdate to bypass pre-save hooks
        const updated = await User.findOneAndUpdate(
            { email: email },
            { $set: { password: hashedPassword } },
            { new: true }
        );

        console.log('✅ Password DIRECTLY UPDATED in database!');
        console.log('🔑 New password:', newPassword);
        console.log('🔐 New hash:', updated.password);
        console.log('');

        // Verify
        const verifyMatch = bcrypt.compareSync(newPassword, updated.password);
        console.log('🔑 Verification test:', verifyMatch ? '✅ PASSED!' : '❌ FAILED!');

        if (verifyMatch) {
            console.log('\n✅ SUCCESS! You can now login with:');
            console.log('📧 Email:', email);
            console.log('🔑 Password:', newPassword);
        } else {
            console.log('\n❌ Still failing. Let\'s try creating a new parent account.');
            console.log('Run: node create-test-parent.js');
        }

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.disconnect();
    }
}

directFix();