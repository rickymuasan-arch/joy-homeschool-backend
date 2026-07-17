const mongoose = require('mongoose');
require('dotenv').config();

async function deleteTestData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Parent = require('./models/Parent');
        const Student = require('./models/Student');
        const User = require('./models/User');

        await Parent.deleteOne({ email: 'maryw@example.com' });
        await Student.deleteOne({ fullName: 'John Doe' });
        await User.deleteOne({ email: 'maryw@example.com' });

        console.log('✅ Test data removed successfully!');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        await mongoose.disconnect();
    }
}

deleteTestData();