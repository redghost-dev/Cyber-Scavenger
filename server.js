const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const setupCronJobs = require('./jobs/cron');
require('dotenv').config();

// Passport Config
require('./config/passport')(passport);

// Connect to Database
connectDB();

// Initialize Cron Jobs
setupCronJobs();

const app = express();
const port = process.env.PORT || 3001;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disabled to allow inline scripts/styles for game
    frameguard: false // Allow iframe embedding for VS Code Simple Browser
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // Limit each IP to 1000 requests per windowMs (higher for game assets)
});
app.use(limiter);

// Trust Proxy (Required for VS Code Port Forwarding)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session Setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        // Güvenlik Ayarı:
        // Production (Canlı): HTTPS zorunlu (secure: true)
        // Development (Test): HTTP izinli (secure: false)
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Online Tracker Middleware
app.use(require('./middleware/onlineTracker'));

// Global Variables Middleware
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/api', require('./routes/api'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/translations', require('./routes/translations'));

// Start Server
app.listen(port, '127.0.0.1', () => {
    console.log(`Cyber Scavenger running on port ${port}`);
});
