const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const email = process.argv[2];

if (!email) {
    console.log('Usage: node scripts/make_admin.js <email>');
    process.exit(1);
}

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
        
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(1);
        }
        
        user.role = 'admin';
        await user.save();
        
        console.log(`SUCCESS: User ${user.username} is now an ADMIN.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
