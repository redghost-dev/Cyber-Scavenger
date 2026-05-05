const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');

// @desc    Get global leaderboard (Top 100)
// @route   GET /api/leaderboard/global
router.get('/global', async (req, res) => {
    try {
        // Fetch top 100 users sorted by high score
        const leaderboard = await User.find({ 'stats.highScore': { $gt: 0 } })
            .sort({ 'stats.highScore': -1 })
            .limit(100)
            .select('username avatar stats.highScore stats.leagueTier stats.level');

        res.json(leaderboard);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Get league leaderboard (Top 100 in user's league)
// @route   GET /api/leaderboard/league
router.get('/league', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const userLeague = user.stats.leagueTier || 'Bronze';

        // Fetch top 100 users in the same league
        const leaderboard = await User.find({ 
            'stats.leagueTier': userLeague,
            'stats.highScore': { $gt: 0 }
        })
            .sort({ 'stats.highScore': -1 })
            .limit(100)
            .select('username avatar stats.highScore stats.leagueTier stats.level');

        // Calculate user's rank in their league
        // Count how many users in the same league have a higher score
        const rank = await User.countDocuments({
            'stats.leagueTier': userLeague,
            'stats.highScore': { $gt: user.stats.highScore }
        }) + 1;

        res.json({
            league: userLeague,
            userRank: rank,
            leaderboard: leaderboard
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
