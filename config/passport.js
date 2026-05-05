const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
    // Local Strategy
    passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
        try {
            // Match User
            const user = await User.findOne({ email: email });
            if (!user) {
                return done(null, false, { message: 'That email is not registered' });
            }

            // Match Password
            if (!user.password) {
                return done(null, false, { message: 'Please log in with Google' });
            }

            const isMatch = await user.matchPassword(password);
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Password incorrect' });
            }
        } catch (err) {
            return done(err);
        }
    }));

    // Google Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL,
        passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            // If user is logged in as guest, link the account
            if (req.user && req.user.isGuest) {
                let existingUser = await User.findOne({ googleId: profile.id });
                if (existingUser) {
                    // Google account already exists, switch to it
                    return done(null, existingUser);
                }

                // Link Google to the guest account
                const user = await User.findById(req.user._id);
                user.googleId = profile.id;
                user.email = profile.emails[0].value;
                user.displayName = profile.displayName;
                user.avatar = profile.photos[0].value;
                user.isGuest = false;
                
                // Ensure email isn't taken by another local account
                const emailExists = await User.findOne({ email: user.email });
                if (emailExists && emailExists._id.toString() !== user._id.toString()) {
                    return done(null, emailExists);
                }

                await user.save();
                return done(null, user);
            }

            // Standard Google Login/Register
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
                return done(null, user);
            }

            // Create new user
            let username = profile.displayName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);
            
            user = await User.create({
                googleId: profile.id,
                displayName: profile.displayName,
                email: profile.emails[0].value,
                username: username,
                avatar: profile.photos[0].value
            });

            return done(null, user);
        } catch (err) {
            console.error(err);
            return done(err, null);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};