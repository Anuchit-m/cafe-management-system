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

//SESSION from env
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24*60*60 // seconds (1 day)
    })
}));

app.use((req,res,next)=>{
    res.locals.user = req.session.user || null;
    res.locals.currentPath = req.path;
    next();
})

const {isAuthenticated,isAdmin} = require('./middleware/auth')

//public routes
app.use('/',require('./routes/index'));
app.use('/auth',require('./routes/auth'))

// routes for login
app.use('/menu', isAuthenticated, require('./routes/menu'));
app.use('/orders', isAuthenticated, require('./routes/orders'));
app.use('/self-orders', require('./routes/selfOrder'));
app.use('/tables', isAuthenticated, require('./routes/tables'));
app.use('/payment', isAuthenticated, require('./routes/payment'));

app.use('/users', isAuthenticated, isAdmin, require('./routes/users'));
app.use('/reports', isAuthenticated, isAdmin, require('./routes/reports'));

app.use((req,res)=>{
    res.status(404).render('pages/error',{
        title:'ไม่พบหน้า',
        layout: 'layouts/main',
        statusCode: 404,
        message: 'ไม่พบหน้าที่คุณต้องการ'
    });
});

app.use((err,req,res,next)=>{
    console.error(`[${new Date().toISOString()}]ERROR:`,err.stack);
    res.status(500).render('pages/error',{
        title:'เกิดข้อผิดพลาด',
        layout: 'layouts/main',
        statusCode: 500,
        message: process.env.NODE_ENV === 'production'
            ? 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง'
            : err.message
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});