const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAdmin } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const { body } = require('express-validator');

const csrfProtection = csrf({ cookie: true });

// Stricter rate limit for admin panel
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests per 15 minutes
    message: 'Admin paneli için çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.'
});

// Validation Rules
const configValidation = [
    body('enemyHealthMultiplier').isFloat({ min: 0.1 }).withMessage('Düşman can çarpanı en az 0.1 olmalıdır'),
    body('xpRate').isFloat({ min: 0.1 }).withMessage('XP oranı en az 0.1 olmalıdır'),
    body('coinDropRate').isFloat({ min: 0, max: 1 }).withMessage('Loot oranı 0 ile 1 arasında olmalıdır'),
    body('coinsPerPickup').isInt({ min: 0 }).withMessage('Coin miktarı negatif olamaz'),
    body('maxLevel').isInt({ min: 1 }).withMessage('Maksimum seviye en az 1 olmalıdır'),
    body('powerupSpawnInterval').isInt({ min: 1000 }).withMessage('Powerup aralığı en az 1000ms olmalıdır'),
    body('powerupChance').isFloat({ min: 0, max: 1 }).withMessage('Powerup şansı 0-1 arasında olmalıdır'),
    body('healDropRate').isFloat({ min: 0, max: 1 }).withMessage('Can düşme oranı 0-1 arasında olmalıdır'),
    body('interstitialInterval').isInt({ min: 0 }).withMessage('Reklam aralığı negatif olamaz'),
    body('rewardedCooldown').isInt({ min: 0 }).withMessage('Bekleme süresi negatif olamaz'),
    body('coinsPerAd').isInt({ min: 0 }).withMessage('Ödül miktarı negatif olamaz'),
    body('dailyLimit').isInt({ min: 1 }).withMessage('Günlük limit en az 1 olmalıdır')
];

const itemValidation = [
    body('name').trim().notEmpty().withMessage('Eşya adı zorunludur'),
    body('price').isFloat({ min: 0 }).withMessage('Fiyat negatif olamaz'),
    body('type').notEmpty().withMessage('Eşya türü seçilmelidir'),
    body('order').isInt({ min: 0 }).withMessage('Sıralama negatif olamaz')
];

// All routes here require admin access
router.use(ensureAdmin);
router.use(adminLimiter);
router.use(csrfProtection);

// Middleware to pass CSRF token to all views
router.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

// Dashboard
router.get('/', adminController.getDashboard);

// Simulation & Analytics
router.get('/simulation', adminController.getSimulation);

// User Management
router.get('/users', adminController.getUsers);
router.get('/users/edit/:id', adminController.getUserEdit);
router.post('/users/save', adminController.saveUser);
router.post('/users/ban/:id', adminController.banUser);
router.post('/users/reset-password/:id', adminController.resetPassword);
router.post('/users/bulk-action', adminController.bulkUserAction);

// Game Config
router.get('/config', adminController.getConfig);
router.post('/config', configValidation, adminController.updateConfig);

// Market (Item) Management
router.get('/items', adminController.getItems);
router.get('/items/new', adminController.getItemForm);
router.get('/items/edit/:id', adminController.getItemForm);
router.post('/items/save', itemValidation, adminController.saveItem);
router.post('/items/delete/:id', adminController.deleteItem);

// Feedbacks
router.get('/feedbacks', adminController.getFeedbacks);
router.post('/feedbacks/delete/:id', adminController.deleteFeedback);

// Cheat Logs
router.get('/cheat-logs', adminController.getCheatLogs);
router.post('/cheat-logs/clear', adminController.clearCheatLogs);

// Translations
router.get('/translations', adminController.getTranslations);
router.get('/translations/edit/:lang', adminController.getTranslationEdit);
router.post('/translations/save', adminController.saveTranslation);

// Boss Management
router.get('/bosses', adminController.getBosses);
router.post('/bosses/update/:id', adminController.updateBoss);
router.post('/bosses/delete/:id', adminController.deleteBoss);
router.post('/bosses/toggle/:id', adminController.toggleBoss);

// Legal Content (Terms of Conduct)
router.get('/legal', adminController.getLegal);
router.post('/legal/save', adminController.saveLegal);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

// AI Generation
router.post('/generate-boss', adminController.generateBoss);

module.exports = router;
