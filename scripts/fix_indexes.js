const mongoose = require('mongoose');
require('dotenv').config();

const fixIndexes = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyber-scavenger';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('users');

        console.log('Dropping email_1 index...');
        try {
            await collection.dropIndex('email_1');
            console.log('Successfully dropped email_1 index.');
        } catch (e) {
            console.log('Index email_1 not found or already dropped.');
        }

        console.log('Dropping googleId_1 index (if exists)...');
        try {
            await collection.dropIndex('googleId_1');
            console.log('Successfully dropped googleId_1 index.');
        } catch (e) {
            console.log('Index googleId_1 not found or already dropped.');
        }

        console.log('Indexes cleaned. Mongoose will recreate them with sparse option on next start.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixIndexes();
