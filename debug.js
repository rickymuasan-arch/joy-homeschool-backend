const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugLogin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const testEmail = 'parent@email.com';
        const testPassword = 'Password123';

        const User = require('./models/User');
        const user = await User.findOne({ email: testEmail.toLowerCase() });

        if (!user) {
            console.log('User NOT found with email:', testEmail);
            console.log('All users in database:');
            const all = await User.find({}, 'email fullName role isApproved isRejected');
            all.forEach(u => {
                console.log('  - ' + u.email + ' | ' + u.fullName + ' | Role: ' + u.role + ' | Approved: ' + u.isApproved + ' | Rejected: ' + (u.isRejected || false));
            });
            await mongoose.disconnect();
            return;
        }

        console.log('User FOUND!');
        console.log('Email:', user.email);
        console.log('Name:', user.fullName);
        console.log('Role:', user.role);
        console.log('Approved?', user.isApproved);
        console.log('Rejected?', user.isRejected || false);
        console.log('Active?', user.isActive);

        const passwordMatch = await bcrypt.compare(testPassword, user.password);
        console.log('Password match?', passwordMatch ? 'YES' : 'NO');

        if (!passwordMatch) {
            console.log('Password does NOT match!');
        }

        if (!user.isApproved && user.role === 'parent') {
            console.log('Parent is NOT approved!');
        }

        if (user.isRejected) {
            console.log('Parent is REJECTED!');
        }

        if (user.isApproved && user.role === 'parent') {
            console.log('Parent is APPROVED! You should be able to login.');
        }

        await mongoose.disconnect();

    } catch (error) {
        console.error('Error:', error.message);
        await mongoose.disconnect();
    }
}

debugLogin();