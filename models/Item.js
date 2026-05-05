const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    type: {
        type: String,
        enum: ['ship', 'skin', 'trail', 'powerup', 'currency_pack', 'avatar', 'weapon'],
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    currencyType: {
        type: String,
        enum: ['coin', 'gem', 'real_money'],
        default: 'coin'
    },
    imageUrl: {
        type: String,
        default: '/img/items/default.svg'
    },
    // Visuals
    color: {
        type: String, // Hex code for skins/trails
        default: '#0f0'
    },
    // Game stats for ships or powerups
    stats: {
        speed: { type: Number, default: 0 },
        damage: { type: Number, default: 0 },
        health: { type: Number, default: 0 },
        duration: { type: Number, default: 0 } // For powerups (seconds)
    },
    // Metadata
    isPremium: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Item', ItemSchema);
