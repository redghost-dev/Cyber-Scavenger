const User = require('../models/User');
const geoip = require('geoip-lite');

const onlineTracker = async (req, res, next) => {
    if (req.isAuthenticated() && req.user) {
        try {
            const updateFields = { lastActive: new Date() };

            // If user has 'UN' (Unknown) country code, try to detect it
            if (req.user.countryCode === 'UN') {
                // In local dev, req.ip might be ::1 or 127.0.0.1 which geoip doesn't like
                const ip = req.ip;
                const geo = geoip.lookup(ip);
                
                if (geo && geo.country) {
                    updateFields.countryCode = geo.country;
                    req.user.countryCode = geo.country; // Update current session user
                }
            }

            // Update lastActive and potentially countryCode
            await User.findByIdAndUpdate(req.user._id, updateFields);
        } catch (err) {
            console.error('Error updating lastActive:', err);
        }
    }
    next();
};

module.exports = onlineTracker;
