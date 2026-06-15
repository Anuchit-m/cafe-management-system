const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit')
const User = require('../models/User');
const { resolveInclude } = require('ejs');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'you are login many time try again in 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req,res) => {
        res.render('pages/login',{
            error: 'พยายาม login มากเกินไป รอ 15 นาที',
            layout: 'layouts/main'
        });
    }
});


// Login
router.post('/login',loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password ) {
            return res.render('pages/login',{
                error: 'กรุณากรอกชื่อผูใช้และรหัสผ่าน',
                layout: 'layouts/main'
            });
        }

        const user = await User.findOne({username});
        if (!user){
            return res.render('pages/login',{
                error: 'Username and Password Not Correct',
                layout: 'layouts/main'
            });
        }

        const isMatch = await user.comparePassword(password);
        if(!isMatch){
            return res.render('pages/login',{
                error: 'Username and Password Not Correct',
                layout: 'layouts/main'
            });
        }

        // Set session
        req.session.user = {
            id: user._id,
            username: user.username,
            role: user.role,
            fullName: user.fullName
        };
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.render('pages/login', { 
                    error: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
                    layout: 'layouts/main'
                });
            }
            res.redirect('/dashboard');
        });
    } catch (error) {
        console.error('Login error:', error);
        res.render('pages/login', { 
            error: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
            layout: 'layouts/main'
        });
    }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, confirmPassword, fullName, email } = req.body;

    if(!username || !password || !confirmPassword){
        return res.render('pages/register',{
            error:'กรุณากรอกข้อมูลให้ครบ',
            layout: 'layouts/main'
        });
    }
    if (password !== confirmPassword){
        return res.render('pages/register',{
            error: 'รหัสผ่านไม่ตรงกัน',
            layout: 'layouts/main',
        });
    }
    // ตรวจสอบว่ามีชื่อผู้ใช้นี้แล้วหรือไม่
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render('pages/register', { 
        error: 'มีชื่อผู้ใช้นี้ในระบบแล้ว',
        layout: 'layouts/main'
      });
    }

    const user = new User ({username,password,fullName,email,role:'staff'});
    await user.save();

    res.redirect('/?success=registered');
}catch (error) {
    console.error('Register error:',error);
    res.render('pages/register',{
        error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
        layout: 'layouts/main'
    });
}
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
        }
        res.redirect('/');
    });
});

module.exports = router; 