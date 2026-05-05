const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Item = require('../models/Item');
const Boss = require('../models/Boss');
const GameConfig = require('../models/GameConfig');
const { ensureAuthenticated } = require('../middleware/auth');
const geoip = require('geoip-lite');

// @desc    Get Game Config
// @route   GET /api/config
router.get('/config', async (req, res) => {
    try {
        const config = await GameConfig.findOne({ key: 'global_settings' });
        res.json({ success: true, config: config || {} });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// @desc    Get current user
// @route   GET /api/current_user
router.get('/current_user', (req, res) => {
    res.json(req.user || null);
});

// @desc    Get online users count (active in last 5 minutes)
// @route   GET /api/stats/online
router.get('/stats/online', async (req, res) => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const count = await User.countDocuments({ lastActive: { $gte: fiveMinutesAgo } });
        res.json({ online: count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Submit Game Score
// @route   POST /api/game/submit-score
router.post('/game/submit-score', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { score, level, coins, finalScore, isFirstSubmit } = req.body;
    const scoreDelta = parseInt(score) || 0;
    const currentFinalScore = parseInt(finalScore) || scoreDelta;
    const sessionCoins = parseInt(coins) || 0;
    
    try {
        const user = await User.findById(req.user._id);
        
        // Update Stats
        if (isFirstSubmit) {
            user.stats.totalGames += 1;
        }
        user.stats.totalScore += scoreDelta;
        user.stats.weeklyScore = (user.stats.weeklyScore || 0) + scoreDelta;
        
        // Update Wallet (Session Coins)
        if (sessionCoins > 0) {
            if (!user.wallet) {
                user.wallet = { coins: 0, gems: 0 };
            }
            const oldBalance = user.wallet.coins || 0;
            user.wallet.coins = oldBalance + sessionCoins;
            user.markModified('wallet'); // Ensure Mongoose detects the change
            console.log(`Economy: Added ${sessionCoins} coins to user ${user.username}. Old: ${oldBalance}, New: ${user.wallet.coins}`);
        }
        
        // Update High Score
        if (currentFinalScore > user.stats.highScore) {
            user.stats.highScore = currentFinalScore;
        }

        // Calculate Experience and Level
        user.stats.experience += scoreDelta;
        // Level up every 10000 XP (just an example)
        user.stats.level = Math.floor(user.stats.experience / 10000) + 1;

        // Update League Tier (Modernized Thresholds)
        if (user.stats.highScore >= 250000) user.stats.leagueTier = 'Cyber Legend';
        else if (user.stats.highScore >= 100000) user.stats.leagueTier = 'Diamond';
        else if (user.stats.highScore >= 50000) user.stats.leagueTier = 'Gold';
        else if (user.stats.highScore >= 15000) user.stats.leagueTier = 'Silver';
        else user.stats.leagueTier = 'Bronze';

        await user.save();

        res.json({ 
            success: true, 
            newStats: user.stats,
            wallet: user.wallet
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Ad Reward Callback
// @route   POST /api/ads/reward
router.post('/ads/reward', async (req, res) => {
    const { type } = req.body;
    
    try {
        const config = await GameConfig.findOne({ key: 'global_settings' });
        const adConfig = config ? config.ads : { rewards: { coinsPerAd: 100, gemsPerAd: 1 } };

        // Handle Registered User (including session-based guests)
        if (req.user) {
            const user = await User.findById(req.user._id);
            if (type === 'coins') {
                // If amount is provided (e.g. from Double Reward), use it, otherwise use config
                const amountToAdd = req.body.amount || adConfig.rewards.coinsPerAd || 100;
                user.wallet.coins = (user.wallet.coins || 0) + amountToAdd;
                await user.save();
                return res.json({ success: true, message: `${amountToAdd} Coins added`, wallet: user.wallet });
            } else if (type === 'gems') {
                const amount = adConfig.rewards.gemsPerAd || 1;
                user.wallet.gems = (user.wallet.gems || 0) + amount;
                await user.save();
                return res.json({ success: true, message: `${amount} Gems added`, wallet: user.wallet });
            } else if (type === 'revive') {
                if (adConfig.rewards && !adConfig.rewards.reviveEnabled) {
                    return res.status(400).json({ error: 'Revive is currently disabled' });
                }
                return res.json({ success: true, message: 'Revive authorized' });
            }
        } else {
            // Handle Guest User
            if (type === 'coins' || type === 'gems' || type === 'revive') {
                if (type === 'revive' && adConfig.rewards && !adConfig.rewards.reviveEnabled) {
                    return res.status(400).json({ error: 'Revive is currently disabled' });
                }
                return res.json({ success: true, message: 'Guest reward authorized (local)' });
            }
        }
        
        res.status(400).json({ error: 'Invalid reward type' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Save HUD Layout
// @route   POST /api/user/hud-layout
router.post('/user/hud-layout', ensureAuthenticated, async (req, res) => {
    try {
        const { layout } = req.body;
        
        if (!layout) {
            return res.status(400).json({ error: 'Layout data is required' });
        }

        await User.findByIdAndUpdate(req.user._id, {
            $set: { hudLayout: layout }
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Update User Profile (Username)
// @route   POST /api/user/update-profile
router.post('/user/update-profile', ensureAuthenticated, async (req, res) => {
    const { username } = req.body;
    try {
        const user = await User.findById(req.user._id);
        
        if (username && username !== user.username) {
            // Check change limit
            if (user.usernameChangeCount && user.usernameChangeCount >= 1) {
                return res.status(400).json({ error: 'Username change limit reached (Max 1)' });
            }

            // Check if username exists
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ error: 'Username already taken' });
            }
            user.username = username;
            user.displayName = username; // Sync display name for now
            user.usernameChangeCount = (user.usernameChangeCount || 0) + 1;
        }

        await user.save();
        res.json({ success: true, message: 'Profile updated successfully', user: { username: user.username, usernameChangeCount: user.usernameChangeCount } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Convert Guest to Permanent Account
// @route   POST /api/user/convert-guest
router.post('/user/convert-guest', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user.isGuest) {
            return res.status(400).json({ error: 'Account is already permanent' });
        }

        const { email, password, username, avatarColor, countryCode, captcha, captchaAnswer, captchaTiming, captchaMovements } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Email, Password and Username are required' });
        }

        // CAPTCHA validation
        if (!captcha || !captchaAnswer || !captchaTiming || !captchaMovements) {
            return res.status(400).json({ error: 'Please complete the slider security verification' });
        } else {
            const userPosition = parseInt(captcha);
            const targetPosition = parseInt(captchaAnswer);
            const timeTaken = parseFloat(captchaTiming);
            const movements = parseInt(captchaMovements);
            
            if (Math.abs(userPosition - targetPosition) > 20) {
                return res.status(400).json({ error: 'Slider verification failed.' });
            }
            if (timeTaken < 0.2 || movements < 2) {
                return res.status(400).json({ error: 'Security verification failed (bot detected).' });
            }
        }

        // Check if email already exists
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Check if new username exists
        const usernameExists = await User.findOne({ username });
        if (usernameExists && username !== user.username) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Update user
        const colorSeed = avatarColor || 'cyan';
        const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}&backgroundColor=${colorSeed}`;

        user.email = email;
        user.password = password; // Will be hashed by pre-save hook
        user.username = username;
        user.displayName = username;
        user.avatar = avatarUrl;
        
        // Auto-detect country for guest conversion if not provided
        let finalCountryCode = countryCode;
        if (!finalCountryCode || finalCountryCode === 'UN') {
            const geo = geoip.lookup(req.ip);
            if (geo && geo.country) {
                finalCountryCode = geo.country;
            } else {
                finalCountryCode = 'UN';
            }
        }
        
        user.countryCode = finalCountryCode;
        user.isGuest = false;
        user.usernameChangeCount = 1; // Mark as changed

        await user.save();

        res.json({ 
            success: true, 
            message: 'Account successfully converted! You are now a permanent agent.',
            user: { username: user.username, email: user.email, isGuest: false }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Equip Avatar
// @route   POST /api/user/equip-avatar
router.post('/user/equip-avatar', ensureAuthenticated, async (req, res) => {
    const { itemId } = req.body;
    try {
        const user = await User.findById(req.user._id).populate('inventory.item');
        
        // Check ownership
        const inventoryItem = user.inventory.find(inv => inv.item && inv.item._id.toString() === itemId);
        
        if (!inventoryItem) {
            return res.status(400).json({ error: 'You do not own this avatar' });
        }

        if (inventoryItem.item.type !== 'avatar') {
            return res.status(400).json({ error: 'Item is not an avatar' });
        }

        user.avatar = inventoryItem.item.imageUrl;
        
        // Update isEquipped status in inventory (optional but good for UI)
        user.inventory.forEach(inv => {
            if (inv.item && inv.item.type === 'avatar') {
                inv.isEquipped = (inv.item._id.toString() === itemId);
            }
        });

        await user.save();
        res.json({ success: true, avatar: user.avatar });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Change Password
// @route   POST /api/user/change-password
router.post('/user/change-password', ensureAuthenticated, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user._id);

        if (!user.password) {
             return res.status(400).json({ error: 'You are logged in via social provider. Cannot change password.' });
        }

        // Match password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Update User Country
// @route   POST /api/user/update-country
router.post('/user/update-country', ensureAuthenticated, async (req, res) => {
    const { countryCode } = req.body;
    try {
        if (countryCode) {
            await User.findByIdAndUpdate(req.user._id, { countryCode });
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Country code required' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Get Active Bosses & Blueprints
// @route   GET /api/bosses/active
router.get('/bosses/active', async (req, res) => {
    try {
        const bosses = await Boss.find({ enabled: true });
        
        // --- PHASE 3: DIFFICULTY SCALING ---
        const user = req.user; // Might be undefined if not logged in
        let difficultyMult = 1.0;
        
        if (user && user.stats) {
            // Scale by kill count: +10% hp/dmg per 50 boss kills
            const totalKills = (user.stats.totalBossKills || 0);
            difficultyMult = 1 + (Math.floor(totalKills / 50) * 0.1);
        }
        
        // --- PHASE 3: ANONYMIZATION ---
        const processedBosses = bosses.map(b => {
             const bossObj = b.toObject();
             
             // Apply Scaling
             bossObj.hpMult = (bossObj.hpMult || 1) * difficultyMult;
             bossObj.attackChance = Math.min(0.9, (bossObj.attackChance || 0.05) * difficultyMult);
             
             // Anonymize Creator if not a global system boss
             if (bossObj.creatorId && !bossObj.isGlobal) {
                 bossObj.creatorName = "AI Architect"; // Hide real usernames for now
             }
             
             return bossObj;
        });

        res.json({ success: true, bosses: processedBosses });
    } catch (err) {
        console.error('Boss API Error:', err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

module.exports = router;
