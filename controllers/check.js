const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Your MongoDB connection from .env file
const MONGODB_URI = process.env.MONGODB_URI;

// CHANGE THIS to the parent email you're trying to login with
const EMAIL = 'parent@email.com';

async function check() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB\n');

        // Get User model
        const User = require('./models/User');

        // Find the user
        const user = await User.findOne({ email: EMAIL.toLowerCase() });

        if (!user) {
            console.log('❌ User not found with email:', EMAIL);
            console.log('\nAll users in database:');
            const all = await User.find({}, 'email fullName role');
            all.forEach(u => console.log('  -', u.email, '(', u.fullName, ')'));
            return;
        }

        console.log('✅ User FOUND!');
        console.log('Email:', user.email);
        console.log('Name:', user.fullName);
        console.log('Role:', user.role);
        console.log('Approved?', user.isApproved);
        console.log('Rejected?', user.isRejected || false);
        console.log('Active?', user.isActive);
        console.log('Password hash length:', user.password ? user.password.length : 0);
        console.log('Password starts with:', user.password ? user.password.substring(0, 10) : 'NO PASSWORD');

        // Check if password is hashed correctly
        if (user.password && user.password.startsWith('$2a$')) {
            console.log('✅ Password is hashed correctly');
        } else {
            console.log('❌ PROBLEM: Password is NOT hashed!');
        }

        // Fix the user if needed
        if (!user.isApproved) {
            console.log('\n🔧 FIXING: Approving user...');
            user.isApproved = true;
            await user.save();
            console.log('✅ User approved!');
        }

        if (!user.password || !user.password.startsWith('$2a$')) {
            console.log('\n🔧 FIXING: Resetting password...');
            const hashed = await bcrypt.hash('Password123', 10);
            user.password = hashed;
            await user.save();
            console.log('✅ Password reset to: Password123');
        }

        console.log('\n✨ Done! Try logging in now.');

    } catch (err) {
        console.error('Error:', err.message);
        console.log('\nMake sure:');
        console.log('1. MONGODB_URI is in .env file');
        console.log('2. You ran "npm install mongoose bcryptjs dotenv"');
    } finally {
        await mongoose.disconnect();
    }
}

check();