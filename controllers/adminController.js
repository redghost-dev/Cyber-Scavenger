const User = require('../models/User');
const GameConfig = require('../models/GameConfig');
const Boss = require('../models/Boss');
const Item = require('../models/Item');
const Feedback = require('../models/Feedback');
const CheatLog = require('../models/CheatLog');
const Translation = require('../models/Translation');
const AuditLog = require('../models/AuditLog');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const AiGenerator = require('../services/AiGenerator');

// @desc    Get simulation dashboard
// @route   GET /admin/simulation
exports.getSimulation = async (req, res) => {
    try {
        const config = await GameConfig.findOne({ key: 'global_settings' });
        res.render('admin/simulation', {
            title: 'Oyun Dengesi & Ekonomi Simülatörü',
            user: req.user,
            config: config || {}
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Helper for logging admin actions
const logAdminAction = async (adminId, action, targetType, targetId, details, ip) => {
    try {
        await AuditLog.create({
            admin: adminId,
            action,
            targetType,
            targetId,
            details,
            ipAddress: ip
        });
    } catch (err) {
        console.error('Audit Log Error:', err);
    }
};

// @desc    Admin Dashboard
// @route   GET /admin
exports.getDashboard = async (req, res) => {
    try {
        const stats = {
            totalUsers: await User.countDocuments(),
            onlineUsers: await User.countDocuments({ lastActive: { $gt: new Date(Date.now() - 5 * 60 * 1000) } }),
            totalItems: await Item.countDocuments(),
            pendingFeedbacks: await Feedback.countDocuments({ status: 'pending' }),
            recentCheats: await CheatLog.countDocuments({ createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
        };

        res.render('admin/dashboard', {
            title: 'Yönetim Paneli',
            stats
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// @desc    List Users
// @route   GET /admin/users
exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        
        let query = {};
        if (search) {
            query = {
                $or: [
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const totalUsers = await User.countDocuments(query);
        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.render('admin/users', {
            title: 'Kullanıcı Yönetimi',
            users,
            user: req.user,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            search,
            totalUsers
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// @desc    Get user edit form
// @route   GET /admin/users/edit/:id
exports.getUserEdit = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).send('Kullanıcı bulunamadı');
        }
        res.render('admin/user_edit', {
            title: `Kullanıcı Düzenle: ${targetUser.username}`,
            targetUser,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Save user changes
// @route   POST /admin/users/save
exports.saveUser = async (req, res) => {
    try {
        // Basic sanitization
        req.body.role = req.body.role.trim();
        
        const { id, role, coins, level, experience } = req.body;
        
        const updateData = {
            role,
            'wallet.coins': parseInt(coins) || 0,
            'stats.level': parseInt(level) || 1,
            'stats.experience': parseInt(experience) || 0
        };

        await User.findByIdAndUpdate(id, { $set: updateData });
        await logAdminAction(req.user._id, 'UPDATE_USER', 'User', id, `Kullanıcı bilgileri güncellendi (Rol: ${role})`, req.ip);
        req.flash('success_msg', 'Kullanıcı bilgileri güncellendi!');
        res.redirect('/admin/users');
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Ban/Unban user
// @route   POST /admin/users/ban/:id
exports.banUser = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).send('Kullanıcı bulunamadı');

        targetUser.isBanned = !targetUser.isBanned;
        await targetUser.save();
        await logAdminAction(req.user._id, targetUser.isBanned ? 'BAN_USER' : 'UNBAN_USER', 'User', targetUser._id, `Kullanıcı ${targetUser.isBanned ? 'yasaklandı' : 'yasağı kaldırıldı'}`, req.ip);

        req.flash('success_msg', `Kullanıcı ${targetUser.isBanned ? 'yasaklandı' : 'yasağı kaldırıldı'}!`);
        res.redirect('/admin/users');
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Reset user password
// @route   POST /admin/users/reset-password/:id
exports.resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).send('Kullanıcı bulunamadı');

        targetUser.password = newPassword;
        await targetUser.save();
        await logAdminAction(req.user._id, 'RESET_PASSWORD', 'User', targetUser._id, `Kullanıcı şifresi sıfırlandı`, req.ip);

        req.flash('success_msg', 'Şifre başarıyla sıfırlandı!');
        res.redirect('/admin/users');
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Bulk actions for users
// @route   POST /admin/users/bulk-action
exports.bulkUserAction = async (req, res) => {
    try {
        const { userIds, action } = req.body;
        if (!userIds || !action) return res.redirect('/admin/users');

        const ids = userIds.split(',');
        
        if (action === 'ban') {
            await User.updateMany({ _id: { $in: ids } }, { $set: { isBanned: true } });
            await logAdminAction(req.user._id, 'BULK_BAN', 'User', ids.join(','), `${ids.length} kullanıcı toplu yasaklandı`, req.ip);
        } else if (action === 'unban') {
            await User.updateMany({ _id: { $in: ids } }, { $set: { isBanned: false } });
            await logAdminAction(req.user._id, 'BULK_UNBAN', 'User', ids.join(','), `${ids.length} kullanıcı yasağı toplu kaldırıldı`, req.ip);
        }

        req.flash('success_msg', `${ids.length} kullanıcı üzerinde işlem başarıyla tamamlandı!`);
        res.redirect('/admin/users');
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Get Game Config
// @route   GET /admin/config
exports.getConfig = async (req, res) => {
    try {
        let config = await GameConfig.findOne({ key: 'global_settings' });
        if (!config) {
            config = await GameConfig.create({ key: 'global_settings' });
        }

        // Auto-discover bosses from JSON files
        const bossesDir = path.join(__dirname, '../public/data/bosses');
        if (fs.existsSync(bossesDir)) {
            const files = fs.readdirSync(bossesDir);
            const validBossIds = [];

            files.forEach(file => {
                if (file.endsWith('.json')) {
                    try {
                        const bossData = JSON.parse(fs.readFileSync(path.join(bossesDir, file), 'utf8'));
                        validBossIds.push(bossData.id);
                        
                        // Check if exists in DB config
                        const exists = config.gameplay.bosses.find(b => b.id === bossData.id);
                        if (!exists) {
                            // Add new boss found in JSON
                            config.gameplay.bosses.push({
                                id: bossData.id,
                                name: bossData.name,
                                enabled: bossData.enabled !== undefined ? bossData.enabled : true, // Default to true for new bosses
                                hpMult: bossData.hpMult || 1.0,
                                color: bossData.color || '#ff0000',
                                attackChance: bossData.attackChance || 0.05,
                                description: bossData.description || 'New Boss'
                            });
                        }
                    } catch (e) {
                        console.error(`Error loading boss config ${file}:`, e);
                    }
                }
            });

            // CLEANUP: Remove bosses from Config that no longer exist as JSON files
            // This fixes the issue where 'core' or deleted bosses remain in the Admin Panel
            const originalLength = config.gameplay.bosses.length;
            config.gameplay.bosses = config.gameplay.bosses.filter(b => validBossIds.includes(b.id));
            
            if (config.gameplay.bosses.length < originalLength) {
                console.log(`[Admin] Removed ${originalLength - config.gameplay.bosses.length} invalid bosses from config display.`);
                // We don't save here automatically, the user must click "Save" in the panel to persist the cleanup.
            }
        }

        res.render('admin/config', {
            title: 'Oyun Ayarları',
            config
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// @desc    Update Game Config
// @route   POST /admin/config
exports.updateConfig = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('error_msg', errors.array()[0].msg);
            return res.redirect('/admin/config');
        }

        const { 
            enemyHealthMultiplier, xpRate, coinDropRate, coinsPerPickup, maxLevel,
            baseOrbScore, superOrbScore, baseKillScore, comboCap, comboDecayTime,
            baseLevelUpMultiplier, enemySpeedMultiplier, initialSpawnRate, minSpawnRate, spawnRateDecreasePerLevel,
            powerupSpawnInterval, powerupChance, healDropRate, 
            shieldWeight, slowWeight, magnetWeight, nukeWeight,
            bossInitialScore, bossKillThreshold, bossScoreIncreasePercent,
            bosses, // New Bosses Array
            analysisDocContent,
            aiEnableFallback, // NEW: AI Fallback Checkbox
            maintenanceMode, minClientVersion, announcementMessage,
            adsEnabled, interstitialInterval,
            androidAppId, iosAppId, bannerAdUnitId, interstitialAdUnitId, rewardedAdUnitId,
            rewardedCooldown, interstitialCooldown,
            reviveEnabled, coinsPerAd, gemsPerAd, dailyLimit
        } = req.body;

        const parseNum = (val, def) => {
            const parsed = parseFloat(val);
            return isNaN(parsed) ? def : parsed;
        };

        // Process Bosses
        let parsedBosses = [];
        // If coming from form, it might be an object with keys '0', '1', etc. or strictly an array
        // Body parser usually makes it an array if keys are sequential
        if (bosses) {
             const bossList = Array.isArray(bosses) ? bosses : Object.values(bosses);
             parsedBosses = bossList.map(b => ({
                 id: b.id,
                 name: b.name,
                 enabled: b.enabled === 'on',
                 hpMult: parseNum(b.hpMult, 1.0),
                 color: b.color,
                 attackChance: parseNum(b.attackChance, 0.05),
                 description: b.description
             }));
        }

        await GameConfig.findOneAndUpdate(
            { key: 'global_settings' },
            {
                $set: {
                    'gameplay.enemyHealthMultiplier': parseNum(enemyHealthMultiplier, 1.0),
                    'gameplay.xpRate': parseNum(xpRate, 1.0),
                    'gameplay.coinDropRate': parseNum(coinDropRate, 0.1),
                    'gameplay.coinsPerPickup': parseNum(coinsPerPickup, 1),
                    'gameplay.maxLevel': parseNum(maxLevel, 100),
                    'gameplay.baseOrbScore': parseNum(baseOrbScore, 10),
                    'gameplay.superOrbScore': parseNum(superOrbScore, 50),
                    'gameplay.baseKillScore': parseNum(baseKillScore, 20),
                    'gameplay.comboCap': parseNum(comboCap, 8),
                    'gameplay.comboDecayTime': parseNum(comboDecayTime, 3000),
                    'gameplay.baseLevelUpMultiplier': parseNum(baseLevelUpMultiplier, 1.2),
                    'gameplay.enemySpeedMultiplier': parseNum(enemySpeedMultiplier, 0.15),
                    'gameplay.initialSpawnRate': parseNum(initialSpawnRate, 2500),
                    'gameplay.minSpawnRate': parseNum(minSpawnRate, 400),
                    'gameplay.spawnRateDecreasePerLevel': parseNum(spawnRateDecreasePerLevel, 150),
                    'gameplay.powerupSpawnInterval': parseNum(powerupSpawnInterval, 10000),
                    'gameplay.powerupChance': parseNum(powerupChance, 0.5),
                    'gameplay.healDropRate': parseNum(healDropRate, 0.15),
                    'gameplay.shieldWeight': parseNum(shieldWeight, 1.0),
                    'gameplay.slowWeight': parseNum(slowWeight, 1.0),
                    'gameplay.magnetWeight': parseNum(magnetWeight, 1.0),
                    'gameplay.nukeWeight': parseNum(nukeWeight, 1.0),
                    'gameplay.bossInitialScore': parseNum(bossInitialScore, 5000),
                    'gameplay.bossKillThreshold': parseNum(bossKillThreshold, 100),
                    'gameplay.bossScoreIncreasePercent': parseNum(bossScoreIncreasePercent, 20),
                    'gameplay.bosses': parsedBosses, // UPDATE BOSSES
                    'analysisDoc.content': analysisDocContent,
                    'analysisDoc.lastUpdated': Date.now(),
                    'ai.enableFallback': aiEnableFallback === 'on',
                    'system.maintenanceMode': maintenanceMode === 'on',
                    'system.minClientVersion': minClientVersion,
                    'system.announcementMessage': announcementMessage,
                    'ads.isEnabled': adsEnabled === 'on',
                    'ads.androidAppId': androidAppId,
                    'ads.iosAppId': iosAppId,
                    'ads.bannerAdUnitId': bannerAdUnitId,
                    'ads.interstitialAdUnitId': interstitialAdUnitId,
                    'ads.rewardedAdUnitId': rewardedAdUnitId,
                    'ads.interstitialInterval': parseNum(interstitialInterval, 3),
                    'ads.cooldowns.rewardedAd': parseNum(rewardedCooldown, 60),
                    'ads.cooldowns.interstitialAd': parseNum(interstitialCooldown, 180),
                    'ads.rewards.reviveEnabled': reviveEnabled === 'on',
                    'ads.rewards.coinsPerAd': parseNum(coinsPerAd, 0),
                    'ads.rewards.gemsPerAd': parseNum(gemsPerAd, 0),
                    'ads.rewards.dailyLimit': parseNum(dailyLimit, 10)
                }
            },
            { upsert: true }
        );

        await logAdminAction(
            req.user._id,
            'UPDATE_CONFIG',
            'GameConfig',
            'global_settings',
            'Oyun ayarları güncellendi',
            req.ip
        );

        req.flash('success_msg', 'Ayarlar başarıyla güncellendi!');
        res.redirect('/admin/config');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// @desc    List Items
// @route   GET /admin/items
exports.getItems = async (req, res) => {
    try {
        const { type, search } = req.query;
        let query = {};
        
        if (type && type !== 'all') {
            query.type = type;
        }
        
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const items = await Item.find(query).sort({ type: 1, order: 1 });
        
        // Get counts for each type for the badges
        const counts = await Item.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);
        
        const typeCounts = {};
        counts.forEach(c => typeCounts[c._id] = c.count);
        typeCounts.all = await Item.countDocuments();

        res.render('admin/items', {
            title: 'Market Yönetimi',
            items,
            currentType: type || 'all',
            typeCounts,
            search: search || ''
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// @desc    Show Item Form (New/Edit)
// @route   GET /admin/items/new OR /admin/items/edit/:id
exports.getItemForm = async (req, res) => {
    try {
        let item = null;
        if (req.params.id) {
            item = await Item.findById(req.params.id);
        }
        res.render('admin/item_form', {
            title: item ? 'Eşyayı Düzenle' : 'Yeni Eşya Ekle',
            item
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// @desc    Save Item (Create/Update)
// @route   POST /admin/items/save
exports.saveItem = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('error_msg', errors.array()[0].msg);
            return res.redirect(req.body.id ? `/admin/items/edit/${req.body.id}` : '/admin/items/new');
        }

        // Basic sanitization
        if (req.body.name) req.body.name = req.body.name.trim();
        if (req.body.description) req.body.description = req.body.description.trim();
        
        const { 
            id, name, description, type, price, currencyType, 
            imageUrl, color, speed, damage, health, duration,
            isPremium, isActive, order 
        } = req.body;

        const itemData = {
            name,
            description,
            type,
            price: parseFloat(price),
            currencyType,
            imageUrl,
            color,
            stats: {
                speed: parseFloat(speed) || 0,
                damage: parseFloat(damage) || 0,
                health: parseFloat(health) || 0,
                duration: parseFloat(duration) || 0
            },
            isPremium: isPremium === 'on',
            isActive: isActive === 'on',
            order: parseInt(order) || 0
        };

        if (id) {
            await Item.findByIdAndUpdate(id, itemData);
            await logAdminAction(req.user._id, 'UPDATE_ITEM', 'Item', id, `${name} eşyası güncellendi`, req.ip);
        } else {
            const newItem = await Item.create(itemData);
            await logAdminAction(req.user._id, 'CREATE_ITEM', 'Item', newItem._id, `${name} eşyası oluşturuldu`, req.ip);
        }

        req.flash('success_msg', 'Eşya başarıyla kaydedildi!');
        res.redirect('/admin/items');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete Item
// @route   POST /admin/items/delete/:id
exports.deleteItem = async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        await logAdminAction(req.user._id, 'DELETE_ITEM', 'Item', req.params.id, `Eşya silindi`, req.ip);
        req.flash('success_msg', 'Eşya başarıyla silindi!');
        res.redirect('/admin/items');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all bosses
// @route   GET /admin/bosses
exports.getBosses = async (req, res) => {
    try {
        const bosses = await Boss.find().sort({ order: 1, createdAt: -1 });
        const config = await GameConfig.findOne({ key: 'global_settings' }); // Fetch config for Fallback State

        res.render('admin/bosses', {
            title: 'Boss Yönetimi',
            bosses,
            config, // PASS Config
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Update boss (hp, order)
// @route   POST /admin/bosses/update/:id
exports.updateBoss = async (req, res) => {
    try {
        const { hpMult, order } = req.body;
        const boss = await Boss.findOne({ id: req.params.id });
        if (!boss) return res.status(404).json({ success: false, error: "Boss not found" });

        if(hpMult !== undefined) boss.hpMult = parseFloat(hpMult);
        if(order !== undefined) boss.order = parseInt(order);

        await boss.save();
        
        // Log?
        // await logAdminAction(...)

        res.json({ success: true, boss });
    } catch(err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete a boss
// @route   POST /admin/bosses/delete/:id
exports.deleteBoss = async (req, res) => {
    try {
        // Find by custom 'id' string, not _id
        const boss = await Boss.findOne({ id: req.params.id });
        if (!boss) {
            req.flash('error_msg', 'Boss bulunamadı');
            return res.redirect('/admin/bosses');
        }
        
        // Prevent deleting system bosses (optional safety)
        // if (boss.isGlobal) { ... } 

        await Boss.findOneAndDelete({ id: req.params.id });
        
        await logAdminAction(
            req.user._id, 
            'DELETE', 
            'Boss', 
            req.params.id, 
            `Boss Silindi: ${boss.name}`, 
            req.ip
        );
        
        req.flash('success_msg', 'Boss başarıyla silindi!');
        res.redirect('/admin/bosses');
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Toggle boss status
// @route   POST /admin/bosses/toggle/:id
exports.toggleBoss = async (req, res) => {
    try {
        const boss = await Boss.findOne({ id: req.params.id });
        if (boss) {
            boss.enabled = !boss.enabled;
            await boss.save();
            req.flash('success_msg', `Boss ${boss.enabled ? 'aktif' : 'pasif'} hale getirildi.`);
        }
        res.redirect('/admin/bosses');
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Get all feedbacks
// @route   GET /admin/feedbacks
exports.getFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Feedback.find().populate('user', 'username email').sort({ createdAt: -1 });
        res.render('admin/feedbacks', {
            title: 'Geri Bildirimler',
            feedbacks,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Delete a feedback
// @route   POST /admin/feedbacks/delete/:id
exports.deleteFeedback = async (req, res) => {
    try {
        await Feedback.findByIdAndDelete(req.params.id);
        await logAdminAction(req.user._id, 'DELETE_FEEDBACK', 'Feedback', req.params.id, 'Geri bildirim silindi', req.ip);
        req.flash('success_msg', 'Geri bildirim silindi!');
        res.redirect('/admin/feedbacks');
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Get all cheat logs
// @route   GET /admin/cheat-logs
exports.getCheatLogs = async (req, res) => {
    try {
        const logs = await CheatLog.find().populate('user', 'username email').sort({ createdAt: -1 }).limit(200);
        res.render('admin/cheat_logs', {
            title: 'Hile Kayıtları',
            logs,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Clear all cheat logs
// @route   POST /admin/cheat-logs/clear
exports.clearCheatLogs = async (req, res) => {
    try {
        await CheatLog.deleteMany({});
        await logAdminAction(req.user._id, 'CLEAR_CHEAT_LOGS', 'CheatLog', 'all', 'Tüm hile kayıtları temizlendi', req.ip);
        req.flash('success_msg', 'Tüm hile kayıtları temizlendi!');
        res.redirect('/admin/cheat-logs');
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Get all translations
// @route   GET /admin/translations
exports.getTranslations = async (req, res) => {
    try {
        const translations = await Translation.find().sort({ language: 1 });
        res.render('admin/translations', {
            title: 'Dil Çevirileri',
            translations,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Get translation edit form
// @route   GET /admin/translations/edit/:lang
exports.getTranslationEdit = async (req, res) => {
    try {
        const translation = await Translation.findOne({ language: req.params.lang });
        if (!translation) {
            return res.status(404).send('Dil bulunamadı');
        }
        res.render('admin/translation_form', {
            title: `Çeviri Düzenle: ${translation.language.toUpperCase()}`,
            translation,
            jsonData: JSON.stringify(translation.data, null, 4),
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Save translation
// @route   POST /admin/translations/save
exports.saveTranslation = async (req, res) => {
    try {
        const { language, jsonData } = req.body;
        let data;
        try {
            data = JSON.parse(jsonData);
        } catch (e) {
            return res.status(400).send('Geçersiz JSON formatı');
        }

        await Translation.findOneAndUpdate(
            { language },
            { data, lastUpdated: Date.now() },
            { upsert: true }
        );

        await logAdminAction(req.user._id, 'UPDATE_TRANSLATION', 'Translation', language, `${language.toUpperCase()} çevirisi güncellendi`, req.ip);

        req.flash('success_msg', 'Çeviri başarıyla güncellendi!');
        res.redirect('/admin/translations');
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Get Legal Content Editor
// @route   GET /admin/legal
exports.getLegal = async (req, res) => {
    try {
        const lang = req.query.lang || 'tr';
        const translations = await Translation.find({}, 'language').sort({ language: 1 });
        const translation = await Translation.findOne({ language: lang });
        
        if (!translation) {
            return res.status(404).send('Dil bulunamadı');
        }

        // Calculate how many sections exist
        let sectionCount = 0;
        if (translation.data) {
            while (translation.data[`auth.terms.h${sectionCount + 1}`]) {
                sectionCount++;
            }
        }
        
        // Ensure at least 1 section if empty
        if (sectionCount === 0) sectionCount = 1;

        res.render('admin/legal', {
            title: 'Kullanıcı Sözleşmesi',
            translation,
            translations,
            currentLang: lang,
            sectionCount,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Save Legal Content
// @route   POST /admin/legal/save
exports.saveLegal = async (req, res) => {
    try {
        const { language, modal_title, last_updated, accept_text } = req.body;
        
        const translation = await Translation.findOne({ language });
        if (!translation) {
            return res.status(404).send('Dil bulunamadı');
        }

        // Update basic terms keys
        translation.data['auth.terms.modal_title'] = modal_title;
        translation.data['auth.terms.last_updated'] = last_updated;
        translation.data['auth.terms.accept'] = accept_text;

        // Clear existing sections in data to allow decreasing sections if needed (optional)
        // Or just overwrite. Overwriting might leave old sections if we reduce count.
        // Let's remove all auth.terms.h and auth.terms.p before saving new ones
        Object.keys(translation.data).forEach(key => {
            if (key.startsWith('auth.terms.h') || key.startsWith('auth.terms.p')) {
                // Keep modal_title, last_updated, accept, agree_prefix, etc.
                if (!['auth.terms.modal_title', 'auth.terms.last_updated', 'auth.terms.accept', 'auth.terms.link', 'auth.terms.agree_prefix', 'auth.terms.agree_suffix', 'auth.terms.close'].includes(key)) {
                    delete translation.data[key];
                }
            }
        });

        // Find all hX and pX in body
        let i = 1;
        while (req.body[`h${i}`] !== undefined) {
            const hVal = req.body[`h${i}`];
            const pVal = req.body[`p${i}`] || "";
            
            translation.data[`auth.terms.h${i}`] = hVal;
            translation.data[`auth.terms.p${i}`] = pVal;
            i++;
        }

        translation.markModified('data');
        await translation.save();

        await logAdminAction(req.user._id, 'UPDATE_LEGAL', 'Translation', language, `Kullanıcı sözleşmesi güncellendi (${language.toUpperCase()})`, req.ip);

        req.flash('success_msg', 'Kullanıcı sözleşmesi başarıyla güncellendi!');
        res.redirect(`/admin/legal?lang=${language}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Get Audit Logs
// @route   GET /admin/audit-logs
exports.getAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        
        const totalLogs = await AuditLog.countDocuments();
        const logs = await AuditLog.find()
            .populate('admin', 'username')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.render('admin/audit_logs', {
            title: 'İşlem Günlükleri',
            logs,
            user: req.user,
            currentPage: page,
            totalPages: Math.ceil(totalLogs / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
};

// @desc    Generate AI Boss
// @route   POST /admin/generate-boss
exports.generateBoss = async (req, res) => {
    try {
        const { theme, enableFallback } = req.body;
        
        // UPDATE FALLBACK SETTING DYNAMICALLY
        // If the admin checked "enableFallback", we update the global config to allow it.
        // If unchecked, we explicitly disable it in global config so AiGenerator respects the choice.
        if (typeof enableFallback !== 'undefined') {
            await GameConfig.updateOne(
                { key: 'global_settings' },
                { $set: { 'ai.enableFallback': enableFallback === true || enableFallback === 'true' } },
                { upsert: true }
            );
        }

        // Fetch existing bosses to send as "anti-patterns"
        // STRATEGY: Fetch all recent bosses (up to 200) to ensure the AI knows the ENTIRE history
        const recentBosses = await Boss.find({}, 'name visualType description').sort({ createdAt: -1 }).limit(200);
        
        // Create a dense summary of what exists to prevent repetition
        // We include the description so the AI knows exactly what the previous boss LOOKED like.
        const antiPatternList = recentBosses.map(b => `[EXISTING BOSS -> Name: "${b.name}" | Visual: "${b.visualType}" | Desc: "${(b.description || '').substring(0, 100)}"]`).join("\n");
        
        // Also capture the most recent code logic to prevent copy-paste behavior
        const lastBoss = await Boss.findOne().sort({ createdAt: -1 }).select('logic.draw');
        let lastBossCodeSnippet = "";
        if (lastBoss && lastBoss.logic && lastBoss.logic.draw) {
            const drawStr = Array.isArray(lastBoss.logic.draw) ? lastBoss.logic.draw.join('\n') : String(lastBoss.logic.draw);
            lastBossCodeSnippet = drawStr.substring(0, 300) + "..."; 
        }

        const bossData = await AiGenerator.generateBossPrototype(theme, antiPatternList, lastBossCodeSnippet);
        const generationLogs = bossData.logs || []; // Extract logs
        delete bossData.logs; // Clean up
        
        // SAVE TO DATABASE
        // Ensure ID is unique if collision happens (unlikely with random but safe to check)
        const newBoss = new Boss(bossData);
        await newBoss.save();
        console.log("AdminController: Boss Saved to DB -> " + newBoss.id);

        // Log this action
        if (req.user) {
            await logAdminAction(
                req.user._id,
                'CREATE',
                'Boss',
                bossData.id,
                `AI Generated Boss: ${bossData.name} (${bossData.visualType})`,
                req.ip
            );
        }

        res.json({ success: true, data: bossData, logs: generationLogs });
    } catch (err) {
        console.error("Boss Generation Error:", err);
        const logs = err.logs || [];
        res.status(500).json({ success: false, error: err.message, logs: logs });
    }
};

