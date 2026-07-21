const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function testLogin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to DB\n');

        const User = require('./models/User');

        // Test with the user that EXISTS in your database
        const email = 'phoeberutto669@gmail.com';
        const password = 'Test@1234';

        console.log('🔍 Testing login for:', email);
        console.log('📌 Password provided:', password);

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log('❌ User not found!');
            console.log('\n📋 ALL USERS IN DATABASE:');
            const all = await User.find({}, 'email fullName role isApproved');
            all.forEach(u => {
                console.log(`  - ${u.email} (${u.fullName}) - ${u.role} - Approved: ${u.isApproved}`);
            });
            return;
        }

        console.log('\n📋 USER FOUND:');
        console.log('Email:', user.email);
        console.log('Name:', user.fullName);
        console.log('Role:', user.role);
        console.log('isApproved:', user.isApproved);
        console.log('isRejected:', user.isRejected || false);
        console.log('isActive:', user.isActive);
        console.log('Password hash length:', user.password ? user.password.length : 0);

        console.log('\n🔑 Testing password...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', isMatch);

        if (isMatch) {
            console.log('✅ PASSWORDS MATCH! Login should work.');
            console.log('\n🔐 Try logging in with:');
            console.log('Email:', email);
            console.log('Password:', password);
        } else {
            console.log('❌ PASSWORDS DO NOT MATCH!');
            console.log('\n🔧 Resetting password to: Password123');
            
            const hashedPassword = await bcrypt.hash('Password123', 10);
            user.password = hashedPassword;
            await user.save();
            
            console.log('✅ Password reset! Try logging in with:');
            console.log('Email:', email);
            console.log('Password: Password123');
        }

    } catch (err) {
        console.error('❌ ERROR:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔒 Disconnected');
    }
}

testLogin();