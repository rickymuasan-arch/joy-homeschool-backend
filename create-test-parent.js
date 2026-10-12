const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestParent() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const User = require('./models/User');
        const Student = require('./models/Student');

        const email = 'testparent@email.com';
        const password = 'TestPassword123';

        await User.deleteMany({ email: email });
        console.log('Deleted existing user if any');

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            fullName: 'Test Parent',
            email: email,
            password: hashedPassword,
            phone: '0712345678',
            role: 'parent',
            isApproved: true,
            isRejected: false,
            isActive: true
        });
        await user.save();
        console.log('Parent created!');

        const student = new Student({
            fullName: 'Test Student',
            dateOfBirth: new Date('2010-01-01'),
            parentId: user._id,
            parentName: user.fullName,
            parentEmail: user.email,
            parentPhone: user.phone,
            curriculum: 'IGCSE',
            grade: 'Year 7',
            isActive: true
        });
        await student.save();
        console.log('Student created!');

        console.log('TEST PARENT CREDENTIALS:');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Approved: true');

        await mongoose.disconnect();

    } catch (error) {
        console.error('Error:', error.message);
        await mongoose.disconnect();
    }
}

createTestParent();