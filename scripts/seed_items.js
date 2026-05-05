const mongoose = require('mongoose');
const Item = require('../models/Item');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const items = [
    {
        name: 'Starter Ship',
        description: 'A reliable ship for beginners.',
        type: 'ship',
        price: 0,
        currencyType: 'coin',
        stats: { speed: 5, damage: 10, health: 100 },
        color: '#00ff00', // Green
        isActive: true,
        order: 1
    },
    {
        name: 'Speedster',
        description: 'Sacrifices health for incredible speed.',
        type: 'ship',
        price: 50,
        currencyType: 'coin',
        stats: { speed: 8, damage: 8, health: 60 },
        color: '#ffff00', // Yellow
        isActive: true,
        order: 2
    },
    {
        name: 'Tank Destroyer',
        description: 'Heavy armor and high damage, but slow.',
        type: 'ship',
        price: 50,
        currencyType: 'coin',
        stats: { speed: 3, damage: 15, health: 150 },
        color: '#ff0000', // Red
        isActive: true,
        order: 3
    },
    {
        name: 'Void Interceptor',
        description: 'Advanced prototype with balanced stats and sleek design.',
        type: 'ship',
        price: 50,
        currencyType: 'coin',
        stats: { speed: 7, damage: 9, health: 80 },
        color: '#a020f0', // Purple
        isActive: true,
        order: 4
    },
    {
        name: 'Cyber Cruiser',
        description: 'A massive vessel dominating the space lanes.',
        type: 'ship',
        price: 50,
        currencyType: 'coin',
        stats: { speed: 4, damage: 12, health: 120 },
        color: '#0000ff', // Blue
        isActive: true,
        order: 5
    },
    {
        name: 'Stealth Wing',
        description: 'Hard to hit, fast and deadly.',
        type: 'ship',
        price: 50,
        currencyType: 'coin',
        stats: { speed: 9, damage: 7, health: 50 },
        color: '#ffffff', // White
        isActive: true,
        order: 6
    },
    {
        name: 'Neon Trail',
        description: 'Leave a cool neon trail behind you.',
        type: 'trail',
        price: 50,
        currencyType: 'coin',
        color: '#00ffff', // Cyan
        isActive: true,
        order: 10
    },
    {
        name: 'Fire Trail',
        description: 'Leave a blazing fire trail.',
        type: 'trail',
        price: 50,
        currencyType: 'coin',
        color: '#ff4400', // Orange Red
        isActive: true,
        order: 11
    },
    {
        name: 'Plasma Trail',
        description: 'A high-energy plasma trail.',
        type: 'trail',
        price: 50,
        currencyType: 'coin',
        color: '#cc00ff', // Purple
        isActive: true,
        order: 12
    },
    {
        name: 'Golden Trail',
        description: 'Pure luxury.',
        type: 'trail',
        price: 50,
        currencyType: 'coin',
        color: '#ffd700', // Gold
        isActive: true,
        order: 13
    },
    {
        name: 'Matrix Trail',
        description: 'Digital rain effect.',
        type: 'trail',
        price: 50,
        currencyType: 'coin',
        color: '#00ff00', // Matrix Green
        isActive: true,
        order: 14
    },
    {
        name: 'Ice Trail',
        description: 'Cool as ice.',
        type: 'trail',
        price: 50,
        currencyType: 'coin',
        color: '#e0ffff', // Light Cyan
        isActive: true,
        order: 15
    },
    {
        name: 'Shadow Trail',
        description: 'Darkness follows you.',
        type: 'trail',
        price: 1200,
        currencyType: 'coin',
        color: '#333333', // Dark Grey
        isActive: true,
        order: 16
    },
    {
        name: 'Bubblegum Trail',
        description: 'Pop goes the engine!',
        type: 'trail',
        price: 600,
        currencyType: 'coin',
        color: '#ff69b4', // Hot Pink
        isActive: true,
        order: 17
    },
    {
        name: 'Double XP (1 Hour)',
        description: 'Earn double experience points for 1 hour.',
        type: 'powerup',
        price: 50,
        currencyType: 'gem',
        stats: { duration: 3600 },
        isActive: true,
        order: 20
    },
    {
        name: 'Coin Magnet',
        description: 'Attract coins from a larger distance.',
        type: 'powerup',
        price: 200,
        currencyType: 'coin',
        isActive: true,
        order: 21
    }
];

const seedItems = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Clear existing items to avoid duplicates if run multiple times
        await Item.deleteMany({});
        console.log('Cleared existing items');

        await Item.insertMany(items);
        console.log('Added sample items successfully');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedItems();
