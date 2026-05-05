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

const avatars = [
    {
        name: 'Cyber Punk',
        description: 'A classic cyberpunk look.',
        type: 'avatar',
        price: 500,
        currencyType: 'coin',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CyberPunk&backgroundColor=b6e3f4',
        isPremium: false
    },
    {
        name: 'Neon Ninja',
        description: 'Stealthy and bright.',
        type: 'avatar',
        price: 1000,
        currencyType: 'coin',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NeonNinja&backgroundColor=c0aede',
        isPremium: false
    },
    {
        name: 'Tech Mage',
        description: 'Master of digital arts.',
        type: 'avatar',
        price: 2000,
        currencyType: 'coin',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TechMage&backgroundColor=ffdfbf',
        isPremium: false
    },
    {
        name: 'Void Walker',
        description: 'From the deep space.',
        type: 'avatar',
        price: 100,
        currencyType: 'gem',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=VoidWalker&backgroundColor=d1d4f9',
        isPremium: true
    },
    {
        name: 'Glitch',
        description: 'An anomaly in the system.',
        type: 'avatar',
        price: 50,
        currencyType: 'gem',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Glitch&backgroundColor=ffd5dc',
        isPremium: true
    }
];

const seedAvatars = async () => {
    try {
        // Check if avatars already exist to avoid duplicates
        for (const avatar of avatars) {
            const exists = await Item.findOne({ name: avatar.name, type: 'avatar' });
            if (!exists) {
                await Item.create(avatar);
                console.log(`Created avatar: ${avatar.name}`);
            } else {
                console.log(`Avatar already exists: ${avatar.name}`);
            }
        }
        console.log('Avatar seeding complete');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAvatars();
