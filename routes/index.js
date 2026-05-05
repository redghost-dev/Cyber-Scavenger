const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Item = require('../models/Item');
const { ensureAuthenticated } = require('../middleware/auth');

// @desc    Home Page
// @route   GET /
router.get('/', async (req, res) => {
    let user = req.user;
    if (user) {
        try {
            user = await User.findById(user._id).select('-password').populate('inventory.item');
        } catch (err) {
            console.error('Error populating user inventory:', err);
        }
    }
    res.render('index', { user: user });
});

// @desc    Terms of Service Page
// @route   GET /terms
router.get('/terms', (req, res) => {
    res.render('terms');
});

// @desc    Shop Page
// @route   GET /shop
router.get('/shop', ensureAuthenticated, async (req, res) => {
    try {
        const items = await Item.find({ isActive: true }).sort({ order: 1 });
        // Re-fetch user to get latest wallet/inventory
        const user = await User.findById(req.user._id).populate('inventory.item');
        
        res.render('shop', { 
            user: user,
            items: items
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// @desc    Leaderboard Page
// @route   GET /leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        // Get top 50 players sorted by high score
        const players = await User.find({ 'stats.highScore': { $gt: 0 } })
            .sort({ 'stats.highScore': -1 })
            .limit(50)
            .select('username displayName avatar stats');
            
        res.render('leaderboard', { 
            user: req.user,
            players: players
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @desc    Profile Page
// @route   GET /profile
router.get('/profile', async (req, res) => {
    if (!req.user) {
        return res.redirect('/auth/google');
    }
    
    try {
        // Re-fetch user to get latest stats
        const user = await User.findById(req.user._id);
        res.render('profile', { user: user });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

module.exports = router;