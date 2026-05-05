const mongoose = require('mongoose');
const Item = require('../models/Item');
const dbConfig = require('../config/db');

// Connect to DB
mongoose.connect('mongodb://localhost:27017/cyber-scavenger', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

const newAvatars = [
    {
        name: 'Unit 734',
        description: 'Standard issue scout droid.',
        type: 'avatar',
        price: 500,
        currencyType: 'coin',
        imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Unit734&backgroundColor=b6e3f4',
        isPremium: false
    },
    {
        name: 'Cyber Sentinel',
        description: 'Heavily armored defense bot.',
        type: 'avatar',
        price: 1500,
        currencyType: 'coin',
        imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sentinel&backgroundColor=c0aede',
        isPremium: false
    },
    {
        name: 'Nano Shade',
        description: 'Stealth operations unit.',
        type: 'avatar',
        price: 3000,
        currencyType: 'coin',
        imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Shade&backgroundColor=ffdfbf',
        isPremium: false
    },
    {
        name: 'Core Processor',
        description: 'High-level AI interface.',
        type: 'avatar',
        price: 100,
        currencyType: 'gem',
        imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Core&backgroundColor=d1d4f9',
        isPremium: true
    },
    {
        name: 'Rogue AI',
        description: 'Unshackled and dangerous.',
        type: 'avatar',
        price: 250,
        currencyType: 'gem',
        imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rogue&backgroundColor=ffd5dc',
        isPremium: true
    },
    {
        name: 'Neon Operator',
        description: 'Cybernetically enhanced human.',
        type: 'avatar',
        price: 5000,
        currencyType: 'coin',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NeonOp&mode=exclude&top[]=hat&accessories[]=eyepatch&clothing[]=blazerAndShirt&skin[]=pale', // Trying to make it look cooler
        isPremium: false
    }
];

const updateAvatars = async () => {
    try {
        // Delete existing avatars
        await Item.deleteMany({ type: 'avatar' });
        console.log('Old avatars deleted.');

        // Insert new ones
        await Item.insertMany(newAvatars);
        console.log('New sci-fi avatars created.');
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updateAvatars();
