module.exports = {
    ensureAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) {
            if (req.user.isBanned) {
                req.logout((err) => {
                    if (err) return next(err);
                    if (req.accepts('html')) {
                        return res.render('login', { 
                            error_msg: 'Hesabınız yasaklanmıştır. Lütfen destek ile iletişime geçin.',
                            title: 'Giriş Yap'
                        });
                    }
                    return res.status(403).json({ error: 'Account is banned' });
                });
                return;
            }
            return next();
        }
        // If the request expects HTML (browser navigation), redirect to login
        if (req.accepts('html')) {
            return res.redirect('/auth/login');
        }
        // Otherwise (API call), return 401 JSON
        res.status(401).json({ error: 'Unauthorized' });
    },
    ensureGuest: function(req, res, next) {
        if (req.isAuthenticated()) {
            return res.redirect('/');
        }
        return next();
    },
    ensureAdmin: function(req, res, next) {
        if (req.isAuthenticated()) {
            if (req.user.isBanned) {
                req.logout((err) => {
                    if (err) return next(err);
                    return res.redirect('/auth/login');
                });
                return;
            }
            if (req.user.role === 'admin') {
                return next();
            }
        }
        // If API request, return 403
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        // Otherwise redirect to home
        res.redirect('/');
    }
};