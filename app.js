require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');

const app = express();

// Connect to MongoDB
connectDB();

// EJS Setup
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('views', './views');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Add method-override middleware
app.use(methodOverride('_method'));

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/cafe_management',
        ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Middleware to make user data available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Import auth middleware
const { isAuthenticated } = require('./middleware/auth');

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
// Protected routes
app.use('/menu', isAuthenticated, require('./routes/menu'));
app.use('/users', isAuthenticated, require('./routes/users'));
app.use('/orders', isAuthenticated, require('./routes/orders'));
app.use('/reports', isAuthenticated, require('./routes/reports'));
// Add other routes here

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
