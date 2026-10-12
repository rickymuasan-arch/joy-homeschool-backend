const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const User = require('./models/User');

        const email = 'pheebsrutto@gmail.com';
        const newPassword = 'Password123';

        const user = await User.findOne({ email: email });
        
        if (!user) {
            console.log('❌ User not found');
            await mongoose.disconnect();
            return;
        }

        console.log('✅ Found user:', user.email);
        console.log('👤 Name:', user.fullName);
        console.log('');

        // Generate salt and hash manually
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(newPassword, salt);
        
        console.log('🔑 New password:', newPassword);
        console.log('🔐 New hash:', hashedPassword);
        console.log('');

        // Update the password
        user.password = hashedPassword;
        await user.save();

        console.log('✅ Password UPDATED in database!');
        console.log('');

        // Verify by retrieving fresh from database
        const freshUser = await User.findOne({ email: email });
        const verifyMatch = bcrypt.compareSync(newPassword, freshUser.password);
        
        console.log('🔑 Verification test:', verifyMatch ? '✅ PASSED!' : '❌ FAILED!');

        if (verifyMatch) {
            console.log('✅ YOU CAN NOW LOGIN!');
            console.log('📧 Email:', email);
            console.log('🔑 Password:', newPassword);
        } else {
            console.log('❌ Still having issues. Please try creating a new parent account.');
        }

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.disconnect();
    }
}

fixPassword();