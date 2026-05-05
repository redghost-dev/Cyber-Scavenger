const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows null/undefined values to not conflict
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    usernameChangeCount: {
        type: Number,
        default: 0
    },
    displayName: {
        type: String
    },
    email: {
        type: String,
        required: false, // Changed to false for guest support
        unique: true,
        sparse: true     // Important for sparse uniqueness
    },
    password: {
        type: String // Optional for Google Auth users and Guests
    },
    isGuest: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String
    },
    countryCode: {
        type: String,
        default: 'UN' // UN for Unknown or United Nations as default
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    emailNotifications: {
        type: Boolean,
        default: false
    },
    // Game Statistics
    stats: {
        highScore: { type: Number, default: 0 },
        totalScore: { type: Number, default: 0 },
        weeklyScore: { type: Number, default: 0 },
        totalGames: { type: Number, default: 0 },
        level: { type: Number, default: 1 },
        experience: { type: Number, default: 0 },
        leagueTier: { 
            type: String, 
            enum: ['Bronze', 'Silver', 'Gold', 'Diamond', 'Cyber Legend'],
            default: 'Bronze'
        }
    },
    // Economy
    wallet: {
        coins: { type: Number, default: 0 },
        gems: { type: Number, default: 0 }
    },
    // Settings
    hudLayout: {
        type: Object,
        default: null
    },
    // Inventory
    inventory: [{
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
        acquiredAt: { type: Date, default: Date.now },
        isEquipped: { type: Boolean, default: false }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Password Hash Middleware
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Helper method for validating password
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
