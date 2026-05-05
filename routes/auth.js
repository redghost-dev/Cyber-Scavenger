const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');
const geoip = require('geoip-lite');

// @desc    Login Page
// @route   GET /auth/login
router.get('/login', (req, res) => {
    res.render('login', { 
        message: req.flash('error'),
        success_msg: req.flash('success_msg')
    });
});

// @desc    Register Page
// @route   GET /auth/register
router.get('/register', (req, res) => {
    res.render('register', { message: req.flash('error') });
});

// @desc    Terms of Service Page
// @route   GET /auth/terms or /terms
router.get('/terms', (req, res) => {
    res.render('terms');
});

// @desc    Register User
// @route   POST /auth/register
router.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword, avatarColor, countryCode, captcha, captchaAnswer, captchaTiming, captchaMovements, agreeTerms, emailNotifications } = req.body;
    let errors = [];

    // Validate all required fields
    if (!username || !email || !password || !confirmPassword) {
        errors.push({ msg: 'Please enter all required fields' });
    }
    
    // CAPTCHA validation (slider position, timing, movements)
    if (!captcha || !captchaAnswer || !captchaTiming || !captchaMovements) {
        errors.push({ msg: 'Please complete the slider security verification' });
    } else {
        const userPosition = parseInt(captcha);
        const targetPosition = parseInt(captchaAnswer);
        const timeTaken = parseFloat(captchaTiming);
        const movements = parseInt(captchaMovements);
        const positionTolerance = 20;
        
        // Position check
        if (Math.abs(userPosition - targetPosition) > positionTolerance) {
            errors.push({ msg: 'Slider position verification failed. Please try again.' });
        }
        
        // Timing check (too fast = bot)
        if (timeTaken < 0.2) {
            errors.push({ msg: 'Verification completed too quickly. Please try again.' });
        }
        
        // Movement pattern check (too few movements = bot)
        if (movements < 2) {
            errors.push({ msg: 'Please complete the slider verification properly.' });
        }
    }
    
    // Terms acceptance validation
    if (!agreeTerms || agreeTerms !== 'on') {
        errors.push({ msg: 'You must accept the Terms of Service' });
    }

    // Username validation
    if (username && (username.length < 3 || username.length > 20)) {
        errors.push({ msg: 'Username must be between 3 and 20 characters' });
    }

    // Password validation
    if (password && password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    // Password confirmation check
    if (password && confirmPassword && password !== confirmPassword) {
        errors.push({ msg: 'Passwords do not match' });
    }

    // Password strength validation
    if (password) {
        let strength = 0;
        if (password.length >= 6) strength += 1;
        if (password.length >= 10) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

        if (strength < 3) {
            errors.push({ msg: 'Password is too weak. Use at least medium strength (mix of letters, numbers, and symbols)' });
        }
    }

    if (errors.length > 0) {
        res.render('register', {
            errors,
            username,
            email,
            password,
            message: []
        });
    } else {
        try {
            let user = await User.findOne({ email: email });
            if (user) {
                errors.push({ msg: 'Email already exists' });
                return res.render('register', {
                    errors,
                    username,
                    email,
                    password,
                    message: []
                });
            }

            // Check username
            let userByName = await User.findOne({ username: username });
            if (userByName) {
                errors.push({ msg: 'Username already taken' });
                return res.render('register', {
                    errors,
                    username,
                    email,
                    password,
                    message: []
                });
            }

            // Generate avatar URL with color theme
            const colorSeed = avatarColor || 'cyan';
            const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}&backgroundColor=${colorSeed}`;

            // Auto-detect country if UN or not provided
            let finalCountryCode = countryCode;
            if (!finalCountryCode || finalCountryCode === 'UN') {
                const geo = geoip.lookup(req.ip);
                if (geo && geo.country) {
                    finalCountryCode = geo.country;
                } else {
                    finalCountryCode = 'UN';
                }
            }

            const newUser = new User({
                username,
                email,
                password,
                displayName: username,
                avatar: avatarUrl,
                countryCode: finalCountryCode,
                emailNotifications: emailNotifications === 'on'
            });

            await newUser.save();
            req.flash('success_msg', 'You are now registered and can log in');
            res.redirect('/auth/login');
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    }
});

// @desc    Login Handle
// @route   POST /auth/login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/auth/login',
        failureFlash: true
    })(req, res, next);
});

// @desc    Auth with Google
// @route   GET /auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/');
    }
);

// @desc    Logout user
// @route   GET /auth/logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// @desc    Guest Login (Create anonymous account or resume existing)
// @route   POST /auth/guest
router.post('/guest', async (req, res) => {
    try {
        const { existingGuestId } = req.body;

        // Try to resume existing session if ID provided
        if (existingGuestId) {
            const existingUser = await User.findOne({ username: existingGuestId, isGuest: true });
            if (existingUser) {
                return req.login(existingUser, (err) => {
                    if (err) return res.status(500).json({ error: 'Login error' });
                    return res.json({ success: true, redirect: '/', username: existingUser.username });
                });
            }
        }

        const guestId = Math.floor(100000 + Math.random() * 900000);
        const username = `GUEST_${guestId}`;
        
        // Check if by any miracle this username exists
        let userExists = await User.findOne({ username });
        if (userExists) {
             return res.status(500).json({ error: 'System busy, try again' });
        }

        // Auto-detect country for guests
        const geo = geoip.lookup(req.ip);
        const countryCode = (geo && geo.country) ? geo.country : 'UN';

        const newGuest = new User({
            username,
            displayName: `GUEST AGENT`,
            isGuest: true,
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}&backgroundColor=b6e3f4`,
            countryCode
        });

        await newGuest.save();

        // Use passport to login
        req.login(newGuest, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Login error' });
            }
            return res.json({ success: true, redirect: '/', username: newGuest.username });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;