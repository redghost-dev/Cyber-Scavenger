const mongoose = require('mongoose');

const GameConfigSchema = new mongoose.Schema({
    key: { 
        type: String, 
        required: true, 
        unique: true,
        default: 'global_settings'
    },
    gameplay: {
        enemyHealthMultiplier: { type: Number, default: 1.0 },
        xpRate: { type: Number, default: 1.0 },
        coinDropRate: { type: Number, default: 0.1 },
        coinsPerPickup: { type: Number, default: 1 },
        maxLevel: { type: Number, default: 100 },
        baseOrbScore: { type: Number, default: 1 },
        superOrbScore: { type: Number, default: 10 },
        baseKillScore: { type: Number, default: 5 },
        comboCap: { type: Number, default: 5 },
        comboDecayTime: { type: Number, default: 2500 },
        baseLevelUpMultiplier: { type: Number, default: 1.2 },
        enemySpeedMultiplier: { type: Number, default: 0.25 },
        initialSpawnRate: { type: Number, default: 2500 },
        minSpawnRate: { type: Number, default: 400 },
        spawnRateDecreasePerLevel: { type: Number, default: 150 },
        powerupSpawnInterval: { type: Number, default: 10000 },
        powerupChance: { type: Number, default: 0.5 },
        healDropRate: { type: Number, default: 0.25 },
        shieldWeight: { type: Number, default: 1.0 },
        slowWeight: { type: Number, default: 1.0 },
        magnetWeight: { type: Number, default: 1.0 },
        nukeWeight: { type: Number, default: 1.0 },
        bossInitialScore: { type: Number, default: 5000 },
        bossKillThreshold: { type: Number, default: 100 },
        bossScoreIncreasePercent: { type: Number, default: 20 },
        bosses: {
            type: Array,
            default: [
                {
                    id: 'mech',
                    name: 'Titan Mech',
                    enabled: true,
                    hpMult: 1.5,
                    color: '#c0c0c0', // Metallic
                    attackChance: 0.05,
                    description: 'Heavily armored war machine. Fires rockets.'
                },
                {
                    id: 'interceptor',
                    name: 'Viper Jet',
                    enabled: true,
                    hpMult: 0.8,
                    color: '#00ffcc', // Cyan neon
                    attackChance: 0.1,
                    description: 'High-speed stealth fighter with rapid cannons.'
                },
                {
                    id: 'station',
                    name: 'Omega Station',
                    enabled: true,
                    hpMult: 2.0,
                    color: '#ffaa00', // Orange industrial
                    attackChance: 0.03,
                    description: 'Static defense fortress with rotating lasers.'
                },
                {
                    id: 'vanguard',
                    name: 'Obsidian Vanguard',
                    enabled: true,
                    hpMult: 1.0,
                    color: '#ff0000', // Red/Black
                    attackChance: 0.15,
                    description: 'Stealth assassin. Cloaks and strikes fast.'
                },
                {
                    id: 'dreadnought',
                    name: 'Orbital Dreadnought',
                    enabled: true,
                    hpMult: 3.0,
                    color: '#ff8800', // Orange/Industrial
                    attackChance: 0.05,
                    description: 'Massive capital ship with independent gun turrets.'
                },
                {
                    id: 'seraphim',
                    name: 'The Seraphim',
                    enabled: true,
                    hpMult: 1.8,
                    color: '#ffd700', // Gold/Divine
                    attackChance: 0.08,
                    description: 'Shape-shifting geometric entity. Manipulates space.'
                }
            ]
        }
    },
    analysisDoc: {
        content: { type: String, default: '' },
        lastUpdated: { type: Date, default: Date.now }
    },
    dailyTasks: [{
        title: String,
        description: String,
        rewardAmount: Number,
        rewardType: { type: String, enum: ['coin', 'gem'], default: 'coin' },
        targetCount: Number,
        isActive: { type: Boolean, default: true }
    }],
    ai: {
        enableFallback: { type: Boolean, default: true }
    },
    system: {
        maintenanceMode: { type: Boolean, default: false },
        minClientVersion: { type: String, default: '1.0.0' },
        announcementMessage: { type: String, default: '' }
    },
    ads: {
        androidAppId: { type: String, default: '' },
        iosAppId: { type: String, default: '' },
        bannerAdUnitId: { type: String, default: '' },
        interstitialAdUnitId: { type: String, default: '' },
        rewardedAdUnitId: { type: String, default: '' },
        isEnabled: { type: Boolean, default: true },
        interstitialInterval: { type: Number, default: 3 }, // Show ad every X games
        rewards: {
            reviveEnabled: { type: Boolean, default: true },
            coinsPerAd: { type: Number, default: 100 },
            gemsPerAd: { type: Number, default: 1 },
            dailyLimit: { type: Number, default: 10 }
        },
        cooldowns: {
            rewardedAd: { type: Number, default: 60 }, // Seconds between rewarded ads
            interstitialAd: { type: Number, default: 180 } // Seconds between interstitial ads
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('GameConfig', GameConfigSchema);
